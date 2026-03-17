import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import ModalEdicaoCampo from '../components/ModalEdicaoCampo';
import ModalCarregando from '../components/ModalCarregando';
import '../../styles/TreinosForm.css';

const API = process.env.REACT_APP_API_BASE_URL;

const DIAS = [
    { curto: 'Seg', completo: 'Segunda-feira' },
    { curto: 'Ter', completo: 'Terça-feira'   },
    { curto: 'Qua', completo: 'Quarta-feira'  },
    { curto: 'Qui', completo: 'Quinta-feira'  },
    { curto: 'Sex', completo: 'Sexta-feira'   },
    { curto: 'Sáb', completo: 'Sábado'        },
    { curto: 'Dom', completo: 'Domingo'       },
];

const GRUPOS_CONFIG = [
    { nome: 'Peitoral',    img: 'peito.png'       },
    { nome: 'Bíceps',      img: 'biceps.png'      },
    { nome: 'Tríceps',     img: 'triceps.png'     },
    { nome: 'Costas',      img: 'costas.png'      },
    { nome: 'Ombros',      img: 'ombros.png'      },
    { nome: 'Pernas',      img: 'perna.png'       },
    { nome: 'Abdômen',     img: 'abdomen.png'     },
    { nome: 'Panturrilha', img: 'panturrilha.png' },
];

const GRUPOS = GRUPOS_CONFIG.map(g => g.nome);

const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

const normalizar = (str) => str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';

const matchBusca = (ex, searchTerm) => {
    const palavras = normalizar(searchTerm).split(/\s+/).filter(Boolean);
    if (!palavras.length) return true;
    return palavras.every(p =>
        normalizar(ex.nome_exercicio).includes(p) ||
        normalizar(ex.grupo_muscular).includes(p)
    );
};

function Stepper({ value, onChange, min = 1, max = 30, label }) {
    return (
        <div className="tf-stepper">
            <button type="button" className="tf-stepper-btn"
                onClick={() => onChange(Math.max(min, (value || min) - 1))}>−</button>
            <div className="tf-stepper-center">
                <span className="tf-stepper-val">{value || min}</span>
                <span className="tf-stepper-label">{label}</span>
            </div>
            <button type="button" className="tf-stepper-btn"
                onClick={() => onChange(Math.min(max, (value || min) + 1))}>+</button>
        </div>
    );
}

