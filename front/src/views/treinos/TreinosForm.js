import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ModalCarregando from '../components/ModalCarregando';
import '../../styles/TreinosForm.css';

const GRUPOS = ['Peitoral', 'Bíceps', 'Tríceps', 'Costas', 'Ombros', 'Pernas', 'Abdômen', 'Panturrilha'];

const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

const TreinosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [grupoMuscular, setGrupoMuscular] = useState('');
    const [exercicios, setExercicios] = useState([]);
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exercicioAtivo, setExercicioAtivo] = useState(null);
    const [openGroups, setOpenGroups] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [diasOcupados, setDiasOcupados] = useState([]);

    const TODOS_DIAS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];

    useEffect(() => {
        Promise.all([
            fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`).then(r => r.json()),
            fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`).then(r => r.json()),
        ]).then(([exData, treinosData]) => {
            setExercicios(exData);
            setDiasOcupados(treinosData.map(t => t.dia_semana));
        });
    }, [id]);

    const toggleGroup = (grupo) => {
        setOpenGroups(prev => ({ ...prev, [grupo]: !prev[grupo] }));
    };

    const handleAdicionarExercicio = (ex) => {
        if (!exerciciosSelecionados.some(s => s.id === ex.id)) {
            setExerciciosSelecionados(prev => [...prev, ex]);
        }
        setExercicioAtivo(null);
    };

    const handleRemoveExercicio = (exId) => {
        setExerciciosSelecionados(prev => prev.filter(ex => ex.id !== exId));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nomeTreino || !descricao || !diaSemana || !grupoMuscular || exerciciosSelecionados.length === 0) {
            alert('Preencha todos os campos e selecione ao menos um exercício.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_treino: nomeTreino, descricao, dia_semana: diaSemana, grupo_muscular: grupoMuscular }),
            });
            if (!res.ok) { alert('Erro ao criar treino.'); return; }
            const novoTreino = await res.json();

            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${novoTreino.id}/exercicios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercicios: exerciciosSelecionados.map(ex => ex.id) }),
            });

            navigate(`/usuarios/view/${id}`);
        } catch {
            alert('Erro ao criar treino.');
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
                <div className="tf-header-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Preencha os dados abaixo
                </div>
            </div>

            {/* ── BODY ── */}
            <form onSubmit={handleSubmit}>
                <div className="tf-body">

                    {/* ── Dados do treino ── */}
                    <div className="tf-section">
                        <div className="tf-section-header">
                            <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span className="tf-section-title">Dados do Treino</span>
                        </div>
                        <div className="tf-section-body">
                            <div className="tf-field">
                                <label className="tf-label">Nome do Treino</label>
                                <input
                                    className="tf-input"
                                    type="text"
                                    placeholder="Ex: Treino A — Peito e Tríceps"
                                    value={nomeTreino}
                                    onChange={e => setNomeTreino(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="tf-field">
                                <label className="tf-label">Descrição</label>
                                <textarea
                                    className="tf-textarea"
                                    placeholder="Descreva o objetivo ou foco deste treino..."
                                    value={descricao}
                                    onChange={e => setDescricao(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="tf-field">
                                <label className="tf-label">Dia da Semana</label>
                                <div className="tf-select-wrap">
                                    <select
                                        className="tf-select"
                                        value={diaSemana}
                                        onChange={e => setDiaSemana(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione o dia</option>
                                        {TODOS_DIAS.filter(d => !diasOcupados.includes(d)).map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                    <svg className="tf-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>
                            </div>

                            <div className="tf-field">
                                <label className="tf-label">Grupo Muscular Principal</label>
                                <div className="tf-select-wrap">
                                    <select
                                        className="tf-select"
                                        value={grupoMuscular}
                                        onChange={e => setGrupoMuscular(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione o grupo muscular</option>
                                        <option value="Peitoral">Peitoral</option>
                                        <option value="Costas">Costas</option>
                                        <option value="Ombros">Ombros</option>
                                        <option value="Bíceps">Bíceps</option>
                                        <option value="Tríceps">Tríceps</option>
                                        <option value="Pernas">Pernas</option>
                                        <option value="Abdômen">Abdômen</option>
                                    </select>
                                    <svg className="tf-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Exercícios selecionados ── */}
                    <div className="tf-section">
                        <div className="tf-section-header">
                            <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            <span className="tf-section-title">Exercícios Selecionados</span>
                            {exerciciosSelecionados.length > 0 && (
                                <span className="tf-acc-count">{exerciciosSelecionados.length}</span>
                            )}
                        </div>
                        <div className="tf-section-body">
                            {exerciciosSelecionados.length > 0 ? (
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
                            ) : (
                                <p className="tf-empty-msg">Nenhum exercício selecionado ainda</p>
                            )}
                        </div>
                    </div>

                    {/* ── Exercícios disponíveis ── */}
                    <div className="tf-section">
                        <div className="tf-section-header">
                            <svg className="tf-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>
                            </svg>
                            <span className="tf-section-title">Exercícios Disponíveis</span>
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
                                    !exerciciosSelecionados.some(s => s.id === ex.id)
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
                                                                {isVideo(ex.gif_url) ? (
                                                                    <video src={ex.gif_url} autoPlay loop muted playsInline />
                                                                ) : (
                                                                    <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                                                )}
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

                    {/* ── Ações ── */}
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
