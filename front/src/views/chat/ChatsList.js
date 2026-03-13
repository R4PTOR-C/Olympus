import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import '../../styles/home.css';

const API_URL = process.env.REACT_APP_API_BASE_URL;

function formatarHora(dataStr) {
    if (!dataStr) return null;
    const data = new Date(dataStr);
    const hoje = new Date();
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);

    if (data.toDateString() === hoje.toDateString())
        return data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (data.toDateString() === ontem.toDateString())
        return 'Ontem';
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function ChatCard({ chat, onClick }) {
    const avatarUrl = chat.parceiro_avatar?.startsWith('http')
        ? chat.parceiro_avatar
        : chat.parceiro_avatar
            ? `${API_URL}/${chat.parceiro_avatar}`
            : null;

    return (
        <button
            onClick={onClick}
            style={{
                width: '100%',
                background: 'var(--h-surface)',
                border: '1px solid var(--h-border)',
                borderRadius: 'var(--h-radius-md)',
                padding: '13px 15px',
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                boxShadow: 'var(--h-shadow)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
                WebkitTapHighlightColor: 'transparent',
            }}
        >
            {/* Avatar */}
            <div style={{
                width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                background: 'var(--h-surface-3)',
                border: chat.arquivado
                    ? '2px solid var(--h-border)'
                    : '2px solid rgba(74,144,217,0.3)',
                overflow: 'hidden',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: chat.arquivado ? 0.6 : 1,
            }}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={chat.parceiro_nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-dim)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 3,
                }}>
                    <p style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: '1rem', fontWeight: 700,
                        color: chat.arquivado ? 'var(--h-text-muted)' : 'var(--h-text)',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {chat.parceiro_nome}
                    </p>
                    <span style={{
                        fontSize: '0.65rem', color: 'var(--h-text-dim)',
                        flexShrink: 0, letterSpacing: '0.04em',
                    }}>
                        {formatarHora(chat.ultima_data)}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {chat.arquivado && (
                        <span style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '0.58rem', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase',
                            color: 'var(--h-text-dim)',
                            background: 'var(--h-surface-3)',
                            border: '1px solid var(--h-border)',
                            borderRadius: 6, padding: '1px 6px',
                            flexShrink: 0,
                        }}>
                            Arquivado
                        </span>
                    )}
                    <p style={{
                        fontSize: '0.78rem', color: 'var(--h-text-muted)',
                        margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        opacity: chat.arquivado ? 0.6 : 1,
                    }}>
                        {chat.ultima_mensagem || 'Sem mensagens ainda'}
                    </p>
                </div>
            </div>

            {/* Chevron */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
    );
}

function ChatsList() {
    const { userId, clearMensagensNaoLidas } = useContext(AuthContext);
    const navigate      = useNavigate();
    const [chats,       setChats]       = useState([]);
    const [loading,     setLoading]     = useState(true);

    useEffect(() => { clearMensagensNaoLidas(); }, []);
    const [arquivadosAbertos, setArquivadosAbertos] = useState(false);

    useEffect(() => {
        fetch(`${API_URL}/chat/usuario/${userId}`)
            .then(r => r.json())
            .then(data => { setChats(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [userId]);

    const ativos     = chats.filter(c => !c.arquivado);
    const arquivados = chats.filter(c =>  c.arquivado);

    return (
        <div className="home-wrapper">

            {/* ── HEADER ── */}
            <div className="h-greeting">
                <p className="h-greeting-date">Olympus</p>
                <h1 className="h-greeting-title">Mensagens</h1>
                <p className="h-greeting-sub">
                    {loading ? 'Carregando...' : `${ativos.length} conversa${ativos.length !== 1 ? 's' : ''} ativa${ativos.length !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* ── LOADING ── */}
            {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px' }}>
                    {[1,2,3].map(i => (
                        <div key={i} style={{
                            background: 'var(--h-surface)', border: '1px solid var(--h-border)',
                            borderRadius: 'var(--h-radius-md)', padding: '13px 15px',
                            display: 'flex', alignItems: 'center', gap: 13,
                        }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--h-surface-3)', flexShrink: 0, animation: 'al-pulse 1.4s ease-in-out infinite' }} />
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ height: 10, borderRadius: 6, background: 'var(--h-surface-3)', animation: 'al-pulse 1.4s ease-in-out infinite' }} />
                                <div style={{ height: 10, borderRadius: 6, background: 'var(--h-surface-3)', width: '60%', animation: 'al-pulse 1.4s ease-in-out infinite' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── CONVERSAS ATIVAS ── */}
            {!loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 20px 14px' }}>
                    {ativos.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '2.5rem 1.5rem',
                            background: 'var(--h-surface)', border: '1px solid var(--h-border)',
                            borderRadius: 'var(--h-radius-md)', color: 'var(--h-text-dim)', fontSize: '0.85rem',
                        }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px', opacity: 0.4 }}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            Nenhuma conversa ativa.
                        </div>
                    ) : ativos.map(c => (
                        <ChatCard key={c.chat_id} chat={c} onClick={() => navigate(`/chat/${c.chat_id}`)} />
                    ))}
                </div>
            )}

            {/* ── ARQUIVADOS ── */}
            {!loading && arquivados.length > 0 && (
                <div style={{ padding: '0 20px 24px' }}>
                    <button
                        onClick={() => setArquivadosAbertos(v => !v)}
                        style={{
                            width: '100%', background: 'none', border: 'none',
                            display: 'flex', alignItems: 'center', gap: 10,
                            cursor: 'pointer', padding: '4px 0 12px',
                        }}
                    >
                        <span style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontSize: '0.6rem', fontWeight: 700,
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            color: 'var(--h-text-dim)',
                        }}>
                            Arquivadas ({arquivados.length})
                        </span>
                        <span style={{ flex: 1, height: 1, background: 'var(--h-border)' }} />
                        <svg
                            width="12" height="12" viewBox="0 0 24 24" fill="none"
                            stroke="var(--h-text-dim)" strokeWidth="2.5" strokeLinecap="round"
                            style={{ transition: 'transform 0.2s', transform: arquivadosAbertos ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                        >
                            <path d="M6 9l6 6 6-6"/>
                        </svg>
                    </button>

                    {arquivadosAbertos && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {arquivados.map(c => (
                                <ChatCard key={c.chat_id} chat={c} onClick={() => navigate(`/chat/${c.chat_id}`)} />
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}

export default ChatsList;
