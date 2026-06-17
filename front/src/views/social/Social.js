import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import '../../styles/home.css';
import '../../styles/AlunosIndex.css';
import '../../styles/Vinculos.css';
import PullToRefresh from '../components/PullToRefresh';
import useSocketRefresh from '../../hooks/useSocketRefresh';
import BadgeNivel from '../components/BadgeNivel';
import '../../styles/Social.css';

const medalha = (pos) => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`);

const API = process.env.REACT_APP_API_BASE_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

function AvatarPlaceholder({ size = 52 }) {
    return (
        <div style={{ color: 'var(--h-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
        </div>
    );
}

const ig = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
        padding: '4px 4px 8px',
    },
    card: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 10px',
        background: 'var(--h-bg)',
        border: '1px solid var(--h-border)',
        borderRadius: 14,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--h-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
    nome: {
        fontSize: 13,
        fontWeight: 600,
        color: 'var(--h-text)',
        textAlign: 'center',
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    btn: {
        width: '100%',
        padding: '7px 10px',
        borderRadius: 8,
        border: 'none',
        background: 'var(--h-accent)',
        color: '#fff',
        fontSize: 12.5,
        fontWeight: 700,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    btnSent: {
        background: 'var(--h-surface)',
        color: 'var(--h-text-muted)',
        border: '1px solid var(--h-border)',
        cursor: 'default',
    },
};

export default function Social() {
    const { userId, clearMensagensNaoLidas } = useContext(AuthContext);
    const navigate = useNavigate();

    const [aba,            setAba]            = useState('amigos'); // 'amigos' | 'adicionar' | 'pendentes'
    const [amigos,         setAmigos]         = useState([]);
    const [pendentes,      setPendentes]      = useState([]);
    const [busca,          setBusca]          = useState('');
    const [resultados,     setResultados]     = useState([]);
    const [buscando,       setBuscando]       = useState(false);
    const [sugestoes,      setSugestoes]      = useState([]);
    const [pedidosEnviados,setPedidosEnviados] = useState(new Set());
    const [ranking,        setRanking]        = useState([]);
    const [minhaPosicao,   setMinhaPosicao]   = useState(null);
    const [meuXp,          setMeuXp]          = useState(0);
    const [loading,        setLoading]        = useState(true);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const headers = authHeader();
            const [amigosRes, pendRes, sugRes, rankRes] = await Promise.all([
                fetch(`${API}/amizades/${userId}`,            { headers }),
                fetch(`${API}/amizades/pendentes/${userId}`,  { headers }),
                fetch(`${API}/amizades/sugestoes`,            { headers }),
                fetch(`${API}/gamificacao/ranking`,           { headers }),
            ]);
            const amigosData = await amigosRes.json();
            const pendData   = await pendRes.json();
            const sugData    = await sugRes.json();
            const rankData   = await rankRes.json();
            setAmigos(Array.isArray(amigosData) ? amigosData : []);
            setPendentes(Array.isArray(pendData) ? pendData : []);
            setSugestoes(Array.isArray(sugData) ? sugData : []);
            setRanking(Array.isArray(rankData?.ranking) ? rankData.ranking : []);
            setMinhaPosicao(rankData?.minhaPosicao || null);
            setMeuXp(rankData?.meuXp || 0);
        } catch (err) {
            console.error('Erro ao carregar social:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { carregar(); clearMensagensNaoLidas(); }, [carregar]);
    useSocketRefresh(carregar);

    // Busca de usuários (debounce)
    useEffect(() => {
        if (busca.trim().length < 2) { setResultados([]); return; }
        const t = setTimeout(async () => {
            setBuscando(true);
            try {
                const res = await fetch(`${API}/amizades/buscar?q=${encodeURIComponent(busca.trim())}`, { headers: authHeader() });
                const data = await res.json();
                setResultados(Array.isArray(data) ? data : []);
            } catch {
                setResultados([]);
            } finally {
                setBuscando(false);
            }
        }, 350);
        return () => clearTimeout(t);
    }, [busca]);

    const enviarPedido = async (destinatarioId) => {
        try {
            const res = await fetch(`${API}/amizades`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ destinatario_id: destinatarioId }),
            });
            if (res.ok) setPedidosEnviados(prev => new Set([...prev, destinatarioId]));
        } catch (err) {
            console.error('Erro ao enviar pedido:', err);
        }
    };

    const aceitar = async (id) => {
        try {
            const res = await fetch(`${API}/amizades/${id}/aceitar`, { method: 'PATCH', headers: authHeader() });
            if (res.ok) carregar();
        } catch (err) {
            console.error('Erro ao aceitar pedido:', err);
        }
    };

    const recusar = async (id) => {
        try {
            const res = await fetch(`${API}/amizades/${id}/recusar`, { method: 'PATCH', headers: authHeader() });
            if (res.ok) setPendentes(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error('Erro ao recusar pedido:', err);
        }
    };

    const removerAmigo = async (amizadeId) => {
        try {
            const res = await fetch(`${API}/amizades/${amizadeId}`, { method: 'DELETE', headers: authHeader() });
            if (res.ok) setAmigos(prev => prev.filter(a => a.amizade_id !== amizadeId));
        } catch (err) {
            console.error('Erro ao remover amigo:', err);
        }
    };

    // Grade de cards estilo "descobrir pessoas"
    const cardUsuario = (u) => (
        <div key={u.id} style={ig.card}>
            <div style={ig.avatar}>
                {u.avatar ? <img src={u.avatar} alt={u.nome} style={ig.avatarImg} /> : <AvatarPlaceholder size={64} />}
            </div>
            <div style={ig.nome} title={u.nome}>{u.nome}</div>
            <BadgeNivel nivel={u.nivel} variant="compact" />
            {pedidosEnviados.has(u.id) ? (
                <button style={{ ...ig.btn, ...ig.btnSent }} disabled>Enviado</button>
            ) : (
                <button style={ig.btn} onClick={() => enviarPedido(u.id)}>Adicionar</button>
            )}
        </div>
    );

    const gradeSugestoes = sugestoes.length > 0
        ? <div style={ig.grid}>{sugestoes.map(cardUsuario)}</div>
        : <div className="vk-empty">Nenhuma sugestão de usuário no momento.</div>;

    return (
        <div className="home-wrapper">
            <PullToRefresh onRefresh={carregar} />

            {/* ── HEADER ── */}
            <div className="h-greeting">
                <p className="h-greeting-date">Olympus</p>
                <h1 className="h-greeting-title">Social</h1>
                <p className="h-greeting-sub">Conecte-se e compartilhe treinos com amigos</p>
            </div>

            {/* ── ATALHO PARA PERSONAL TRAINER ── */}
            <div className="vk-active-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/procurar-professor')}>
                <div className="vk-active-hero">
                    <div className="vk-active-avatar">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--h-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <div className="vk-active-info">
                        <p className="vk-active-label">Personal Trainer</p>
                        <p className="vk-active-name">Encontre seu professor</p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto' }}>
                        <path d="M9 18l6-6-6-6"/>
                    </svg>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="vk-tabs">
                <button className={`vk-tab${aba === 'amigos' ? ' active' : ''}`} onClick={() => setAba('amigos')}>
                    Amigos
                    {amigos.length > 0 && <span className="vk-tab-badge">{amigos.length}</span>}
                </button>
                <button className={`vk-tab${aba === 'adicionar' ? ' active' : ''}`} onClick={() => setAba('adicionar')}>
                    Adicionar
                </button>
                <button className={`vk-tab${aba === 'pendentes' ? ' active' : ''}`} onClick={() => setAba('pendentes')}>
                    Pedidos
                    {pendentes.length > 0 && <span className="vk-tab-badge">{pendentes.length}</span>}
                </button>
                <button className={`vk-tab${aba === 'ranking' ? ' active' : ''}`} onClick={() => setAba('ranking')}>
                    Ranking
                </button>
            </div>

            {/* ── LOADING ── */}
            {loading && (
                <div className="vk-list">
                    {[1,2,3].map(i => (
                        <div key={i} className="vk-skeleton">
                            <div className="vk-skel-circle" />
                            <div className="vk-skel-lines">
                                <div className="vk-skel-line" />
                                <div className="vk-skel-line short" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── ABA: AMIGOS ── */}
            {!loading && aba === 'amigos' && (
                <div className="vk-list">
                    {amigos.length === 0 ? (
                        <>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--h-text)', margin: '4px 4px 10px' }}>
                                Adicione seus primeiros amigos
                            </p>
                            {gradeSugestoes}
                        </>
                    ) : amigos.map(amigo => (
                        <div key={amigo.amizade_id} className="vk-request-card">
                            <div
                                className="vk-request-body"
                                style={{ cursor: 'pointer', flex: 1 }}
                                onClick={() => navigate(`/social/amigo/${amigo.id}`, { state: { nome: amigo.nome, avatar: amigo.avatar, nivel: amigo.nivel } })}
                            >
                                <div className="vk-prof-avatar">
                                    {amigo.avatar ? <img src={amigo.avatar} alt={amigo.nome} /> : <AvatarPlaceholder size={52} />}
                                </div>
                                <div className="al-info">
                                    <p className="al-name">{amigo.nome}</p>
                                    <BadgeNivel nivel={amigo.nivel} variant="compact" tamanho={48} />
                                </div>
                            </div>
                            <div className="vk-request-actions">
                                <button className="vk-btn-reject" onClick={() => removerAmigo(amigo.amizade_id)}>Remover</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── ABA: ADICIONAR ── */}
            {!loading && aba === 'adicionar' && (
                <div className="vk-list">
                    <input
                        type="text"
                        className="al-search-input"
                        placeholder="Buscar usuários por nome..."
                        value={busca}
                        onChange={e => setBusca(e.target.value)}
                        style={{ marginBottom: 12 }}
                    />
                    {busca.trim().length < 2 ? (
                        <>
                            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--h-text)', margin: '4px 4px 10px' }}>
                                Sugestões para você
                            </p>
                            {gradeSugestoes}
                        </>
                    ) : buscando ? (
                        <div className="vk-empty">Buscando...</div>
                    ) : resultados.length === 0 ? (
                        <div className="vk-empty">Nenhum usuário encontrado.</div>
                    ) : resultados.map(u => (
                        <div key={u.id} className="vk-request-card">
                            <div className="vk-request-body">
                                <div className="vk-prof-avatar">
                                    {u.avatar ? <img src={u.avatar} alt={u.nome} /> : <AvatarPlaceholder size={52} />}
                                </div>
                                <div className="al-info">
                                    <p className="al-name">{u.nome}</p>
                                    <BadgeNivel nivel={u.nivel} variant="compact" />
                                </div>
                            </div>
                            <div className="vk-request-actions">
                                {pedidosEnviados.has(u.id) ? (
                                    <button className="vk-btn-pending" disabled>Enviado</button>
                                ) : (
                                    <button className="vk-btn-accept" onClick={() => enviarPedido(u.id)}>Adicionar</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── ABA: PEDIDOS RECEBIDOS ── */}
            {!loading && aba === 'pendentes' && (
                <div className="vk-list">
                    {pendentes.length === 0 ? (
                        <div className="vk-empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                            Nenhum pedido recebido.
                        </div>
                    ) : pendentes.map(p => (
                        <div key={p.id} className="vk-request-card">
                            <div className="vk-request-body">
                                <div className="vk-prof-avatar">
                                    {p.solicitante_avatar ? <img src={p.solicitante_avatar} alt={p.solicitante_nome} /> : <AvatarPlaceholder size={52} />}
                                </div>
                                <div className="al-info">
                                    <p className="al-name">{p.solicitante_nome}</p>
                                    <BadgeNivel nivel={p.nivel} variant="compact" />
                                </div>
                            </div>
                            <div className="vk-request-actions">
                                <button className="vk-btn-accept" onClick={() => aceitar(p.id)}>Aceitar</button>
                                <button className="vk-btn-reject" onClick={() => recusar(p.id)}>Recusar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── ABA: RANKING ── */}
            {!loading && aba === 'ranking' && (
                <div className="vk-list">
                    {ranking.length === 0 ? (
                        <div className="vk-empty">Ninguém no ranking ainda. Treine para ganhar XP!</div>
                    ) : (
                        <>
                            {ranking.map(r => (
                                <div key={r.id} className={`at-rank-row${String(r.id) === String(userId) ? ' at-rank-me' : ''}`}>
                                    <div className="at-rank-pos">{medalha(r.posicao)}</div>
                                    <div className="vk-prof-avatar">
                                        {r.avatar ? <img src={r.avatar} alt={r.nome} /> : <AvatarPlaceholder size={52} />}
                                    </div>
                                    <div className="al-info">
                                        <p className="al-name">{r.nome}</p>
                                        <BadgeNivel nivel={r.nivel} variant="compact" />
                                    </div>
                                    <div className="at-rank-xp">{r.xp_total} XP</div>
                                </div>
                            ))}
                            {minhaPosicao && !ranking.some(r => String(r.id) === String(userId)) && (
                                <div className="at-rank-row at-rank-me">
                                    <div className="at-rank-pos">#{minhaPosicao}</div>
                                    <div className="vk-prof-avatar"><AvatarPlaceholder size={52} /></div>
                                    <div className="al-info"><p className="al-name">Você</p></div>
                                    <div className="at-rank-xp">{meuXp} XP</div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
