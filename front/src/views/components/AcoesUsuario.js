import React, { useEffect, useRef, useState } from 'react';
import ModalDenuncia from './ModalDenuncia';
import ModalConfirmar from './ModalConfirmar';
import { bloquear, desbloquear } from '../../services/moderacao';
import '../../styles/Moderacao.css';

/**
 * Botão "⋮" com Denunciar / Bloquear / Desbloquear um usuário.
 *   voceBloqueou: estado atual (vem de situacaoBloqueio)
 *   onAlterado(bloqueado) — depois de bloquear/desbloquear (inclusive via denúncia)
 */
export default function AcoesUsuario({ usuarioId, nome, voceBloqueou = false, onAlterado }) {
    const [aberto, setAberto]         = useState(false);
    const [denunciar, setDenunciar]   = useState(false);
    const [confirmar, setConfirmar]   = useState(false);
    const [erro, setErro]             = useState('');
    const ref = useRef(null);

    // Fecha o menu ao tocar fora
    useEffect(() => {
        if (!aberto) return undefined;
        const fora = (e) => { if (ref.current && !ref.current.contains(e.target)) setAberto(false); };
        document.addEventListener('pointerdown', fora);
        return () => document.removeEventListener('pointerdown', fora);
    }, [aberto]);

    const alternarBloqueio = async () => {
        setConfirmar(false);
        setErro('');
        try {
            if (voceBloqueou) await desbloquear(usuarioId);
            else await bloquear(usuarioId);
            onAlterado?.(!voceBloqueou);
        } catch (err) {
            setErro(err.message);
        }
    };

    if (!usuarioId) return null;

    return (
        <div className="md-acoes" ref={ref}>
            <button
                className="md-acoes-btn"
                onClick={() => setAberto(a => !a)}
                aria-label={`Mais opções sobre ${nome || 'o usuário'}`}
                aria-haspopup="menu"
                aria-expanded={aberto}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                </svg>
            </button>

            {aberto && (
                <div className="md-acoes-menu" role="menu">
                    <button className="md-acoes-item perigoso" role="menuitem" onClick={() => { setAberto(false); setDenunciar(true); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                        </svg>
                        Denunciar
                    </button>
                    <button className="md-acoes-item perigoso" role="menuitem" onClick={() => { setAberto(false); setConfirmar(true); }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                        {voceBloqueou ? 'Desbloquear' : 'Bloquear'}
                    </button>
                </div>
            )}

            {erro && <span className="md-erro" role="alert" style={{ position: 'absolute', right: 0, top: 40, whiteSpace: 'nowrap' }}>{erro}</span>}

            {denunciar && (
                <ModalDenuncia
                    tipo="usuario"
                    dados={{ usuario_id: usuarioId }}
                    nome={nome}
                    onClose={() => setDenunciar(false)}
                    onEnviada={({ bloqueou }) => { if (bloqueou) onAlterado?.(true); }}
                />
            )}

            {confirmar && (
                <ModalConfirmar
                    titulo={voceBloqueou ? `Desbloquear ${nome || 'usuário'}?` : `Bloquear ${nome || 'usuário'}?`}
                    mensagem={voceBloqueou
                        ? 'Vocês poderão voltar a conversar e se adicionar. A amizade e a conexão desfeitas no bloqueio não voltam sozinhas.'
                        : 'Vocês não poderão trocar mensagens, se adicionar como amigos nem se conectar como professor e aluno. A amizade e a conexão atuais serão desfeitas. A pessoa não é avisada.'}
                    labelConfirmar={voceBloqueou ? 'Desbloquear' : 'Bloquear'}
                    perigoso={!voceBloqueou}
                    onConfirmar={alternarBloqueio}
                    onCancelar={() => setConfirmar(false)}
                />
            )}
        </div>
    );
}
