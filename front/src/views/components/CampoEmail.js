import React, { useState } from 'react';
import { reenviarConfirmacao } from '../../utils/emailConfirmacao';

// Linha "Email" das telas de perfil, com a situação da confirmação embaixo.
// Mesmo visual dos outros campos (classes ue-field*).
export default function CampoEmail({ usuario, onEditar }) {
    const [retorno, setRetorno] = useState(null);
    const [enviando, setEnviando] = useState(false);

    const reenviar = async (e) => {
        e.stopPropagation(); // não abre o modal de troca
        setEnviando(true);
        setRetorno(await reenviarConfirmacao(usuario.id));
        setEnviando(false);
    };

    let status = null;
    if (usuario.email_pendente) {
        status = <>Aguardando confirmação de <strong style={{ overflowWrap: 'anywhere' }}>{usuario.email_pendente}</strong></>;
    } else if (usuario.email_verificado === false) {
        status = 'Email não confirmado';
    }

    return (
        <div className="ue-field" onClick={onEditar}>
            <div className="ue-field-info">
                <div className="ue-field-label">Email</div>
                <div className="ue-field-value" style={{ overflowWrap: 'anywhere' }}>{usuario.email}</div>
                {status && (
                    <div style={S.status}>
                        {status}
                        {' · '}
                        {retorno ? (
                            <span style={{ color: retorno.ok ? '#2ECC71' : '#E05C5C' }}>{retorno.msg}</span>
                        ) : (
                            <button type="button" style={S.link} onClick={reenviar} disabled={enviando}>
                                {enviando ? 'enviando...' : 'reenviar link'}
                            </button>
                        )}
                    </div>
                )}
            </div>
            <svg className="ue-field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </div>
    );
}

const S = {
    status: { marginTop: 4, fontSize: '0.75rem', lineHeight: 1.4, color: '#E0A040' },
    link: { padding: 0, background: 'none', border: 'none', color: 'var(--h-accent)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' },
};
