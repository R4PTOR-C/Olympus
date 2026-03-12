import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import { io } from "socket.io-client";
import '../../styles/HerculesChat.css';

function ChatView() {
    const { chatId }  = useParams();
    const { userId }  = useContext(AuthContext);
    const navigate    = useNavigate();

    const [mensagens,       setMensagens]       = useState([]);
    const [novaMensagem,    setNovaMensagem]    = useState("");
    const [parceiro,        setParceiro]        = useState(null);
    const [usuarioDigitando,setUsuarioDigitando]= useState(false);
    const [digitando,       setDigitando]       = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef      = useRef(null);
    const API_URL        = process.env.REACT_APP_API_BASE_URL;

    // ── Socket ──
    useEffect(() => {
        socketRef.current = io(API_URL, { transports: ["websocket"] });
        socketRef.current.emit("entrar_chat", chatId);

        socketRef.current.on("nova_mensagem", (msg) => {
            setMensagens((prev) => [...prev, msg]);
        });
        socketRef.current.on("usuario_digitando", (uid) => {
            if (uid !== userId) setUsuarioDigitando(true);
        });
        socketRef.current.on("usuario_parou_digitar", (uid) => {
            if (uid !== userId) setUsuarioDigitando(false);
        });

        return () => socketRef.current.disconnect();
    }, [API_URL, chatId, userId]);

    // ── Carregar histórico e parceiro ──
    useEffect(() => {
        const carregar = async () => {
            try {
                const [resChat, resMsgs] = await Promise.all([
                    fetch(`${API_URL}/chat/${chatId}`),
                    fetch(`${API_URL}/chat/mensagens/${chatId}`),
                ]);
                const chat = await resChat.json();
                const msgs = await resMsgs.json();

                setParceiro(
                    chat.usuario1_id === userId
                        ? { nome: chat.nome2, avatar: chat.avatar2 }
                        : { nome: chat.nome1, avatar: chat.avatar1 }
                );
                setMensagens(msgs);
            } catch (err) {
                console.error("Erro ao carregar chat:", err);
            }
        };
        carregar();
    }, [chatId, API_URL, userId]);

    // ── Scroll automático ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    const enviarMensagem = (e) => {
        e.preventDefault();
        if (!novaMensagem.trim()) return;
        socketRef.current.emit("enviar_mensagem", {
            chat_id:      chatId,
            remetente_id: userId,
            conteudo:     novaMensagem,
        });
        setNovaMensagem("");
        socketRef.current.emit("parou_digitar", { chat_id: chatId, usuario_id: userId });
    };

    const handleChange = (e) => {
        setNovaMensagem(e.target.value);
        if (!digitando) {
            setDigitando(true);
            socketRef.current.emit("digitando", { chat_id: chatId, usuario_id: userId });
        }
        clearTimeout(window.digitarTimeout);
        window.digitarTimeout = setTimeout(() => {
            setDigitando(false);
            socketRef.current.emit("parou_digitar", { chat_id: chatId, usuario_id: userId });
        }, 1000);
    };

    const avatarUrl = parceiro?.avatar?.startsWith("http")
        ? parceiro.avatar
        : parceiro?.avatar
            ? `${API_URL}/${parceiro.avatar}`
            : null;

    return (
        <div className="hc-container">

            {/* ── HEADER ── */}
            <div className="hc-header">
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'none', border: 'none', color: 'rgba(200,209,208,0.6)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                    aria-label="Voltar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6"/>
                    </svg>
                </button>

                {avatarUrl ? (
                    <img src={avatarUrl} alt={parceiro?.nome} className="hc-header-avatar" />
                ) : (
                    <div className="hc-header-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,209,208,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                )}

                <div className="hc-header-info">
                    <p className="hc-header-name">{parceiro?.nome || '...'}</p>
                    <div className="hc-header-status">
                        <span className="hc-status-dot" />
                        {usuarioDigitando ? 'digitando...' : 'online'}
                    </div>
                </div>
            </div>

            {/* ── MENSAGENS ── */}
            <div className="hc-body">
                {mensagens.length === 0 && (
                    <div className="hc-empty">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25, color: 'var(--hc-text-dim)' }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <p className="hc-empty-text">Nenhuma mensagem ainda.<br/>Diga olá!</p>
                    </div>
                )}

                {mensagens.map((m) => {
                    const isMe = m.remetente_id === userId;
                    const hora = new Date(m.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                        <div key={m.id} className={`hc-msg ${isMe ? 'me' : 'herc'}`}>
                            <div className="hc-bubble">{m.conteudo}</div>
                            <span style={{ fontSize: '0.62rem', color: 'var(--hc-text-dim)', marginTop: 3, letterSpacing: '0.04em' }}>
                                {hora}
                            </span>
                        </div>
                    );
                })}

                {usuarioDigitando && (
                    <div className="hc-msg herc">
                        <div className="hc-bubble typing">
                            <span /><span /><span />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── INPUT ── */}
            <form className="hc-input-bar" onSubmit={enviarMensagem}>
                <input
                    className="hc-input"
                    type="text"
                    placeholder="Digite uma mensagem..."
                    value={novaMensagem}
                    onChange={handleChange}
                    autoComplete="off"
                />
                <button className="hc-send-btn" type="submit" disabled={!novaMensagem.trim()} aria-label="Enviar">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                </button>
            </form>

        </div>
    );
}

export default ChatView;
