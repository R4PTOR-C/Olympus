import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/Auth.css';

function ForgotPassword() {
    const [email,   setEmail]   = useState('');
    const [loading, setLoading] = useState(false);
    const [erro,    setErro]    = useState(null);
    const [sucesso, setSucesso] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(null);
        try {
            const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const text = await res.text();
            let data = {};
            try { data = JSON.parse(text); } catch {}

            if (res.ok) {
                setSucesso(true);
            } else {
                setErro(data.error || 'Erro ao solicitar redefinição de senha.');
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
                    <h1 className="auth-title">Recuperar Senha</h1>
                    <p className="auth-subtitle">Enviaremos um link para o seu email</p>
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
                            <p className="auth-success-title">Email enviado!</p>
                            <p className="auth-success-text">
                                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                            </p>
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
                                    <label className="auth-label" htmlFor="email-fp">Email</label>
                                    <input
                                        id="email-fp"
                                        type="email"
                                        className="auth-input"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                                <button type="submit" className="auth-btn" disabled={loading}>
                                    {loading ? 'Enviando...' : 'Enviar link'}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="auth-footer">
                    <div className="auth-divider" />
                    <Link to="/" className="auth-link-muted">
                        ← Voltar para o login
                    </Link>
                </div>

            </div>
        </div>
    );
}

export default ForgotPassword;
