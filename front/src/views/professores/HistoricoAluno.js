import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageStateHandler from '../components/PageStateHandler';
import ModalHistoricoExercicio from '../components/ModalHistoricoExercicios';
import '../../styles/HistoricoExercicios.css';

const API = process.env.REACT_APP_API_BASE_URL;
const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

function HistoricoAluno() {
    const { alunoId } = useParams();
    const navigate = useNavigate();

    const [aluno,         setAluno]         = useState(null);
    const [exercicios,    setExercicios]    = useState([]);
    const [exercicioModal,setExercicioModal]= useState(null);
    const [loading,       setLoading]       = useState(true);

    const fetchDados = useCallback(async () => {
        const token = localStorage.getItem('token');
        const authH = { Authorization: `Bearer ${token}` };
        try {
            const [alunoRes, exRes] = await Promise.all([
                fetch(`${API}/usuarios/${alunoId}`, { headers: authH }),
                fetch(`${API}/treinos/usuarios/${alunoId}/exercicios_realizados`, { headers: authH }),
            ]);
            if (exRes.status === 403) {
                navigate(-1);
                return;
            }
            const [alunoData, exData] = await Promise.all([alunoRes.json(), exRes.json()]);
            setAluno(alunoData);
            setExercicios(Array.isArray(exData) ? exData : []);
        } catch (err) {
            console.error('Erro ao buscar histórico do aluno:', err);
        } finally {
            setLoading(false);
        }
    }, [alunoId, navigate]);

    useEffect(() => { fetchDados(); }, [fetchDados]);

    return (
        <PageStateHandler>
            <div className="hx-wrapper">

                {/* ── HEADER ── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px 6px',
                }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--h-text-muted)',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div>
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--h-accent)', marginBottom: 2 }}>
                            Histórico do Aluno
                        </div>
                        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.06em', color: 'var(--h-text)' }}>
                            {aluno?.nome ?? '...'}
                        </div>
                    </div>
                    {!loading && (
                        <span className="hx-page-count" style={{ marginLeft: 'auto' }}>
                            {exercicios.length} exercício{exercicios.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="hx-grid" style={{ marginTop: 12 }}>
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
                    <div className="hx-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                            <rect x="12" y="28" width="40" height="8" rx="2" fill="#2c3e50"/>
                            <rect x="6" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                            <rect x="2" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                            <rect x="52" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                            <rect x="58" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                        </svg>
                        <h5>Nenhum exercício no histórico</h5>
                        <p>Este aluno ainda não realizou nenhum treino</p>
                    </div>
                ) : (
                    <div className="hx-grid">
                        {exercicios.map((ex) => (
                            <div
                                key={ex.exercicio_id}
                                className="hx-card"
                                onClick={() => setExercicioModal(ex)}
                            >
                                <div className="hx-gif-wrap">
                                    {isVideo(ex.gif_url) ? (
                                        <video src={ex.gif_url} autoPlay loop muted playsInline />
                                    ) : (
                                        <img src={ex.gif_url} alt={ex.nome_exercicio} />
                                    )}
                                </div>
                                <div className="hx-info">
                                    {ex.grupo_muscular && (
                                        <div className="hx-muscle">{ex.grupo_muscular}</div>
                                    )}
                                    <div className="hx-name">{ex.nome_exercicio}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {exercicioModal && (
                <ModalHistoricoExercicio
                    exercicio={exercicioModal}
                    userId={alunoId}
                    onClose={() => setExercicioModal(null)}
                />
            )}
        </PageStateHandler>
    );
}

export default HistoricoAluno;
