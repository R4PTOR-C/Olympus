import React, { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import PageStateHandler from '../components/PageStateHandler';
import '../../styles/HistoricoExercicios.css';

const API = process.env.REACT_APP_API_BASE_URL;

function AvatarPlaceholder() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
    );
}

function HistoricoAlunos() {
    const { userId } = useContext(AuthContext);
    const navigate = useNavigate();

    const [alunos,  setAlunos]  = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAlunos = useCallback(async () => {
        try {
            const res = await fetch(`${API}/vinculos/meus-alunos/${userId}`);
            const data = await res.json();
            setAlunos(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Erro ao buscar alunos:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { fetchAlunos(); }, [fetchAlunos]);

    return (
        <PageStateHandler>
            <div className="hx-wrapper">

                {/* ── HEADER ── */}
                <div className="hx-page-header">
                    <span className="hx-page-title">Histórico</span>
                    {!loading && alunos.length > 0 && (
                        <span className="hx-page-count">
                            {alunos.length} aluno{alunos.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>

                {loading ? (
                    /* ── SKELETON ── */
                    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[...Array(4)].map((_, i) => (
                            <div key={i} style={{
                                background: 'var(--h-surface)',
                                border: '1px solid var(--h-border)',
                                borderRadius: 'var(--h-radius-md)',
                                padding: '14px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                            }}>
                                <div className="hx-skel-line" style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0, animationDelay: `${i * 0.1}s` }} />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div className="hx-skel-line" style={{ width: '55%', animationDelay: `${i * 0.1}s` }} />
                                    <div className="hx-skel-line" style={{ width: '35%', animationDelay: `${i * 0.1 + 0.1}s` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : alunos.length === 0 ? (
                    /* ── EMPTY ── */
                    <div className="hx-empty">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <h5>Nenhum aluno vinculado</h5>
                        <p>Vincule alunos para ver o histórico deles aqui</p>
                    </div>
                ) : (
                    /* ── LISTA DE ALUNOS ── */
                    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {alunos.map((aluno, i) => (
                            <div
                                key={aluno.id}
                                onClick={() => navigate(`/historico-aluno/${aluno.id}`)}
                                style={{
                                    background: 'var(--h-surface)',
                                    border: '1px solid var(--h-border)',
                                    borderRadius: 'var(--h-radius-md)',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 14,
                                    cursor: 'pointer',
                                    boxShadow: 'var(--h-shadow)',
                                    animation: 'h-fadeUp 0.3s ease both',
                                    animationDelay: `${i * 0.05}s`,
                                    transition: 'box-shadow 0.2s',
                                }}
                            >
                                {/* Avatar */}
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    flexShrink: 0, overflow: 'hidden',
                                    background: 'var(--h-surface-3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid var(--h-border)',
                                }}>
                                    {aluno.avatar
                                        ? <img src={aluno.avatar} alt={aluno.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <AvatarPlaceholder />
                                    }
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--h-text)' }}>
                                        {aluno.nome}
                                    </div>
                                    {(aluno.objetivo || aluno.idade) && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--h-text-muted)', marginTop: 3 }}>
                                            {[aluno.objetivo, aluno.idade && `${aluno.idade} anos`].filter(Boolean).join(' · ')}
                                        </div>
                                    )}
                                </div>

                                {/* Chevron */}
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-dim)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 18l6-6-6-6"/>
                                </svg>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </PageStateHandler>
    );
}

export default HistoricoAlunos;
