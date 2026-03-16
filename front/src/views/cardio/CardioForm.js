import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/Cardio.css';

const API = process.env.REACT_APP_API_BASE_URL;
const STEP = 5;
const MIN_DUR = 5;
const MAX_DUR = 180;

const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

const normalizar = (str) =>
    str?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() ?? '';

const CardioForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [exercicios, setExercicios] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [exercicioSel, setExercicioSel] = useState(null);
    const [duracao, setDuracao] = useState(30);
    const [distancia, setDistancia] = useState('');
    const [data, setData] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);
    const [sucesso, setSucesso] = useState(false);

    useEffect(() => {
        fetch(`${API}/exercicios`)
            .then(r => r.json())
            .then(data => setExercicios(data.filter(e => e.grupo_muscular === 'Cardio')))
            .catch(console.error);
    }, []);

    const exerciciosFiltrados = useMemo(() => {
        if (!searchTerm.trim()) return exercicios;
        const palavras = normalizar(searchTerm).split(/\s+/).filter(Boolean);
        return exercicios.filter(ex =>
            palavras.every(p => normalizar(ex.nome_exercicio).includes(p))
        );
    }, [exercicios, searchTerm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!exercicioSel) return;
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/cardio`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: id,
                    exercicio_id: exercicioSel.id,
                    duracao_min: duracao,
                    distancia_km: distancia ? parseFloat(distancia) : null,
                    data,
                }),
            });
            if (!res.ok) throw new Error();
            setSucesso(true);
        } catch {
            console.error('Erro ao registrar cardio.');
        } finally {
            setSubmitting(false);
        }
    };

    if (sucesso) {
        return (
            <div className="cd-page">
                <div className="cd-header">
                    <div className="cd-header-top">
                        <button className="cd-back-btn" onClick={() => navigate(-1)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <div>
                            <p className="cd-header-eyebrow">Cardio</p>
                            <h1 className="cd-header-title">Registrar Sessão</h1>
                        </div>
                    </div>
                </div>
                <div className="cd-body">
                    <div className="cd-section">
                        <div className="cd-sucesso">
                            <div className="cd-sucesso-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <p className="cd-sucesso-title">Sessão Registrada</p>
                            <p className="cd-sucesso-sub">
                                {exercicioSel?.nome_exercicio} · {duracao} min
                                {distancia ? ` · ${distancia} km` : ''}
                            </p>
                        </div>
                    </div>
                    <div className="cd-actions">
                        <button className="cd-btn-submit" onClick={() => navigate(-1)}>
                            Voltar ao Perfil
                        </button>
                        <button className="cd-btn-cancel" onClick={() => {
                            setSucesso(false);
                            setExercicioSel(null);
                            setDuracao(30);
                            setDistancia('');
                            setData(new Date().toISOString().split('T')[0]);
                        }}>
                            Registrar Outro
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cd-page">

            {/* ── HEADER ── */}
            <div className="cd-header">
                <div className="cd-header-top">
                    <button className="cd-back-btn" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div>
                        <p className="cd-header-eyebrow">Cardio</p>
                        <h1 className="cd-header-title">Registrar Sessão</h1>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="cd-body">

                    {/* ── ESCOLHER EXERCÍCIO ── */}
                    <div className="cd-section">
                        <div className="cd-section-header">
                            <svg className="cd-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                            <span className="cd-section-title">Tipo de Cardio</span>
                            {exercicioSel && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontFamily: "'Barlow Condensed'", fontWeight: 700, letterSpacing: '0.06em', color: 'var(--cd-accent)', textTransform: 'uppercase' }}>{exercicioSel.nome_exercicio}</span>}
                        </div>

                        <div className="cd-search-wrap">
                            <svg className="cd-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                className="cd-search"
                                type="text"
                                placeholder="Buscar exercício..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="cd-ex-grid">
                            {exerciciosFiltrados.length === 0 ? (
                                <p className="cd-ex-empty">Nenhum exercício encontrado</p>
                            ) : exerciciosFiltrados.map(ex => {
                                const ativo = exercicioSel?.id === ex.id;
                                return (
                                    <div
                                        key={ex.id}
                                        className={`cd-ex-card${ativo ? ' active' : ''}`}
                                        onClick={() => setExercicioSel(ativo ? null : ex)}
                                    >
                                        <div className="cd-ex-gif">
                                            {isVideo(ex.gif_url) ? (
                                                <video src={ex.gif_url} autoPlay loop muted playsInline />
                                            ) : (
                                                <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                            )}
                                        </div>
                                        <p className="cd-ex-name">{ex.nome_exercicio}</p>
                                        {ativo && (
                                            <div className="cd-ex-check">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── DETALHES ── */}
                    <div className="cd-section">
                        <div className="cd-section-header">
                            <svg className="cd-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span className="cd-section-title">Detalhes</span>
                        </div>
                        <div className="cd-section-body">

                            {/* Duração */}
                            <div className="cd-field">
                                <label className="cd-label">Duração</label>
                                <div className="cd-stepper">
                                    <button type="button" className="cd-stepper-btn"
                                        onClick={() => setDuracao(d => Math.max(MIN_DUR, d - STEP))}>−</button>
                                    <div className="cd-stepper-center">
                                        <span className="cd-stepper-val">{duracao}</span>
                                        <span className="cd-stepper-label">minutos</span>
                                    </div>
                                    <button type="button" className="cd-stepper-btn"
                                        onClick={() => setDuracao(d => Math.min(MAX_DUR, d + STEP))}>+</button>
                                </div>
                            </div>

                            {/* Distância + Data */}
                            <div className="cd-inputs-row">
                                <div className="cd-field">
                                    <label className="cd-label">
                                        Distância <span className="cd-label-opt">(km, opcional)</span>
                                    </label>
                                    <input
                                        className="cd-input"
                                        type="number"
                                        placeholder="0.0"
                                        value={distancia}
                                        onChange={e => setDistancia(e.target.value)}
                                        min="0" max="200" step="0.1"
                                    />
                                </div>
                                <div className="cd-field">
                                    <label className="cd-label">Data</label>
                                    <input
                                        className="cd-input"
                                        type="date"
                                        value={data}
                                        onChange={e => setData(e.target.value)}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* ── RESUMO ── */}
                    {exercicioSel && (
                        <div className="cd-resumo">
                            <div className="cd-resumo-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                </svg>
                            </div>
                            <div className="cd-resumo-text">
                                <p className="cd-resumo-nome">{exercicioSel.nome_exercicio}</p>
                                <p className="cd-resumo-detalhe">
                                    {duracao} min{distancia ? ` · ${distancia} km` : ''}
                                    {' · '}{new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── AÇÕES ── */}
                    <div className="cd-actions">
                        <button type="submit" className="cd-btn-submit" disabled={!exercicioSel || submitting}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {submitting ? 'Salvando...' : 'Registrar Cardio'}
                        </button>
                        <button type="button" className="cd-btn-cancel" onClick={() => navigate(-1)}>
                            Cancelar
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default CardioForm;
