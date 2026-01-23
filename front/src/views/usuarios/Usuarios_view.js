import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import {
    DragDropContext,
    Droppable,
    Draggable
} from "@hello-pangea/dnd";
import '../../styles/Board.css';
import ModalCarregando from '../components/ModalCarregando';

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const mapDiasBack = {
    'Segunda': 'Segunda-feira',
    'Terça': 'Terça-feira',
    'Quarta': 'Quarta-feira',
    'Quinta': 'Quinta-feira',
    'Sexta': 'Sexta-feira',
    'Sábado': 'Sábado',
    'Domingo': 'Domingo'
};
const mapDias = Object.fromEntries(
    Object.entries(mapDiasBack).map(([curto, longo]) => [longo, curto])
);

const UsuariosView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId, funcao } = useContext(AuthContext);

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

                const usuarioData = await usuarioRes.json();
                const treinosData = await treinosRes.json();

                setUsuario(usuarioData);
                setTreinos(treinosData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        carregarDados();
    }, [id, userId, funcao, navigate]);

    // Substituir apenas a função handleDragEnd no seu componente UsuariosView

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        // Se não há destino ou moveu para o mesmo lugar, não faz nada
        if (!destination) return;
        if (source.droppableId === destination.droppableId) return;

        const treinoArrastadoId = parseInt(draggableId.replace("treino-", ""));
        const novoDiaCurto = destination.droppableId;
        const novoDia = mapDiasBack[novoDiaCurto] || novoDiaCurto;
        const diaOrigemCurto = source.droppableId;
        const diaOrigem = mapDiasBack[diaOrigemCurto] || diaOrigemCurto;

        // Busca treino que está sendo arrastado
        const treinoArrastado = treinos.find(t => t.id === treinoArrastadoId);
        if (!treinoArrastado) return;

        // Busca se já existe treino no dia de destino
        const treinoNoDestino = treinos.find(t => mapDias[t.dia_semana] === novoDiaCurto);

        // Guarda estado anterior para rollback
        const treinosAnteriores = [...treinos];

        if (treinoNoDestino) {
            // 🔄 SWAP: troca os dois treinos de lugar
            console.log(`🔄 Fazendo swap: Treino ${treinoArrastadoId} (${diaOrigem}) ↔️ Treino ${treinoNoDestino.id} (${novoDia})`);

            // Atualiza UI otimisticamente
            setTreinos(prev =>
                prev.map(t => {
                    if (t.id === treinoArrastadoId) {
                        return { ...t, dia_semana: novoDia };
                    }
                    if (t.id === treinoNoDestino.id) {
                        return { ...t, dia_semana: diaOrigem };
                    }
                    return t;
                })
            );

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

                if (!res.ok) {
                    const error = await res.json();
                    console.error('❌ Erro ao fazer swap:', error);
                    setTreinos(treinosAnteriores); // rollback
                    alert('⚠️ Erro ao trocar treinos de lugar');
                } else {
                    const data = await res.json();
                    console.log('✅ Swap realizado com sucesso:', data);
                }
            } catch (err) {
                console.error('⚠️ Erro na requisição de swap:', err);
                setTreinos(treinosAnteriores); // rollback
                alert('⚠️ Erro ao trocar treinos de lugar');
            }
        } else {
            // 📍 Movimento simples para dia vazio
            console.log(`📍 Movendo treino ${treinoArrastadoId} de ${diaOrigem} para ${novoDia}`);

            setTreinos(prev =>
                prev.map(t =>
                    t.id === treinoArrastadoId ? { ...t, dia_semana: novoDia } : t
                )
            );

            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/${treinoArrastadoId}/dia`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dia_semana: novoDia })
                });

                if (!res.ok) {
                    console.error(`❌ Erro ao atualizar treino ${treinoArrastadoId}`);
                    setTreinos(treinosAnteriores); // rollback
                    alert('⚠️ Erro ao mover treino');
                } else {
                    console.log('✅ Treino movido com sucesso');
                }
            } catch (err) {
                console.error('⚠️ Erro na requisição:', err);
                setTreinos(treinosAnteriores); // rollback
                alert('⚠️ Erro ao mover treino');
            }
        }
    };

    const handleDeleteTreino = async (treinoId) => {
        if (!window.confirm("Tem certeza que deseja excluir este treino?")) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setTreinos(treinos.filter(t => t.id !== treinoId));
            }
        } catch {
            alert("Erro ao excluir treino.");
        }
    };

    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div className="alert alert-danger text-center mt-5">Erro: {error}</div>;
    if (!usuario) return <div className="text-center mt-5">Usuário não encontrado.</div>;

    const avatarUrl = usuario.avatar || null;

    return (
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4">Perfil do Aluno</h2>

            <div className="d-flex flex-column align-items-center mb-4">
                {avatarUrl && (
                    <img src={avatarUrl} alt="Avatar"
                         className="rounded-circle mb-3"
                         style={{ width: 140, height: 140, objectFit: 'cover' }}
                    />
                )}
                <h4 className="mb-1">{usuario.nome}</h4>
                <p className="text-muted">Peso: {usuario.peso ? `${usuario.peso} kg` : '—'} |
                    Altura: {usuario.altura ? `${usuario.altura} cm` : '—'}</p>
                <p className="text-muted">Gênero: {usuario.genero}</p>
            </div>

            <div className="mb-3 text-end">
                <button className="btn-olympus success sm" onClick={() => navigate(`/usuarios/${id}/treinos`)}>
                    + Criar Novo Treino
                </button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="d-flex flex-column gap-4">
                    {diasSemana.map((dia) => (
                        <Droppable key={dia} droppableId={dia}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="border rounded p-3 droppable-day"
                                    style={{ minHeight: 100 }}
                                >
                                    <h5 className="mb-3">{dia}</h5>
                                    {treinos
                                        .filter(t => mapDias[t.dia_semana] === dia)
                                        .map((t, index) => (
                                            <Draggable key={t.id} draggableId={`treino-${t.id}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`card mb-2 shadow-sm ${snapshot.isDragging ? "dragging" : ""}`}
                                                        style={{
                                                            cursor: 'grab',
                                                            ...provided.draggableProps.style
                                                        }}
                                                    >
                                                        <div className="card-body p-2 d-flex flex-column">
                                                            <h6 className="card-title mb-1">{t.nome_treino}</h6>
                                                            <small className="text-muted mb-2">{t.descricao}</small>
                                                            <div className="mt-auto d-flex justify-content-end gap-2">
                                                                <button
                                                                    className="btn-olympus success sm"
                                                                    onClick={() => navigate(`/treinos/edit/${id}/${t.id}`)}
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    className="btn-olympus danger sm"
                                                                    onClick={() => handleDeleteTreino(t.id)}
                                                                >
                                                                    Excluir
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default UsuariosView;