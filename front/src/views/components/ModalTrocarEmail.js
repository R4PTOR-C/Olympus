import React, { useState, useEffect } from 'react';
import { API } from '../../services/api';
import '../../styles/ModalEdicaoCampo.css';

// Troca de email: pede a senha atual e só efetiva depois que o novo email
// for confirmado pelo link (o backend guarda como email_pendente).
const ModalTrocarEmail = ({ usuarioId, emailAtual, onClose, onSucesso }) => {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const novo = email.trim().toLowerCase();
    const podeSalvar = novo && novo !== emailAtual && senha && !salvando;

    const salvar = async (e) => {
        e.preventDefault();
        if (!podeSalvar) return;
        setSalvando(true);
        setErro(null);
        try {
            const formData = new FormData();
            formData.append('email', novo);
            formData.append('senha_atual', senha);
            const res = await fetch(`${API}/usuarios/${usuarioId}`, { method: 'PUT', body: formData });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setErro(data.error || 'Não foi possível trocar o email.'); return; }
            onSucesso(novo);
        } catch {
            setErro('Erro de rede. Verifique sua conexão.');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="mec-overlay" onClick={onClose}>
            <form className="mec-sheet" onClick={e => e.stopPropagation()} onSubmit={salvar}>

                <div className="mec-header">
                    <div className="mec-header-info">
                        <div className="mec-label">Editando</div>
                        <div className="mec-title">Email</div>
                    </div>
                    <button type="button" className="mec-close-btn" onClick={onClose} aria-label="Fechar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6"  y2="18"/>
                            <line x1="6"  y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div className="mec-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <p style={S.texto}>
                        Vamos mandar um link para o novo email. Ele só passa a valer depois que você confirmar.
                    </p>
                    {erro && <div style={S.erro}>{erro}</div>}
                    <label style={S.label} htmlFor="mte-email">Novo email</label>
                    <input
                        id="mte-email"
                        type="email"
                        className="mec-input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={emailAtual}
                        autoComplete="email"
                        autoFocus
                    />
                    <label style={S.label} htmlFor="mte-senha">Senha atual</label>
                    <input
                        id="mte-senha"
                        type="password"
                        className="mec-input"
                        value={senha}
                        onChange={e => setSenha(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                <div className="mec-footer">
                    <button type="button" className="mec-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="mec-btn-save" disabled={!podeSalvar}>
                        {salvando ? 'Enviando...' : 'Enviar link'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const S = {
    texto: { margin: 0, fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--h-text-muted)' },
    label: { fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--h-text-muted)', marginBottom: -6 },
    erro: { fontSize: '0.8rem', color: '#E05C5C', background: 'rgba(224, 92, 92, 0.1)', border: '1px solid rgba(224, 92, 92, 0.25)', borderRadius: 10, padding: '8px 12px' },
};

export default ModalTrocarEmail;
