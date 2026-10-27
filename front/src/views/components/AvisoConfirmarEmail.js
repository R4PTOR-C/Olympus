import React, { useContext, useState } from 'react';
import { AuthContext } from '../../AuthContext';
import { reenviarConfirmacao } from '../../utils/emailConfirmacao';

// Aviso para quem ainda não confirmou o email do cadastro. Dá pra fechar,
// mas volta na próxima vez que o app abrir.
const CHAVE_FECHADO = 'aviso-email-fechado';

export default function AvisoConfirmarEmail() {
    const { userId, email, emailVerificado } = useContext(AuthContext);
    const [fechado, setFechado] = useState(() => {
        try { return sessionStorage.getItem(CHAVE_FECHADO) === '1'; } catch { return false; }
    });
    const [enviando, setEnviando] = useState(false);
    const [retorno, setRetorno] = useState(null);

    if (emailVerificado !== false || fechado) return null;

    const reenviar = async () => {
        setEnviando(true);
        setRetorno(await reenviarConfirmacao(userId));
        setEnviando(false);
    };

    const fechar = () => {
        try { sessionStorage.setItem(CHAVE_FECHADO, '1'); } catch { /* storage indisponível */ }
        setFechado(true);
    };

    return (
        <div style={S.card} role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--h-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={S.titulo}>Confirme seu email</div>
                <div style={S.texto}>
                    Enviamos um link para <strong style={{ overflowWrap: 'anywhere' }}>{email}</strong>. Ele garante que você consiga recuperar a senha.
                </div>
                {retorno ? (
                    <div style={{ ...S.texto, marginTop: 6, color: retorno.ok ? '#2ECC71' : '#E05C5C' }}>{retorno.msg}</div>
                ) : (
                    <button type="button" style={S.link} onClick={reenviar} disabled={enviando}>
                        {enviando ? 'Enviando...' : 'Reenviar email'}
                    </button>
                )}
            </div>
            <button type="button" style={S.fechar} onClick={fechar} aria-label="Fechar aviso">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    );
}

const S = {
    card: {
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        margin: '0 16px 16px',
        padding: '14px 12px 14px 14px',
        borderRadius: 14,
        background: 'var(--h-accent-dim)',
        border: '1px solid rgba(74, 144, 217, 0.25)',
        fontFamily: "'Barlow', sans-serif",
    },
    titulo: { fontWeight: 600, fontSize: '0.9rem', color: 'var(--h-text)', marginBottom: 2 },
    texto: { fontSize: '0.8rem', color: 'var(--h-text-muted)', lineHeight: 1.45 },
    link: {
        marginTop: 6,
        padding: 0,
        background: 'none',
        border: 'none',
        color: 'var(--h-accent)',
        fontWeight: 600,
        fontSize: '0.8rem',
        cursor: 'pointer',
    },
    fechar: {
        flexShrink: 0,
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'none',
        border: 'none',
        color: 'var(--h-text-dim)',
        cursor: 'pointer',
        padding: 0,
    },
};
