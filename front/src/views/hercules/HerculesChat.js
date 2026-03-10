import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import '../../styles/HerculesChat.css';

function HerculesChat() {
    const [msg, setMsg] = useState('');
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const { userId } = useContext(AuthContext);
    const [ultimaMeta, setUltimaMeta] = useState(null);
    const bodyRef = useRef(null);
    const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains('dark-mode'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const herculesImg = isDark ? '/hercules.png' : '/hercules2.png';

    // auto-scroll ao receber mensagem
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [chat, loading]);

    const enviar = async (extra = {}) => {
        if (!msg.trim() && !extra.confirmado) return;

        const novaMsg = extra.confirmado ? null : { autor: 'Você', texto: msg };
        if (novaMsg) setChat(prev => [...prev, novaMsg]);
        setMsg('');
        setLoading(true);

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/hercules/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mensagem: msg,
                    usuarioId: userId,
                    ...ultimaMeta,
                    ...extra,
                }),
            });

            const data = await res.json();
            setUltimaMeta(data);
            setChat(prev => [...prev, { autor: 'Hércules', texto: data.texto, meta: data }]);
        } catch {
            setChat(prev => [...prev, { autor: 'Hércules', texto: '⚠️ Erro ao falar com Hércules.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (texto, idx) => {
        navigator.clipboard.writeText(texto);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 1400);
    };

    return (
        <div className="hc-container">

            {/* ── HEADER ── */}
            <div className="hc-header">
                <img
                    src={herculesImg}
                    alt="Hércules"
                    className="hc-header-avatar"
                />
                <div className="hc-header-info">
                    <h1 className="hc-header-name">Hércules</h1>
                    <div className="hc-header-status">
                        <span className="hc-status-dot" />
                        Assistente de treino
                    </div>
                </div>
            </div>

            {/* ── MENSAGENS ── */}
            <div className="hc-body" ref={bodyRef}>
                {chat.length === 0 && (
                    <div className="hc-empty">
                        <img src={herculesImg} alt="Hércules" className="hc-empty-img" />
                        <p className="hc-empty-text">Fale com o Hércules abaixo</p>
                    </div>
                )}

                {chat.map((c, i) => (
                    <div key={i} className={`hc-msg ${c.autor === 'Você' ? 'me' : 'herc'}`}>
                        <div className="hc-bubble">
                            {c.texto}
                        </div>

                        {c.autor === 'Hércules' && (
                            <div className="hc-msg-actions">
                                {c.meta?.confirmado === false && (
                                    <>
                                        <button
                                            className="hc-btn-confirm"
                                            onClick={() => enviar({ confirmado: true })}
                                        >
                                            Confirmar
                                        </button>
                                        <button
                                            className="hc-btn-alter"
                                            onClick={() => setMsg('')}
                                        >
                                            Alterar
                                        </button>
                                    </>
                                )}
                                <button
                                    className={`hc-btn-copy${copiedIdx === i ? ' copied' : ''}`}
                                    title="Copiar mensagem"
                                    onClick={() => handleCopy(c.texto, i)}
                                >
                                    {copiedIdx === i ? (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    ) : (
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="hc-msg herc">
                        <div className="hc-bubble typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}
            </div>

            {/* ── INPUT ── */}
            <div className="hc-input-bar">
                <input
                    className="hc-input"
                    type="text"
                    placeholder="Fale com o Hércules..."
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && enviar()}
                />
                <button
                    className="hc-send-btn"
                    onClick={() => enviar()}
                    disabled={loading}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </div>

        </div>
    );
}

export default HerculesChat;
