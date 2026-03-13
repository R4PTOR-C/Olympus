import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import HerculesSidebar from './HerculesSidebar';
import '../../styles/HerculesChat.css';

const API = process.env.REACT_APP_API_BASE_URL;

function HerculesChat() {
    const [msg, setMsg] = useState('');
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [copiedIdx, setCopiedIdx] = useState(null);
    const { userId } = useContext(AuthContext);
    const [ultimaMeta, setUltimaMeta] = useState(null);
    const [conversaAtiva, setConversaAtiva] = useState(null);
    const [conversas, setConversas] = useState([]);
    const [sidebarAberta, setSidebarAberta] = useState(false);
    const bodyRef = useRef(null);
    const [isDark, setIsDark] = useState(() => document.body.classList.contains('dark-mode'));

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.body.classList.contains('dark-mode'));
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const herculesImg = isDark ? '/hercules.png' : '/hercules.png';

    // Carrega lista de conversas ao abrir
    useEffect(() => {
        if (!userId) return;
        fetch(`${API}/hercules/conversas/${userId}`)
            .then(r => r.json())
            .then(rows => {
                if (Array.isArray(rows)) {
                    setConversas(rows);
                    // Abre a conversa mais recente automaticamente
                    if (rows.length > 0) carregarConversa(rows[0]);
                }
            })
            .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    // auto-scroll ao receber mensagem
    useEffect(() => {
        if (bodyRef.current) {
            bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
        }
    }, [chat, loading]);

    const carregarConversa = (conversa) => {
        setConversaAtiva(conversa.id);
        setChat([]);
        setUltimaMeta(null);
        fetch(`${API}/hercules/historico/${conversa.id}`)
            .then(r => r.json())
            .then(rows => {
                if (Array.isArray(rows)) {
                    setChat(rows.map(r => ({ autor: r.autor === 'user' ? 'Você' : 'Hércules', texto: r.texto, meta: r.meta })));
                    const ultima = rows.filter(r => r.autor === 'hercules').pop();
                    if (ultima?.meta) setUltimaMeta(ultima.meta);
                }
            })
            .catch(() => {});
    };

    const novaConversa = () => {
        setConversaAtiva(null);
        setChat([]);
        setUltimaMeta(null);
        setSidebarAberta(false);
    };

    const selecionarConversa = (conversa) => {
        carregarConversa(conversa);
        setSidebarAberta(false);
    };

    const deletarConversa = async (id) => {
        await fetch(`${API}/hercules/conversas/${id}`, { method: 'DELETE' }).catch(() => {});
        const novas = conversas.filter(c => c.id !== id);
        setConversas(novas);
        if (conversaAtiva === id) {
            if (novas.length > 0) carregarConversa(novas[0]);
            else novaConversa();
        }
    };

    const salvarMensagem = (autor, texto, meta, idConversa) => {
        fetch(`${API}/hercules/historico`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: userId, autor, texto, meta: meta || null, conversaId: idConversa }),
        }).catch(() => {});
    };

    const enviar = async (extra = {}) => {
        if (!msg.trim() && !extra.confirmado) return;

        // Primeira mensagem da conversa → criar conversa
        let idConversa = conversaAtiva;
        if (!idConversa && msg.trim()) {
            try {
                const res = await fetch(`${API}/hercules/conversas`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usuarioId: userId, titulo: msg.trim().substring(0, 50) }),
                });
                const nova = await res.json();
                idConversa = nova.id;
                setConversaAtiva(nova.id);
                setConversas(prev => [nova, ...prev]);
            } catch { /* continua sem conversa_id */ }
        }

        const novaMsg = extra.confirmado ? null : { autor: 'Você', texto: msg };
        if (novaMsg) {
            setChat(prev => [...prev, novaMsg]);
            salvarMensagem('user', msg, null, idConversa);
        }
        setMsg('');
        setLoading(true);

        try {
            const res = await fetch(`${API}/hercules/chat`, {
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
            salvarMensagem('hercules', data.texto, data, idConversa);
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

            <HerculesSidebar
                aberta={sidebarAberta}
                conversas={conversas}
                conversaAtiva={conversaAtiva}
                onSelecionar={selecionarConversa}
                onNova={novaConversa}
                onDeletar={deletarConversa}
                onFechar={() => setSidebarAberta(false)}
            />

            {/* ── HEADER ── */}
            <div className="hc-header">
                <button className="hc-menu-btn" onClick={() => setSidebarAberta(true)} aria-label="Conversas">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="3" y1="6" x2="21" y2="6"/>
                        <line x1="3" y1="12" x2="21" y2="12"/>
                        <line x1="3" y1="18" x2="21" y2="18"/>
                    </svg>
                </button>
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
