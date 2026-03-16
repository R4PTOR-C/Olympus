import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../../AuthContext';
import PageStateHandler from '../components/PageStateHandler';
import ModalHistoricoExercicio from '../components/ModalHistoricoExercicios';
import ModalMapaMuscular from '../components/ModalMapaMuscular';
import PullToRefresh from '../components/PullToRefresh';
import '../../styles/HistoricoExercicios.css';

const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

function HistoricoExercicios() {
    const { userId } = useContext(AuthContext);

    const [exercicios, setExercicios] = useState([]);
    const [exercicioModal, setExercicioModal] = useState(null);
    const [mapaAberto, setMapaAberto] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchExercicios = useCallback(async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios_realizados`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setExercicios(data);
        } catch (err) {
            console.error('Erro ao buscar exercícios realizados:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchExercicios(); }, [fetchExercicios]);

    return (
        <PageStateHandler>
            <PullToRefresh onRefresh={fetchExercicios} />
            <div className="hx-wrapper">

                {/* ── PAGE HEADER ── */}
                <div className="hx-page-header">
                    <span className="hx-page-title">Histórico por Exercício</span>
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
                </div>

                {loading ? (
                    <div className="hx-grid">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="hx-card-skel" style={{ animationDelay: `${i * 0.07}s` }}>
                                <div className="hx-skel-gif" style={{ animationDelay: `${i * 0.07}s` }} />
                                <div className="hx-skel-info">
                                    <div className="hx-skel-line" style={{ width: '50%', animationDelay: `${i * 0.07}s` }} />
                                    <div className="hx-skel-line" style={{ width: '80%', animationDelay: `${i * 0.07 + 0.1}s` }} />
                                    <div className="hx-skel-line" style={{ width: '40%', animationDelay: `${i * 0.07 + 0.2}s` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : exercicios.length === 0 ? (
                    /* ── EMPTY STATE ── */
                    <div className="hx-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 64 64" fill="none">
                            <rect x="12" y="28" width="40" height="8" rx="2" fill="#2c3e50"/>
                            <rect x="6" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                            <rect x="2" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                            <rect x="52" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                            <rect x="58" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                            <text x="20" y="25" fontSize="10" fontWeight="bold" fill="#3D4E6A">Z
                                <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" dur="2s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite"/>
                            </text>
                            <text x="26" y="20" fontSize="8" fontWeight="bold" fill="#3D4E6A">Z
                                <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" begin="0.6s" dur="2s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="1;0" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                            </text>
                            <text x="32" y="15" fontSize="6" fontWeight="bold" fill="#3D4E6A">Z
                                <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" begin="1.2s" dur="2s" repeatCount="indefinite"/>
                                <animate attributeName="opacity" values="1;0" dur="2s" begin="1.2s" repeatCount="indefinite"/>
                            </text>
                        </svg>
                        <h5>Nenhum exercício no histórico</h5>
                        <p>Complete seus treinos para ver o histórico aqui</p>
                    </div>
                ) : (
                    /* ── GRID DE CARDS ── */
                    <div className="hx-grid">
                        {exercicios.map((ex) => (
                            <div
                                key={ex.exercicio_id}
                                className="hx-card"
                                onClick={() => setExercicioModal(ex)}
                            >
                                {/* GIF / Vídeo no topo */}
                                <div className="hx-gif-wrap">
                                    {isVideo(ex.gif_url) ? (
                                        <video src={ex.gif_url} autoPlay loop muted playsInline />
                                    ) : (
                                        <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                    )}
                                </div>

                                {/* Info embaixo */}
                                <div className="hx-info">
                                    {ex.grupo_muscular && (
                                        <div className="hx-muscle">{ex.grupo_muscular}</div>
                                    )}
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
