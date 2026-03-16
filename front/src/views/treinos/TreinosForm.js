import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const matchBusca = (ex, term) => {
    const palavras = normalizar(term).split(/\s+/).filter(Boolean);
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
                onClick={() => onChange(Math.max(min, value - 1))}>−</button>
            <div className="tf-stepper-center">
                <span className="tf-stepper-val">{value}</span>
                <span className="tf-stepper-label">{label}</span>
            </div>
            <button type="button" className="tf-stepper-btn"
                onClick={() => onChange(Math.min(max, value + 1))}>+</button>
        </div>
    );
}

const TreinosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [grupoMuscular, setGrupoMuscular] = useState('');
    const [gruposAuxiliares, setGruposAuxiliares] = useState([]);
    const [exercicios, setExercicios] = useState([]);
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [openGroups, setOpenGroups] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const PAGE = 8;
    const [diasOcupados, setDiasOcupados] = useState([]);
    const [erros, setErros] = useState({});

    useEffect(() => {
        const token = localStorage.getItem('token');
        const authH = token ? { Authorization: `Bearer ${token}` } : {};
        Promise.all([
            fetch(`${API}/exercicios`).then(r => r.json()),
            fetch(`${API}/treinos/usuarios/${id}/treinos`, { headers: authH }).then(r => r.json()),
        ]).then(([exData, treinosData]) => {
            setExercicios(exData);
            setDiasOcupados(treinosData.map(t => t.dia_semana));
        });
    }, [id]);

    const toggleGroup = (grupo) =>
        setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));

    const handleAdicionarExercicio = (ex) => {
        if (!exerciciosSelecionados.some(s => s.id === ex.id)) {
            setExerciciosSelecionados(prev => [...prev, { ...ex, series_alvo: 3, reps_alvo: 12 }]);
        }
    };

    const handleAlvoChange = (exId, campo, valor) => {
        setExerciciosSelecionados(prev =>
            prev.map(ex => ex.id === exId ? { ...ex, [campo]: valor } : ex)
        );
    };

    const handleRemoveExercicio = (exId) =>
        setExerciciosSelecionados(prev => prev.filter(ex => ex.id !== exId));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const novosErros = {};
        if (!nomeTreino.trim())             novosErros.nomeTreino    = 'Dê um nome ao treino';
        if (!diaSemana)                     novosErros.diaSemana     = 'Escolha o dia da semana';
        if (!grupoMuscular)                 novosErros.grupoMuscular = 'Escolha o grupo muscular principal';
        if (exerciciosSelecionados.length === 0) novosErros.exercicios = 'Adicione pelo menos um exercício';

        if (Object.keys(novosErros).length) {
            setErros(novosErros);
            const primeiroErro = document.querySelector('.tf-error');
            primeiroErro?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setErros({});
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/treinos/usuarios/${id}/treinos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    nome_treino: nomeTreino,
                    descricao,
                    dia_semana: diaSemana,
                    grupo_muscular: grupoMuscular,
                    grupos_auxiliares: gruposAuxiliares,
                }),
            });
            if (!res.ok) { setErros({ geral: 'Erro ao criar treino. Tente novamente.' }); return; }
            const novoTreino = await res.json();

            await fetch(`${API}/treinos/treinos/${novoTreino.id}/exercicios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    exercicios: exerciciosSelecionados.map(ex => ({
                        id: ex.id,
                        series_alvo: ex.series_alvo || null,
                        reps_alvo: ex.reps_alvo || null,
                    }))
                }),
            });

            navigate(`/usuarios/view/${id}`);
        } catch {
            setErros({ geral: 'Erro ao criar treino. Tente novamente.' });
        } finally {
            setSubmitting(false);
        }
    };

    if (submitting) return <ModalCarregando show={true} />;

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
                        <p className="tf-header-eyebrow">Novo Treino</p>
                        <h1 className="tf-header-title">Criar Treino</h1>
                    </div>
                </div>
            </div>

            {/* ── BODY ── */}
            <form onSubmit={handleSubmit}>
                <div className="tf-body">

                    {erros.geral && (
                        <div className="tf-error-banner">{erros.geral}</div>
                    )}

                    {/* ── DADOS DO TREINO ── */}
                    <div className="tf-section">
                        <div className="tf-section-header">
                            <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span className="tf-section-title">Dados do Treino</span>
                        </div>
                        <div className="tf-section-body">

                            {/* Nome */}
                            <div className="tf-field">
                                <label className="tf-label">Nome do Treino</label>
                                <input
                                    className={`tf-input${erros.nomeTreino ? ' tf-input-error' : ''}`}
                                    type="text"
                                    placeholder="Ex: Treino A — Peito e Tríceps"
                                    value={nomeTreino}
                                    onChange={e => { setNomeTreino(e.target.value); setErros(p => ({ ...p, nomeTreino: null })); }}
                                />
                                {erros.nomeTreino && <span className="tf-error">{erros.nomeTreino}</span>}
                            </div>

                            {/* Descrição — opcional */}
                            <div className="tf-field">
                                <label className="tf-label">
                                    Descrição <span className="tf-label-opt">(opcional)</span>
                                </label>
                                <textarea
                                    className="tf-textarea"
                                    placeholder="Descreva o objetivo ou foco deste treino..."
                                    value={descricao}
                                    onChange={e => setDescricao(e.target.value)}
                                />
                            </div>

                            {/* Dia da semana — chips visuais */}
                            <div className="tf-field">
                                <label className="tf-label">Dia da Semana</label>
                                <div className="tf-day-chips">
                                    {DIAS.map(({ curto, completo }) => {
                                        const ocupado   = diasOcupados.includes(completo);
                                        const selecionado = diaSemana === completo;
                                        return (
                                            <button
                                                key={completo}
                                                type="button"
                                                disabled={ocupado}
                                                onClick={() => { setDiaSemana(completo); setErros(p => ({ ...p, diaSemana: null })); }}
                                                className={`tf-day-chip${selecionado ? ' active' : ''}${ocupado ? ' disabled' : ''}`}
                                            >
                                                {curto}
                                                {ocupado && <span className="tf-day-dot" />}
                                            </button>
                                        );
                                    })}
                                </div>
                                {erros.diaSemana && <span className="tf-error">{erros.diaSemana}</span>}
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
                                    const ativo = grupoMuscular === nome;
                                    return (
                                        <button
                                            key={nome}
                                            type="button"
                                            className={`tf-muscle-card${ativo ? ' active' : ''}`}
                                            onClick={() => {
                                                setGrupoMuscular(nome);
                                                setGruposAuxiliares(prev => prev.filter(g => g !== nome));
                                                setErros(p => ({ ...p, grupoMuscular: null }));
                                            }}
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
                            {erros.grupoMuscular && <span className="tf-error">{erros.grupoMuscular}</span>}

                            {/* Grupos auxiliares */}
                            {grupoMuscular && (
                                <div className="tf-field" style={{ marginTop: 4 }}>
                                    <label className="tf-label">
                                        Grupos Auxiliares <span className="tf-label-opt">(opcional)</span>
                                    </label>
                                    <div className="tf-aux-chips">
                                        {GRUPOS.filter(g => g !== grupoMuscular).map(g => {
                                            const ativo = gruposAuxiliares.includes(g);
                                            return (
                                                <button
                                                    key={g}
                                                    type="button"
                                                    className={`tf-aux-chip${ativo ? ' active' : ''}`}
                                                    onClick={() => setGruposAuxiliares(prev =>
                                                        ativo ? prev.filter(x => x !== g) : [...prev, g]
                                                    )}
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

                    {/* ── EXERCÍCIOS SELECIONADOS ── */}
                    {exerciciosSelecionados.length > 0 && (
                        <div className="tf-section">
                            <div className="tf-section-header">
                                <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                <span className="tf-section-title">Exercícios Selecionados</span>
                                <span className="tf-acc-count">{exerciciosSelecionados.length}</span>
                            </div>
                            <div className="tf-section-body">
                                <div className="tf-selected-grid">
                                    {exerciciosSelecionados.map(ex => (
                                        <div key={ex.id} className="tf-selected-card">
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
                                                    onChange={v => handleAlvoChange(ex.id, 'series_alvo', v)}
                                                    min={1} max={8}
                                                    label="séries"
                                                />
                                                <span className="tf-stepper-sep">×</span>
                                                <Stepper
                                                    value={ex.reps_alvo}
                                                    onChange={v => handleAlvoChange(ex.id, 'reps_alvo', v)}
                                                    min={1} max={30}
                                                    label="reps"
                                                />
                                            </div>

                                            <button
                                                type="button"
                                                className="tf-rm-btn"
                                                onClick={() => handleRemoveExercicio(ex.id)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── EXERCÍCIOS DISPONÍVEIS ── */}
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

                        {erros.exercicios && (
                            <div style={{ padding: '0 16px 8px' }}>
                                <span className="tf-error">{erros.exercicios}</span>
                            </div>
                        )}

                        <div className="tf-accordion">
                            {GRUPOS.map((grupo) => {
                                const exerciciosGrupo = exercicios.filter(ex =>
                                    matchBusca(ex, searchTerm) &&
                                    ex.grupo_muscular === grupo &&
                                    !exerciciosSelecionados.some(s => s.id === ex.id)
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
                                                            onClick={() => { handleAdicionarExercicio(ex); setErros(p => ({ ...p, exercicios: null })); }}
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

                    {/* ── AÇÕES ── */}
                    <div className="tf-actions">
                        <button type="submit" className="tf-btn-submit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Criar Treino
                        </button>
                        <button type="button" className="tf-btn-cancel" onClick={() => navigate(-1)}>
                            Cancelar
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default TreinosForm;
