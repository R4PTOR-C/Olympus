import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import ModalEdicaoCampo from '../components/ModalEdicaoCampo';
import ModalCarregando from '../components/ModalCarregando';
import '../../styles/TreinosForm.css';

const GRUPOS = ['Peitoral', 'Bíceps', 'Tríceps', 'Costas', 'Ombros', 'Pernas', 'Abdômen', 'Panturrilha'];

const TreinosEdit = () => {
    const { id, treinoId } = useParams();
    const navigate = useNavigate();
    const { userId, funcao } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [treino, setTreino] = useState(null);
    const [exerciciosSalvos, setExerciciosSalvos] = useState([]);
    const [exercicios, setExercicios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exercicioAtivo, setExercicioAtivo] = useState(null);
    const [campoEditando, setCampoEditando] = useState(null);
    const [openGroups, setOpenGroups] = useState({});
    const [diasOcupados, setDiasOcupados] = useState([]);

    const TODOS_DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    useEffect(() => {
        if (funcao !== 'Professor' && parseInt(id) !== parseInt(userId)) {
            navigate(`/usuarios/view/${userId}`);
            return;
        }

        const fetchAll = async () => {
            try {
                const [treinoRes, savedRes, exRes, treinosRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`),
                ]);
                if (!treinoRes.ok) throw new Error(`Erro ao buscar treino (${treinoRes.status})`);
                const treinoData = await treinoRes.json();
                const treinosList = await treinosRes.json();
                setTreino(treinoData);
                setExerciciosSalvos(await savedRes.json());
                setExercicios(await exRes.json());
                // dias ocupados = outros treinos (excluindo o atual)
                setDiasOcupados(
                    treinosList
                        .filter(t => t.id !== parseInt(treinoId))
                        .map(t => t.dia_semana)
                );
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [treinoId, id, userId, funcao, navigate]);

    const toggleGroup = (grupo) => {
        setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));
    };

    const handleSalvarCampo = async (campo, valor) => {
        setTreino(prev => ({ ...prev, [campo]: valor }));
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [campo]: valor }),
            });
            if (!res.ok) throw new Error('Erro ao atualizar treino');
        } catch (err) {
            console.error(err);
        } finally {
            setCampoEditando(null);
        }
    };

    const handleAdicionarExercicio = async (ex) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercicios: [ex.id] }),
            });
            if (res.ok) {
                setExerciciosSalvos(prev => [...prev, { ...ex, exercicio_id: ex.id }]);
                setExercicioAtivo(null);
            } else {
                alert('Erro ao adicionar exercício');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveExercicio = async (exercicioId) => {
        if (!window.confirm('Remover este exercício do treino?')) return;
        const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`,
            { method: 'DELETE' }
        );
        if (res.ok) {
            setExerciciosSalvos(prev => prev.filter(ex => ex.exercicio_id !== exercicioId));
        } else {
            alert('Erro ao remover exercício.');
        }
    };

    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div style={{ color: 'red', padding: '2rem' }}>Erro: {error}</div>;
    if (!treino) return null;

    const diasDisponiveis = TODOS_DIAS.filter(
        d => !diasOcupados.includes(d) || d === treino.dia_semana
    );

    const camposTreino = [
        { name: 'nome_treino', label: 'Nome do Treino', tipo: 'text' },
        { name: 'descricao', label: 'Descrição', tipo: 'text' },
        {
            name: 'dia_semana', label: 'Dia da Semana', tipo: 'select',
            options: diasDisponiveis,
        },
        {
            name: 'grupo_muscular', label: 'Grupo Muscular Principal', tipo: 'select',
            options: ['Peitoral', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen'],
        },
    ];

    return (
        <div className="tf-page">

            {/* ── HEADER ── */}
            <div className="tf-header">
                <div className="tf-header-top">
                    <button className="tf-back-btn" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div>
                        <p className="tf-header-eyebrow">Editar Treino</p>
                        <h1 className="tf-header-title">{treino.nome_treino || 'Treino'}</h1>
                    </div>
                </div>
                {treino.grupo_muscular && (
                    <div className="tf-header-badge">{treino.grupo_muscular}</div>
                )}
            </div>

            <div className="tf-body">

                {/* ── Dados do treino ── */}
                <div className="tf-section">
                    <div className="tf-section-header">
                        <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span className="tf-section-title">Dados do Treino</span>
                        <span className="tf-acc-count">Toque para editar</span>
                    </div>
                    <div className="tf-field-rows">
                        {camposTreino.map(campo => (
                            <div
                                key={campo.name}
                                className="tf-field-row"
                                onClick={() => setCampoEditando(campo)}
                            >
                                <div className="tf-field-row-left">
                                    <span className="tf-field-row-label">{campo.label}</span>
                                    <span className={`tf-field-row-value${!treino[campo.name] ? ' empty' : ''}`}>
                                        {treino[campo.name] || 'Não informado'}
                                    </span>
                                </div>
                                <svg className="tf-field-row-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Exercícios do treino ── */}
                <div className="tf-section">
                    <div className="tf-section-header">
                        <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="tf-section-title">Exercícios do Treino</span>
                        {exerciciosSalvos.length > 0 && (
                            <span className="tf-acc-count">{exerciciosSalvos.length}</span>
                        )}
                    </div>

                    {exerciciosSalvos.length > 0 ? (
                        <div className="tf-saved-grid">
                            {exerciciosSalvos.map(ex => (
                                <div key={ex.exercicio_id} className="tf-selected-card">
                                    <div className="tf-selected-gif">
                                        <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                    </div>
                                    <p className="tf-selected-name">{ex.nome_exercicio}</p>
                                    <button
                                        type="button"
                                        className="tf-rm-btn"
                                        onClick={() => handleRemoveExercicio(ex.exercicio_id)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="tf-section-body">
                            <p className="tf-empty-msg">Nenhum exercício vinculado ainda</p>
                        </div>
                    )}
                </div>

                {/* ── Exercícios disponíveis ── */}
                <div className="tf-section">
                    <div className="tf-section-header">
                        <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                        </svg>
                        <span className="tf-section-title">Adicionar Exercícios</span>
                    </div>

                    {/* Busca */}
                    <div className="tf-search-wrap">
                        <svg className="tf-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            className="tf-search"
                            type="text"
                            placeholder="Buscar por nome ou grupo muscular..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Accordion */}
                    <div className="tf-accordion">
                        {GRUPOS.map((grupo) => {
                            const exerciciosGrupo = exercicios.filter(ex =>
                                (ex.nome_exercicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    ex.grupo_muscular?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                ex.grupo_muscular === grupo &&
                                !exerciciosSalvos.some(s => s.exercicio_id === ex.id)
                            );
                            if (!exerciciosGrupo.length) return null;

                            const isOpen = !!openGroups[grupo];
                            return (
                                <div className="tf-acc-item" key={grupo}>
                                    <button
                                        type="button"
                                        className="tf-acc-trigger"
                                        onClick={() => toggleGroup(grupo)}
                                    >
                                        <span className="tf-acc-label">{grupo}</span>
                                        <span className="tf-acc-count">{exerciciosGrupo.length}</span>
                                        <svg
                                            className={`tf-acc-chevron${isOpen ? ' open' : ''}`}
                                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                                            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        >
                                            <polyline points="6 9 12 15 18 9"/>
                                        </svg>
                                    </button>

                                    {isOpen && (
                                        <div className="tf-acc-body">
                                            <div className="tf-ex-grid">
                                                {exerciciosGrupo.map(ex => (
                                                    <div
                                                        key={ex.id}
                                                        className={`tf-ex-card${exercicioAtivo === ex.id ? ' tf-ex-active' : ''}`}
                                                        onClick={() => setExercicioAtivo(ex.id === exercicioAtivo ? null : ex.id)}
                                                    >
                                                        <div className="tf-ex-gif">
                                                            <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                                        </div>
                                                        <p className="tf-ex-name">{ex.nome_exercicio}</p>
                                                        {exercicioAtivo === ex.id && (
                                                            <button
                                                                type="button"
                                                                className="tf-use-btn"
                                                                onClick={e => { e.stopPropagation(); handleAdicionarExercicio(ex); }}
                                                            >
                                                                Usar
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Voltar ── */}
                <div className="tf-actions">
                    <button type="button" className="tf-btn-cancel" onClick={() => navigate(-1)}>
                        Voltar
                    </button>
                </div>

            </div>

            {/* Modal de edição de campo */}
            {campoEditando && (
                <ModalEdicaoCampo
                    campo={campoEditando}
                    valorAtual={treino[campoEditando.name]}
                    onClose={() => setCampoEditando(null)}
                    onSave={handleSalvarCampo}
                />
            )}
        </div>
    );
};

export default TreinosEdit;
