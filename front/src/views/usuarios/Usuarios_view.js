import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ModalCarregando from '../components/ModalCarregando';
import '../../styles/UsuariosView.css';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

const mapDiasBack = {
    'Segunda': 'Segunda-feira',
    'Terça':   'Terça-feira',
    'Quarta':  'Quarta-feira',
    'Quinta':  'Quinta-feira',
    'Sexta':   'Sexta-feira',
    'Sábado':  'Sábado',
    'Domingo': 'Domingo',
};

const mapDias = Object.fromEntries(
    Object.entries(mapDiasBack).map(([curto, longo]) => [longo, curto])
);

const treinoImagemUrl = (imagem) =>
    `${process.env.REACT_APP_API_BASE_URL}/uploads/${imagem}`;

const UsuariosView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userId, funcao } = useContext(AuthContext);

    const [usuario, setUsuario] = useState(null);
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const carregarDados = async () => {
            if (funcao !== 'Professor' && parseInt(id) !== parseInt(userId)) {
                navigate(`/usuarios/view/${userId}`);
                return;
            }
            try {
                const [usuarioRes, treinosRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`)
                ]);
                if (!usuarioRes.ok || !treinosRes.ok) throw new Error('Erro ao carregar dados');
                setUsuario(await usuarioRes.json());
                setTreinos(await treinosRes.json());
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };
        carregarDados();
    }, [id, userId, funcao, navigate]);

    // ── DRAG & DROP ──────────────────────────────────────────────────────

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;
        if (source.droppableId === destination.droppableId) return;

        const treinoArrastadoId  = parseInt(draggableId.replace('treino-', ''));
        const novoDiaCurto       = destination.droppableId;
        const novoDia            = mapDiasBack[novoDiaCurto] || novoDiaCurto;
        const diaOrigemCurto     = source.droppableId;
        const diaOrigem          = mapDiasBack[diaOrigemCurto] || diaOrigemCurto;

        const treinoArrastado  = treinos.find(t => t.id === treinoArrastadoId);
        if (!treinoArrastado) return;

        const treinoNoDestino  = treinos.find(t => mapDias[t.dia_semana] === novoDiaCurto);
        const treinosAnteriores = [...treinos];

        if (treinoNoDestino) {
            setTreinos(prev => prev.map(t => {
                if (t.id === treinoArrastadoId)  return { ...t, dia_semana: novoDia };
                if (t.id === treinoNoDestino.id) return { ...t, dia_semana: diaOrigem };
                return t;
            }));

            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/swap`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        treino1_id: treinoArrastadoId,
                        treino2_id: treinoNoDestino.id,
                        dia1: diaOrigem,
                        dia2: novoDia
                    })
                });
                if (!res.ok) setTreinos(treinosAnteriores);
            } catch {
                setTreinos(treinosAnteriores);
            }
        } else {
            setTreinos(prev => prev.map(t =>
                t.id === treinoArrastadoId ? { ...t, dia_semana: novoDia } : t
            ));

            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/${treinoArrastadoId}/dia`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dia_semana: novoDia })
                });
                if (!res.ok) setTreinos(treinosAnteriores);
            } catch {
                setTreinos(treinosAnteriores);
            }
        }
    };

    const handleDeleteTreino = async (treinoId) => {
        if (!window.confirm('Tem certeza que deseja excluir este treino?')) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'DELETE'
            });
            if (res.ok) setTreinos(treinos.filter(t => t.id !== treinoId));
        } catch {
            alert('Erro ao excluir treino.');
        }
    };

    // ── RENDER ────────────────────────────────────────────────────────────

    if (loading) return <ModalCarregando show={true} />;
    if (error)   return <div style={{ color: 'red', padding: '2rem' }}>Erro: {error}</div>;
    if (!usuario) return <div style={{ padding: '2rem' }}>Usuário não encontrado.</div>;

    return (
        <div className="uv-page">

            {/* ── HEADER ── */}
            <div className="uv-header">
                {usuario.avatar ? (
                    <img src={usuario.avatar} alt="Avatar" className="uv-avatar" />
                ) : (
                    <div className="uv-avatar-placeholder">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                )}

                <h1 className="uv-user-name">{usuario.nome}</h1>

                <div className="uv-stats-row">
                    {usuario.peso && (
                        <div className="uv-stat-chip">
                            <span className="uv-stat-chip-val">{usuario.peso} kg</span>
                            <span className="uv-stat-chip-lbl">Peso</span>
                        </div>
                    )}
                    {usuario.altura && (
                        <div className="uv-stat-chip">
                            <span className="uv-stat-chip-val">{usuario.altura} cm</span>
                            <span className="uv-stat-chip-lbl">Altura</span>
                        </div>
                    )}
                    {usuario.genero && (
                        <div className="uv-stat-chip">
                            <span className="uv-stat-chip-val">{usuario.genero}</span>
                            <span className="uv-stat-chip-lbl">Gênero</span>
                        </div>
                    )}
                </div>

                <button
                    className="uv-btn-new"
                    onClick={() => navigate(`/usuarios/${id}/treinos`)}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Criar Novo Treino
                </button>
            </div>

            {/* ── BOARD ── */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="uv-board">
                    {diasSemana.map((dia) => {
                        const treinosDoDia = treinos.filter(t => mapDias[t.dia_semana] === dia);
                        const temTreino    = treinosDoDia.length > 0;

                        return (
                            <div className="uv-day-block" key={dia}>

                                {/* Header do dia */}
                                <div className="uv-day-header">
                                    <span className="uv-day-name">{mapDiasBack[dia]}</span>
                                    {temTreino && (
                                        <span className="uv-day-badge">{treinosDoDia[0].grupo_muscular || 'Treino'}</span>
                                    )}
                                </div>

                                {/* Drop zone */}
                                <Droppable droppableId={dia}>
                                    {(provided, snapshot) => (
                                        <div
                                            className="uv-droppable"
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            {temTreino ? (
                                                treinosDoDia.map((t, index) => (
                                                    <Draggable
                                                        key={t.id}
                                                        draggableId={`treino-${t.id}`}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`uv-workout-card${snapshot.isDragging ? ' uv-dragging' : ''}`}
                                                                style={provided.draggableProps.style}
                                                            >
                                                                {/* Thumbnail */}
                                                                <div className="uv-thumb">
                                                                    {t.imagem ? (
                                                                        <img
                                                                            src={treinoImagemUrl(t.imagem)}
                                                                            alt={t.nome_treino}
                                                                        />
                                                                    ) : (
                                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                                                                        </svg>
                                                                    )}
                                                                </div>

                                                                {/* Info */}
                                                                <div className="uv-workout-info">
                                                                    <p className="uv-workout-name">{t.nome_treino}</p>
                                                                    {t.descricao && (
                                                                        <p className="uv-workout-desc">{t.descricao}</p>
                                                                    )}
                                                                </div>

                                                                {/* Ações + drag handle */}
                                                                <div className="uv-workout-side">
                                                                    <div {...provided.dragHandleProps} className="uv-drag-handle">
                                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                                                            <line x1="8" y1="6" x2="21" y2="6"/>
                                                                            <line x1="8" y1="12" x2="21" y2="12"/>
                                                                            <line x1="8" y1="18" x2="21" y2="18"/>
                                                                            <line x1="3" y1="6" x2="3.01" y2="6"/>
                                                                            <line x1="3" y1="12" x2="3.01" y2="12"/>
                                                                            <line x1="3" y1="18" x2="3.01" y2="18"/>
                                                                        </svg>
                                                                    </div>
                                                                    <div className="uv-actions">
                                                                        <button
                                                                            className="uv-btn-edit"
                                                                            onClick={() => navigate(`/treinos/edit/${id}/${t.id}`)}
                                                                        >
                                                                            Editar
                                                                        </button>
                                                                        <button
                                                                            className="uv-btn-delete"
                                                                            onClick={() => handleDeleteTreino(t.id)}
                                                                        >
                                                                            Excluir
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))
                                            ) : (
                                                <div className={`uv-empty-day${snapshot.isDraggingOver ? ' drag-over' : ''}`}>
                                                    Arraste um treino para cá
                                                </div>
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
};

export default UsuariosView;
