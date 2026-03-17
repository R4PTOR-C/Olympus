import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../../styles/Auth.css';

function ResetPassword() {
    const { token }   = useParams();
    const navigate    = useNavigate();

    const [senha,        setSenha]        = useState('');
    const [confirmar,    setConfirmar]    = useState('');
    const [senhaVis,     setSenhaVis]     = useState(false);
    const [confirmarVis, setConfirmarVis] = useState(false);
    const [loading,      setLoading]      = useState(false);
    const [erro,         setErro]         = useState(null);
    const [sucesso,      setSucesso]      = useState(false);

    const senhasOk = senha.length >= 6 && senha === confirmar;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!senhasOk) return;
        setLoading(true);
        setErro(null);
        try {
            const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/reset-password/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha }),
            });
            const data = await res.json();
            if (res.ok) {
                setSucesso(true);
                setTimeout(() => navigate('/'), 2500);
            } else {
                setErro(data.error || 'Erro ao redefinir senha.');
            }
        } catch {
            setErro('Erro de rede. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">

                {/* ── HEADER ── */}
                <div className="auth-header">
                    <div className="auth-header-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <h1 className="auth-title">Nova Senha</h1>
                    <p className="auth-subtitle">Escolha uma senha com pelo menos 6 caracteres</p>
                </div>

                {/* ── BODY ── */}
                <div className="auth-body">
                    {sucesso ? (
                        <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                            <div className="auth-success-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <p className="auth-success-title">Senha redefinida!</p>
                            <p className="auth-success-text">Redirecionando para o login...</p>
                        </div>
                    ) : (
                        <>
                            {erro && (
                                <div className="auth-msg error">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {erro}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="auth-field">
                                    <label className="auth-label" htmlFor="nova-senha">Nova senha</label>
                                    <div className="auth-input-wrap">
                                        <input
                                            id="nova-senha"
                                            type={senhaVis ? 'text' : 'password'}
                                            className="auth-input"
                                            value={senha}
                                            onChange={e => setSenha(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            required
                                            minLength={6}
                                        />
                                        <button type="button" className="auth-eye-btn" onClick={() => setSenhaVis(v => !v)}>
                                            {senhaVis
                                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            }
                                        </button>
                                    </div>
                                </div>

                                <div className="auth-field">
                                    <label className="auth-label" htmlFor="confirmar-senha">Confirmar senha</label>
                                    <div className="auth-input-wrap">
                                        <input
                                            id="confirmar-senha"
                                            type={confirmarVis ? 'text' : 'password'}
                                            className={`auth-input${confirmar && !senhasOk ? ' auth-input-error' : ''}`}
                                            value={confirmar}
                                            onChange={e => setConfirmar(e.target.value)}
                                            placeholder="••••••••"
                                            autoComplete="new-password"
                                            required
                                        />
                                        <button type="button" className="auth-eye-btn" onClick={() => setConfirmarVis(v => !v)}>
                                            {confirmarVis
                                                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            }
                                        </button>
                                    </div>
                                    {confirmar && !senhasOk && senha.length >= 6 && (
                                        <span style={{ fontSize: '0.75rem', color: '#e05c5c', marginTop: 4, display: 'block' }}>
                                            As senhas não coincidem
                                        </span>
                                    )}
                                </div>

                                <button type="submit" className="auth-btn" disabled={!senhasOk || loading}>
                                    {loading ? 'Salvando...' : 'Salvar nova senha'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="auth-footer">
                    <div className="auth-divider" />
                    <Link to="/" className="auth-link-muted">← Voltar para o login</Link>
                </div>

            </div>
        </div>
    );
}

export default ResetPassword;