const TreinosEdit = () => {
    const { id, treinoId } = useParams();
    const navigate = useNavigate();
    const { userId, funcaoAtiva } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [treino, setTreino] = useState(null);
    const [exerciciosSalvos, setExerciciosSalvos] = useState([]);
    const [exercicios, setExercicios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [campoEditando, setCampoEditando] = useState(null);
    const [openGroups, setOpenGroups] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [diasOcupados, setDiasOcupados] = useState([]);

    const PAGE = 8;
    const [pendingRemove, setPendingRemove] = useState(null);

    useEffect(() => {
        if (funcaoAtiva !== 'Professor' && parseInt(id) !== parseInt(userId)) {
            navigate(`/usuarios/view/${userId}`);
            return;
        }

        const fetchAll = async () => {
            const token = localStorage.getItem('token');
            const authH = token ? { Authorization: `Bearer ${token}` } : {};
            try {
                const [treinoRes, savedRes, exRes, treinosRes] = await Promise.all([
                    fetch(`${API}/treinos/treinos/${treinoId}`),
                    fetch(`${API}/treinos/treinos/${treinoId}/exercicios`),
                    fetch(`${API}/exercicios`),
                    fetch(`${API}/treinos/usuarios/${id}/treinos`, { headers: authH }),
                ]);
                if (!treinoRes.ok) throw new Error(`Erro ao buscar treino (${treinoRes.status})`);
                const treinoData = await treinoRes.json();
                const treinosList = await treinosRes.json();
                setTreino(treinoData);
                setExerciciosSalvos(await savedRes.json());
                setExercicios(await exRes.json());
                setDiasOcupados(
                    Array.isArray(treinosList)
                        ? treinosList.filter(t => t.id !== parseInt(treinoId)).map(t => t.dia_semana)
                        : []
                );
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [treinoId, id, userId, funcaoAtiva, navigate]);

    const toggleGroup = (grupo) =>
        setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));

    const handleSalvarCampo = async (campo, valor) => {
        setTreino(prev => ({ ...prev, [campo]: valor }));
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/treinos/treinos/${treinoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ [campo]: valor }),
            });
            if (!res.ok) throw new Error('Erro ao atualizar treino');
        } catch (err) {
            console.error(err);
        } finally {
            setCampoEditando(null);
        }
    };

    const handleGrupoSelect = async (nome) => {
        const auxiliares = Array.isArray(treino.grupos_auxiliares) ? treino.grupos_auxiliares : [];
        const novosAux = auxiliares.filter(g => g !== nome);
        setTreino(prev => ({ ...prev, grupo_muscular: nome, grupos_auxiliares: novosAux }));
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API}/treinos/treinos/${treinoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ grupo_muscular: nome }),
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleAuxToggle = async (g) => {
        const auxiliares = Array.isArray(treino.grupos_auxiliares) ? treino.grupos_auxiliares : [];
        const ativo = auxiliares.includes(g);
        const novos = ativo ? auxiliares.filter(x => x !== g) : [...auxiliares, g];
        setTreino(prev => ({ ...prev, grupos_auxiliares: novos }));
        try {
            await fetch(`${API}/treinos/treinos/${treinoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_treino: treino.nome_treino,
                    descricao: treino.descricao,
                    dia_semana: treino.dia_semana,
                    grupo_muscular: treino.grupo_muscular,
                    grupos_auxiliares: novos,
                }),
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdicionarExercicio = async (ex) => {
        if (exerciciosSalvos.some(s => s.exercicio_id === ex.id)) return;
        try {
            const res = await fetch(`${API}/treinos/treinos/${treinoId}/exercicios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercicios: [ex.id] }),
            });
            if (res.ok) {
                setExerciciosSalvos(prev => [...prev, { ...ex, exercicio_id: ex.id, series_alvo: 3, reps_alvo: 12 }]);
            } else {
                console.error('Erro ao adicionar exercício');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAlvoBlur = async (exercicioId, series_alvo, reps_alvo) => {
        try {
            await fetch(`${API}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ series_alvo: series_alvo || null, reps_alvo: reps_alvo || null }),
            });
        } catch (err) {
            console.error('Erro ao salvar meta:', err);
        }
    };

    const handleAlvoStep = (exercicioId, campo, novoValor) => {
        setExerciciosSalvos(prev =>
            prev.map(ex => ex.exercicio_id === exercicioId ? { ...ex, [campo]: novoValor } : ex)
        );
        const ex = exerciciosSalvos.find(e => e.exercicio_id === exercicioId);
        if (ex) {
            const series = campo === 'series_alvo' ? novoValor : ex.series_alvo;
            const reps   = campo === 'reps_alvo'   ? novoValor : ex.reps_alvo;
            handleAlvoBlur(exercicioId, series, reps);
        }
    };

    const handleRemoveExercicio = async (exercicioId) => {
        if (pendingRemove !== exercicioId) {
            setPendingRemove(exercicioId);
            setTimeout(() => setPendingRemove(p => p === exercicioId ? null : p), 3000);
            return;
        }
        setPendingRemove(null);
        const res = await fetch(`${API}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`, {
            method: 'DELETE',
        });
        if (res.ok) {
            setExerciciosSalvos(prev => prev.filter(ex => ex.exercicio_id !== exercicioId));
        } else {
            console.error('Erro ao remover exercício.');
        }
    };

    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div style={{ color: 'red', padding: '2rem' }}>Erro: {error}</div>;
    if (!treino) return null;

    const auxiliares = Array.isArray(treino.grupos_auxiliares) ? treino.grupos_auxiliares : [];

    const camposTexto = [
        { name: 'nome_treino', label: 'Nome do Treino', tipo: 'text' },
        { name: 'descricao',   label: 'Descrição',      tipo: 'text' },
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

                {/* ── DADOS DO TREINO ── */}
                <div className="tf-section">
                    <div className="tf-section-header">
                        <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        <span className="tf-section-title">Dados do Treino</span>
                        <span className="tf-acc-count">Toque para editar</span>
                    </div>

                    {/* Nome e Descrição — modal */}
                    <div className="tf-field-rows">
                        {camposTexto.map(campo => (
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

                    {/* Dia da semana — chips */}
                    <div className="tf-section-body" style={{ paddingTop: 4 }}>
                        <div className="tf-field">
                            <label className="tf-label">Dia da Semana</label>
                            <div className="tf-day-chips">
                                {DIAS.map(({ curto, completo }) => {
                                    const ocupado     = diasOcupados.includes(completo);
                                    const selecionado = treino.dia_semana === completo;
                                    return (
                                        <button
                                            key={completo}
                                            type="button"
                                            disabled={ocupado}
                                            onClick={() => !ocupado && handleSalvarCampo('dia_semana', completo)}
                                            className={`tf-day-chip${selecionado ? ' active' : ''}${ocupado ? ' disabled' : ''}`}
                                        >
                                            {curto}
                                            {ocupado && <span className="tf-day-dot" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── GRUPO MUSCULAR ── */}
                <div className="tf-section">
                    <div className="tf-section-header">
                        <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                        </svg>
                        <span className="tf-section-title">Grupo Muscular Principal</span>
                    </div>
                    <div className="tf-section-body">
                        <div className="tf-muscle-grid">
                            {GRUPOS_CONFIG.map(({ nome, img }) => {
                                const ativo = treino.grupo_muscular === nome;
                                return (
                                    <button
                                        key={nome}
                                        type="button"
                                        className={`tf-muscle-card${ativo ? ' active' : ''}`}
                                        onClick={() => handleGrupoSelect(nome)}
                                    >
                                        <img
                                            className="tf-muscle-img"
                                            src={`${API}/uploads/${img}`}
                                            alt={nome}
                                        />
                                        <span className="tf-muscle-nome">{nome}</span>
                                        {ativo && (
                                            <div className="tf-muscle-check">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Grupos auxiliares */}
                        {treino.grupo_muscular && (
                            <div className="tf-field" style={{ marginTop: 4 }}>
                                <label className="tf-label">
                                    Grupos Auxiliares <span className="tf-label-opt">(opcional)</span>
                                </label>
                                <div className="tf-aux-chips">
                                    {GRUPOS.filter(g => g !== treino.grupo_muscular).map(g => {
                                        const ativo = auxiliares.includes(g);
                                        return (
                                            <button
                                                key={g}
                                                type="button"
                                                className={`tf-aux-chip${ativo ? ' active' : ''}`}
                                                onClick={() => handleAuxToggle(g)}
                                            >
                                                {ativo && (
                                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                                {g}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── EXERCÍCIOS DO TREINO ── */}
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
                                        {isVideo(ex.gif_url) ? (
                                            <video src={ex.gif_url} autoPlay loop muted playsInline />
                                        ) : (
                                            <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                        )}
                                    </div>
                                    <p className="tf-selected-name">{ex.nome_exercicio}</p>

                                    <div className="tf-steppers-row">
                                        <Stepper
                                            value={ex.series_alvo}
                                            onChange={v => handleAlvoStep(ex.exercicio_id, 'series_alvo', v)}
                                            min={1} max={8}
                                            label="séries"
                                        />
                                        <span className="tf-stepper-sep">×</span>
                                        <Stepper
                                            value={ex.reps_alvo}
                                            onChange={v => handleAlvoStep(ex.exercicio_id, 'reps_alvo', v)}
                                            min={1} max={30}
                                            label="reps"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="tf-rm-btn"
                                        onClick={() => handleRemoveExercicio(ex.exercicio_id)}
                                        style={pendingRemove === ex.exercicio_id ? { background: 'rgba(231,76,60,0.18)', borderColor: 'rgba(231,76,60,0.5)', color: '#e74c3c' } : {}}
                                    >
                                        {pendingRemove === ex.exercicio_id ? 'Confirmar?' : 'Remover'}
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

                {/* ── ADICIONAR EXERCÍCIOS ── */}
                <div className="tf-section">
                    <div className="tf-section-header">
                        <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                        </svg>
                        <span className="tf-section-title">Adicionar Exercícios</span>
                    </div>

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

                    <div className="tf-accordion">
                        {GRUPOS.map((grupo) => {
                            const exerciciosGrupo = exercicios.filter(ex =>
                                matchBusca(ex, searchTerm) &&
                                ex.grupo_muscular === grupo &&
                                !exerciciosSalvos.some(s => s.exercicio_id === ex.id)
                            );
                            if (!exerciciosGrupo.length) return null;

                            const isOpen = !!openGroups[grupo] || searchTerm.trim().length > 0;
                            const isExpanded = !!expandedGroups[grupo] || searchTerm.trim().length > 0;
                            const visiveis = isExpanded ? exerciciosGrupo : exerciciosGrupo.slice(0, PAGE);
                            const restante = exerciciosGrupo.length - PAGE;

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
                                                {visiveis.map(ex => (
                                                    <div
                                                        key={ex.id}
                                                        className="tf-ex-card"
                                                        onClick={() => handleAdicionarExercicio(ex)}
                                                    >
                                                        <div className="tf-ex-gif">
                                                            {isVideo(ex.gif_url) ? (
                                                                <video src={ex.gif_url} autoPlay loop muted playsInline />
                                                            ) : (
                                                                <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                                            )}
                                                        </div>
                                                        <p className="tf-ex-name">{ex.nome_exercicio}</p>
                                                        <div className="tf-ex-add">
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                                            </svg>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {!isExpanded && restante > 0 && (
                                                <button
                                                    type="button"
                                                    className="tf-ver-mais"
                                                    onClick={() => setExpandedGroups(p => ({ ...p, [grupo]: true }))}
                                                >
                                                    Ver mais {restante} exercício{restante !== 1 ? 's' : ''}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── VOLTAR ── */}
                <div className="tf-actions">
                    <button type="button" className="tf-btn-cancel" onClick={() => navigate(-1)}>
                        Voltar
                    </button>
                </div>

            </div>

            {/* Modal de edição (nome / descrição) */}
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
