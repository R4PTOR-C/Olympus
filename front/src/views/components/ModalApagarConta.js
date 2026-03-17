import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

const API = process.env.REACT_APP_API_BASE_URL;

const ModalApagarConta = ({ emailCorreto, usuarioId, onClose }) => {
    const { logout } = useContext(AuthContext);
    const navigate   = useNavigate();
    const [email,    setEmail]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const [erro,     setErro]     = useState(null);
    const [cooldown, setCooldown] = useState(0);

    const confirmado = email.trim().toLowerCase() === emailCorreto?.trim().toLowerCase();

    // Inicia cooldown de 2s quando o email fica correto
    useEffect(() => {
        if (confirmado) {
            setCooldown(2);
            const interval = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) { clearInterval(interval); return 0; }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setCooldown(0);
        }
    }, [confirmado]);

    const handleApagar = async () => {
        if (!confirmado) return;
        setLoading(true);
        setErro(null);
        try {
            const res = await fetch(`${API}/usuarios/${usuarioId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            logout();
            navigate('/');
        } catch {
            setErro('Erro ao apagar conta. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="mac-overlay" onClick={onClose}>
            <div className="mac-sheet" onClick={e => e.stopPropagation()}>

                <div className="mac-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                </div>

                <h2 className="mac-title">Que pena que quer ir embora...</h2>
                <p className="mac-text">
                    Esperamos que volte um dia! Esta ação é <strong>irreversível</strong> — todos os seus treinos, histórico e dados serão permanentemente apagados.
                </p>
                <p className="mac-text mac-text-small">
                    Para confirmar, digite seu email abaixo:
                </p>

                <input
                    type="email"
                    className="mac-input"
                    placeholder={emailCorreto}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="off"
                />

                {erro && <p className="mac-erro">{erro}</p>}

                <div className="mac-actions">
                    <button className="mac-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className="mac-btn-confirm"
                        onClick={handleApagar}
                        disabled={!confirmado || cooldown > 0 || loading}
                    >
                        {loading ? 'Apagando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Apagar conta'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalApagarConta;
