import React, { useEffect, useRef, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { API } from '../../services/api';
import '../../styles/Auth.css';

// Página aberta pelo link do email (cadastro ou troca de email)
function ConfirmarEmail() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { loggedIn, updateUser } = useContext(AuthContext);
    const [estado, setEstado] = useState('carregando'); // carregando | ok | erro
    const [mensagem, setMensagem] = useState('');
    const enviado = useRef(false);

    useEffect(() => {
        // StrictMode roda efeitos duas vezes em dev; o token só vale uma
        if (enviado.current) return;
        enviado.current = true;
        (async () => {
            try {
                const res = await fetch(`${API}/usuarios/confirmar-email/${token}`, { method: 'POST' });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) { setEstado('erro'); setMensagem(data.error || 'Não foi possível confirmar.'); return; }
                setEstado('ok');
                setMensagem(data.email);
                // Se este navegador está logado, atualiza o aviso na hora
                if (loggedIn) {
                    const s = await fetch(`${API}/session`).then(r => r.json()).catch(() => null);
                    if (s?.loggedIn) updateUser({ email: s.email, emailVerificado: s.emailVerificado });
                }
            } catch {
                setEstado('erro');
                setMensagem('Erro de rede. Verifique sua conexão e abra o link de novo.');
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-header-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.9)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
                        </svg>
                    </div>
                    <h1 className="auth-title">Confirmação de email</h1>
                </div>

                <div className="auth-body">
                    <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                        {estado === 'carregando' && <p className="auth-success-text">Confirmando...</p>}
                        {estado === 'ok' && (
                            <>
                                <div className="auth-success-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </div>
                                <p className="auth-success-title">Email confirmado!</p>
                                <p className="auth-success-text">
                                    <strong style={{ color: '#E8EDF5', overflowWrap: 'anywhere' }}>{mensagem}</strong> está confirmado na sua conta.
                                </p>
                            </>
                        )}
                        {estado === 'erro' && (
                            <>
                                <p className="auth-success-title">Não deu certo</p>
                                <p className="auth-success-text">{mensagem}</p>
                            </>
                        )}
                    </div>
                    {estado !== 'carregando' && (
                        <button type="button" className="auth-btn" onClick={() => navigate('/')}>
                            {loggedIn ? 'Voltar ao app' : 'Entrar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ConfirmarEmail;
