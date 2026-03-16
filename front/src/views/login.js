import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/Auth.css';

function Login() {
    const [email,       setEmail]       = useState('');
    const [senha,       setSenha]       = useState('');
    const [senhaVis,    setSenhaVis]    = useState(false);
    const [loading,     setLoading]     = useState(false);
    const [erro,        setErro]        = useState(null);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    useEffect(() => {
        document.documentElement.style.overflow = 'hidden';
        document.documentElement.style.position = 'fixed';
        document.documentElement.style.width = '100%';
        return () => {
            document.documentElement.style.overflow = '';
            document.documentElement.style.position = '';
            document.documentElement.style.width = '';
        };
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(null);
        try {
            const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha }),
            });
            const data = await res.json();

            if (res.ok) {
                login({ userName: data.userName, userId: data.userId, funcao: data.funcao, avatar: data.avatar }, data.token);
                if (data.funcao === 'Professor') navigate('/usuarios');
                else navigate(`/home/${data.userId}`);
            } else {
                setErro(data.error || 'Email ou senha incorretos.');
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
                    <img src="/logo2.png" alt="Olympus" className="auth-logo" width="175" height="175" decoding="sync" fetchpriority="high" />
                    <img src="/logo_texto.png" alt="Olympus" className="auth-logo-texto" width="160" decoding="sync" />
                </div>

                {/* ── BODY ── */}
                <div className="auth-body">
                    {erro && (
                        <div className="auth-msg error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label className="auth-label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                className="auth-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="senha">Senha</label>
                            <div className="auth-input-wrap">
                                <input
                                    id="senha"
                                    type={senhaVis ? 'text' : 'password'}
                                    className="auth-input"
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    required
                                />
                                <button type="button" className="auth-eye-btn" onClick={() => setSenhaVis(v => !v)} aria-label="Mostrar senha">
                                    {senhaVis
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>

                {/* ── FOOTER ── */}
                <div className="auth-footer">
                    <Link to="/forgot-password" className="auth-link-muted">Esqueceu a senha?</Link>
                    <div className="auth-divider" />
                    <p className="auth-footer-text">
                        Não tem uma conta?{' '}
                        <Link to="/sign-in">Cadastrar-se</Link>
                    </p>
                    <p className="auth-footer-text">
                        É personal trainer?{' '}
                        <Link to="/sign-in_professor">Cadastre-se aqui</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}

export default Login;
