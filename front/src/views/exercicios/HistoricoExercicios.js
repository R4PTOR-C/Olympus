import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../AuthContext';
import PageStateHandler from '../components/PageStateHandler';
import ModalHistoricoExercicio from '../components/ModalHistoricoExercicios';
import ModalMapaMuscular from '../components/ModalMapaMuscular';
import PullToRefresh from '../components/PullToRefresh';
import '../../styles/HistoricoExercicios.css';

const API = process.env.REACT_APP_API_BASE_URL;

const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

const fmtData = (str) =>
    new Date((str || '').substring(0, 10) + 'T12:00:00')
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function HistoricoExercicios() {
    const { userId } = useContext(AuthContext);

    const [aba, setAba] = useState('musc');

    // Musculação
    const [exercicios, setExercicios] = useState([]);
    const [exercicioModal, setExercicioModal] = useState(null);
    const [mapaAberto, setMapaAberto] = useState(false);
    const [loadingMusc, setLoadingMusc] = useState(true);

    // Avaliações
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [loadingAval, setLoadingAval] = useState(true);

    // Cardio
    const [cardio, setCardio] = useState([]);
    const [loadingCardio, setLoadingCardio] = useState(true);

    const fetchTudo = useCallback(async () => {
        const token = localStorage.getItem('token');
        const authH = { Authorization: `Bearer ${token}` };

        setLoadingMusc(true);
        setLoadingAval(true);
        setLoadingCardio(true);

        const [muscRes, avalRes, cardioRes] = await Promise.allSettled([
            fetch(`${API}/treinos/usuarios/${userId}/exercicios_realizados`, { headers: authH }),
            fetch(`${API}/avaliacoes/usuarios/${userId}`, { headers: authH }),
            fetch(`${API}/cardio/usuarios/${userId}`, { headers: authH }),
        ]);

        if (muscRes.status === 'fulfilled' && muscRes.value.ok)
            setExercicios(await muscRes.value.json());
        setLoadingMusc(false);

        if (avalRes.status === 'fulfilled' && avalRes.value.ok) {
            const data = await avalRes.value.json();
            setAvaliacoes([...data].sort((a, b) => new Date(b.data_avaliacao) - new Date(a.data_avaliacao)));
        }
        setLoadingAval(false);

        if (cardioRes.status === 'fulfilled' && cardioRes.value.ok) {
            setCardio(await cardioRes.value.json());
        }
        setLoadingCardio(false);
    }, [userId]);

    useEffect(() => { fetchTudo(); }, [fetchTudo]);

    // ── Resumo mensal cardio ──
    const hoje = new Date();
    const cardioMes = cardio.filter(c => {
        const str = (c.data || '').substring(0, 10); // garante "YYYY-MM-DD"
        const [ano, mes] = str.split('-').map(Number);
        return mes - 1 === hoje.getMonth() && ano === hoje.getFullYear();
    });
    const totalMinMes  = cardioMes.reduce((s, c) => s + (c.duracao_min || 0), 0);
    const totalKmMes   = cardioMes.reduce((s, c) => s + (parseFloat(c.distancia_km) || 0), 0);

    return (
        <PageStateHandler>
            <PullToRefresh onRefresh={fetchTudo} />
            <div className="hx-wrapper">

                {/* ── PAGE HEADER ── */}
                <div className="hx-page-header">
                    <span className="hx-page-title">Histórico</span>
                    {aba === 'musc' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="hx-page-count">Mapa Muscular</span>
                            <button
                                onClick={() => setMapaAberto(true)}
                                title="Mapa muscular do mês"
                                style={{
                                    background: 'rgba(74,144,217,0.12)',
                                    border: '1px solid rgba(74,144,217,0.3)',
                                    borderRadius: 8, padding: '5px 7px',
                                    cursor: 'pointer', lineHeight: 0, color: '#4A90D9',
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 19 6.5 19 17.5 12 22 5 17.5 5 6.5 12 2"/>
                                    <line x1="12" y1="2"  x2="12" y2="22"/>
                                    <line x1="5"  y1="6.5"  x2="19" y2="17.5"/>
                                    <line x1="5"  y1="17.5" x2="19" y2="6.5"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* ── TABS ── */}
                <div className="hx-tabs">
                    <button
                        className={`hx-tab${aba === 'musc' ? ' active-musc' : ''}`}
                        onClick={() => setAba('musc')}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                        </svg>
                        Musculação
                    </button>
                    <button
                        className={`hx-tab${aba === 'cardio' ? ' active-cardio' : ''}`}
                        onClick={() => setAba('cardio')}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        Cardio
                    </button>
                    <button
                        className={`hx-tab${aba === 'aval' ? ' active-aval' : ''}`}
                        onClick={() => setAba('aval')}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                        Avaliações
                    </button>
                </div>

                {/* ══════════════════════════════ */}
                {/* ABA — MUSCULAÇÃO              */}
                {/* ══════════════════════════════ */}
                {aba === 'musc' && (
                    loadingMusc ? (
                        <div className="hx-grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="hx-card-skel" style={{ animationDelay: `${i * 0.07}s` }}>
                                    <div className="hx-skel-gif" style={{ animationDelay: `${i * 0.07}s` }} />
                                    <div className="hx-skel-info">
                                        <div className="hx-skel-line" style={{ width: '50%' }} />
                                        <div className="hx-skel-line" style={{ width: '80%' }} />
                                        <div className="hx-skel-line" style={{ width: '40%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : exercicios.length === 0 ? (
                        <div className="hx-empty">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 64 64" fill="none">
                                <rect x="12" y="28" width="40" height="8" rx="2" fill="#2c3e50"/>
                                <rect x="6" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                                <rect x="2" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                                <rect x="52" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                                <rect x="58" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                            </svg>
                            <h5>Nenhum exercício no histórico</h5>
                            <p>Complete seus treinos para ver o histórico aqui</p>
                        </div>
                    ) : (
                        <div className="hx-grid">
                            {exercicios.map((ex) => (
                                <div key={ex.exercicio_id} className="hx-card" onClick={() => setExercicioModal(ex)}>
                                    <div className="hx-gif-wrap">
                                        {isVideo(ex.gif_url) ? (
                                            <video src={ex.gif_url} autoPlay loop muted playsInline />
                                        ) : (
                                            <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                        )}
                                    </div>
                                    <div className="hx-info">
                                        {ex.grupo_muscular && <div className="hx-muscle">{ex.grupo_muscular}</div>}
                                        <div className="hx-name">{ex.nome_exercicio}</div>
                                        {ex.total_sessoes != null && (
                                            <div className="hx-sessions">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                                </svg>
                                                {ex.total_sessoes} sessão{ex.total_sessoes !== 1 ? 'ões' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* ══════════════════════════════ */}
                {/* ABA — CARDIO                  */}
                {/* ══════════════════════════════ */}
                {aba === 'cardio' && (
                    loadingCardio ? (
                        <div className="hx-list">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="hx-list-card" style={{ animationDelay: `${i * 0.07}s` }}>
                                    <div className="hx-skel-gif" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        <div className="hx-skel-line" style={{ width: '60%' }} />
                                        <div className="hx-skel-line" style={{ width: '40%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : cardio.length === 0 ? (
                        <div className="hx-empty" style={{ margin: '14px 20px' }}>
                            <h5>Nenhuma sessão registrada</h5>
                            <p>Registre suas sessões de cardio para vê-las aqui</p>
                        </div>
                    ) : (
                        <>
                            {/* Resumo do mês */}
                            <div className="hx-cardio-resumo">
                                <div className="hx-cardio-stat">
                                    <span className="hx-cardio-stat-val">{totalMinMes}</span>
                                    <span className="hx-cardio-stat-lbl">Min este mês</span>
                                </div>
                                <div className="hx-cardio-stat">
                                    <span className="hx-cardio-stat-val">{totalKmMes > 0 ? totalKmMes.toFixed(1) : cardioMes.length}</span>
                                    <span className="hx-cardio-stat-lbl">{totalKmMes > 0 ? 'Km este mês' : 'Sessões este mês'}</span>
                                </div>
                            </div>

                            <div className="hx-list">
                                {cardio.map(c => (
                                    <div key={c.id} className="hx-list-card">
                                        <div className="hx-list-icon cardio">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                            </svg>
                                        </div>
                                        <div className="hx-list-body">
                                            <p className="hx-list-title">{c.nome_exercicio}</p>
                                            <p className="hx-list-sub">
                                                {c.duracao_min} min
                                                {c.distancia_km ? ` · ${parseFloat(c.distancia_km).toFixed(1)} km` : ''}
                                            </p>
                                        </div>
                                        <div className="hx-list-right">
                                            <span className="hx-list-main-val" style={{ color: '#2ECC71', fontSize: '1.2rem' }}>
                                                {c.duracao_min}<span style={{ fontSize: '0.65rem', marginLeft: 2, color: 'var(--h-text-dim)' }}>min</span>
                                            </span>
                                            <span className="hx-list-date">{fmtData(c.data)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )
                )}

                {/* ══════════════════════════════ */}
                {/* ABA — AVALIAÇÕES              */}
                {/* ══════════════════════════════ */}
                {aba === 'aval' && (
                    loadingAval ? (
                        <div className="hx-list">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="hx-list-card">
                                    <div className="hx-skel-gif" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                        <div className="hx-skel-line" style={{ width: '50%' }} />
                                        <div className="hx-skel-line" style={{ width: '70%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : avaliacoes.length === 0 ? (
                        <div className="hx-empty" style={{ margin: '14px 20px' }}>
                            <h5>Nenhuma avaliação registrada</h5>
                            <p>Registre avaliações físicas para acompanhar sua evolução</p>
                        </div>
                    ) : (
                        <div className="hx-list">
                            {avaliacoes.map(av => {
                                const bf = av.gordura_corporal != null ? parseFloat(av.gordura_corporal) : null;
                                const peso = av.peso ? parseFloat(av.peso) : null;
                                const massaGorda = bf && peso ? ((bf / 100) * peso).toFixed(1) : null;
                                const massaMagra = massaGorda && peso ? (peso - parseFloat(massaGorda)).toFixed(1) : null;
                                return (
                                    <div key={av.id} className="hx-list-card">
                                        <div className="hx-list-icon aval">
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                            </svg>
                                        </div>
                                        <div className="hx-list-body">
                                            <p className="hx-list-title">
                                                {peso ? `${peso} kg` : 'Avaliação'}
                                                {massaMagra ? ` · ${massaMagra} kg magra` : ''}
                                            </p>
                                            <p className="hx-list-sub">
                                                {av.altura ? `${Math.round(parseFloat(av.altura) * 100)} cm` : ''}
                                                {massaGorda ? ` · ${massaGorda} kg gordura` : ''}
                                            </p>
                                        </div>
                                        <div className="hx-list-right">
                                            {bf != null ? (
                                                <span className="hx-list-main-val" style={{ color: '#F1C40F' }}>
                                                    {bf.toFixed(1)}<span style={{ fontSize: '0.65rem', marginLeft: 1, color: 'var(--h-text-dim)' }}>%</span>
                                                </span>
                                            ) : null}
                                            <span className="hx-list-date">{fmtData(av.data_avaliacao)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}

            </div>

            {exercicioModal && (
                <ModalHistoricoExercicio
                    exercicio={exercicioModal}
                    userId={userId}
                    onClose={() => setExercicioModal(null)}
                />
            )}

            {mapaAberto && (
                <ModalMapaMuscular
                    userId={userId}
                    onClose={() => setMapaAberto(false)}
                />
            )}
        </PageStateHandler>
    );
}

export default HistoricoExercicios;
