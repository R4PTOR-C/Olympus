import React, { useState } from 'react';
import { denunciar, MOTIVOS_USUARIO, MOTIVOS_HERCULES } from '../../services/moderacao';
import '../../styles/ModalConfirmar.css';
import '../../styles/Moderacao.css';

/**
 * Modal de denúncia.
 *   tipo:    'usuario' | 'mensagem' | 'hercules'
 *   dados:   campos da denúncia ({ usuario_id } | { mensagem_id } | { conteudo, conversa_id })
 *   nome:    nome de quem está sendo denunciado (usuario/mensagem)
 *   citacao: trecho mostrado no topo (mensagem ou resposta denunciada)
 *   onEnviada({ bloqueou }) — chamado depois de enviar com sucesso
 */
export default function ModalDenuncia({ tipo, dados, nome, citacao, onClose, onEnviada }) {
    const motivos = tipo === 'hercules' ? MOTIVOS_HERCULES : MOTIVOS_USUARIO;
    const [motivo, setMotivo]       = useState('');
    const [detalhes, setDetalhes]   = useState('');
    const [bloquear, setBloquear]   = useState(false);
    const [enviando, setEnviando]   = useState(false);
    const [enviada, setEnviada]     = useState(false);
    const [erro, setErro]           = useState('');

    const titulo = tipo === 'hercules'
        ? 'Denunciar resposta do Hércules'
        : tipo === 'mensagem'
        ? 'Denunciar mensagem'
        : `Denunciar ${nome || 'usuário'}`;

    const enviar = async () => {
        if (!motivo) { setErro('Escolha um motivo.'); return; }
        setErro('');
        setEnviando(true);
        try {
            await denunciar({ tipo, motivo, detalhes: detalhes.trim() || undefined, bloquear: tipo !== 'hercules' && bloquear, ...dados });
            setEnviada(true);
            onEnviada?.({ bloqueou: tipo !== 'hercules' && bloquear });
        } catch (err) {
            setErro(err.message);
        } finally {
            setEnviando(false);
        }
    };

    if (enviada) {
        return (
            <div className="mcf-overlay" onClick={onClose}>
                <div className="mcf-sheet md-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
                    <h2 className="mcf-title">Denúncia enviada</h2>
                    <p className="mcf-text">
                        Obrigado por avisar. Nossa equipe vai analisar e tomar as medidas necessárias.
                        {bloquear && tipo !== 'hercules' && ' Você não vai mais receber contato desta pessoa.'}
                    </p>
                    <div className="mcf-actions">
                        <button className="mcf-btn-confirm" onClick={onClose}>Fechar</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mcf-overlay" onClick={enviando ? undefined : onClose}>
            <div className="mcf-sheet md-sheet" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="md-titulo">
                <h2 id="md-titulo" className="mcf-title">{titulo}</h2>
                <p className="mcf-text">
                    {tipo === 'hercules'
                        ? 'Respostas do assistente são geradas por IA e podem errar. Sua denúncia nos ajuda a corrigi-lo.'
                        : 'A denúncia é anônima: a pessoa não fica sabendo quem denunciou.'}
                </p>

                {citacao && <blockquote className="md-citacao">{citacao}</blockquote>}

                <div className="md-motivos" role="radiogroup" aria-label="Motivo">
                    {motivos.map(m => (
                        <label key={m.valor} className={`md-motivo${motivo === m.valor ? ' ativo' : ''}`}>
                            <input
                                type="radio"
                                name="motivo-denuncia"
                                value={m.valor}
                                checked={motivo === m.valor}
                                onChange={() => setMotivo(m.valor)}
                            />
                            {m.rotulo}
                        </label>
                    ))}
                </div>

                <textarea
                    className="md-detalhes"
                    placeholder="Quer contar mais? (opcional)"
                    maxLength={1000}
                    value={detalhes}
                    onChange={e => setDetalhes(e.target.value)}
                    aria-label="Detalhes da denúncia"
                />

                {tipo !== 'hercules' && (
                    <label className="md-check">
                        <input type="checkbox" checked={bloquear} onChange={e => setBloquear(e.target.checked)} />
                        Também bloquear {nome || 'este usuário'}
                    </label>
                )}

                {erro && <p className="md-erro" role="alert">{erro}</p>}

                <div className="mcf-actions">
                    <button className="mcf-btn-cancel" onClick={onClose} disabled={enviando}>Cancelar</button>
                    <button className="mcf-btn-confirm perigoso" onClick={enviar} disabled={enviando}>
                        {enviando ? 'Enviando...' : 'Enviar denúncia'}
                    </button>
                </div>
            </div>
        </div>
    );
}
