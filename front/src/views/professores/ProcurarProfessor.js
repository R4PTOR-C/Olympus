import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import '../../styles/home.css';
import '../../styles/AlunosIndex.css';
import '../../styles/Vinculos.css';
import PullToRefresh from '../components/PullToRefresh';
import useSocketRefresh from '../../hooks/useSocketRefresh';

const API = process.env.REACT_APP_API_BASE_URL;

const formatarDataExibicao = (iso) => {
    if (!iso) return null;
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
};

function AvatarPlaceholder({ size = 52 }) {
    return (
        <div style={{ color: 'var(--h-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
        </div>
    );
}

export default function ProcurarProfessor() {
    const { userId, clearMensagensNaoLidas } = useContext(AuthContext);
    const navigate = useNavigate();

    const [aba,            setAba]            = useState('disponiveis'); // 'disponiveis' | 'pendentes' | 'historico'
    const [procurando,     setProcurando]     = useState(false);
    const [meuProfessor,   setMeuProfessor]   = useState(null);
    const [professores,    setProfessores]    = useState([]);
    const [pendentes,      setPendentes]      = useState([]);
    const [historico,      setHistorico]      = useState([]);
    const [pedidosEnviados,setPedidosEnviados]= useState(new Set()); // IDs de professores com pedido enviado
    const [loading,        setLoading]        = useState(true);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const [userRes, profRes, pendRes, vinculoRes, histRes] = await Promise.all([
                fetch(`${API}/usuarios/${userId}`),
                fetch(`${API}/vinculos/professores-disponiveis`),
                fetch(`${API}/vinculos/pendentes/${userId}`),
                fetch(`${API}/vinculos/meu-professor/${userId}`),
                fetch(`${API}/vinculos/historico-professor/${userId}`),
            ]);

            const [userData, profsData, pendData, vinculoData, histData] = await Promise.all([
                userRes.json(), profRes.json(), pendRes.json(), vinculoRes.json(), histRes.json(),
            ]);

            setProcurando(userData.procurando || false);
            setProfessores(profsData.filter(p => p.id !== Number(userId)));
            setPendentes(pendData);
            setMeuProfessor(vinculoData);
            setHistorico(histData);

            // Marca professores com qualquer pedido pendente (meu ou deles)
            const enviados = new Set(pendData.map(p => p.professor_id));
            setPedidosEnviados(enviados);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { carregar(); clearMensagensNaoLidas(); }, [carregar]);
    useSocketRefresh(carregar);

    const toggleProcurando = async () => {
        const novoValor = !procurando;
        setProcurando(novoValor);
        try {
            const res = await fetch(`${API}/vinculos/procurando/${userId}`, { method: 'PATCH' });
            const data = await res.json();
            setProcurando(data.procurando);
        } catch (err) {
            console.error('Erro ao atualizar procurando:', err);
            setProcurando(!novoValor); // reverte em caso de erro
        }
    };

    const enviarPedido = async (professorId) => {
        try {
            const res = await fetch(`${API}/vinculos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professor_id: professorId, aluno_id: userId, iniciado_por: userId }),
            });
            if (res.ok) {
                setPedidosEnviados(prev => new Set([...prev, professorId]));
            }
        } catch (err) {
            console.error('Erro ao enviar pedido:', err);
        }
    };

    const aceitarPedido = async (vinculoId) => {
        try {
            const res = await fetch(`${API}/vinculos/${vinculoId}/aceitar`, { method: 'PATCH' });
            if (res.ok) carregar();
        } catch (err) {
            console.error('Erro ao aceitar pedido:', err);
        }
    };

    const recusarPedido = async (vinculoId) => {
        try {
            const res = await fetch(`${API}/vinculos/${vinculoId}/recusar`, { method: 'PATCH' });
            if (res.ok) setPendentes(prev => prev.filter(p => p.id !== vinculoId));
        } catch (err) {
            console.error('Erro ao recusar pedido:', err);
        }
    };

    const encerrarVinculo = async (vinculoId) => {
        try {
            const res = await fetch(`${API}/vinculos/${vinculoId}`, { method: 'DELETE' });
            if (res.ok) { setMeuProfessor(null); setProcurando(false); }
        } catch (err) {
            console.error('Erro ao encerrar vínculo:', err);
        }
    };

    const pendentesRecebidos = pendentes.filter(p => p.iniciado_por !== userId);

    return (
        <div className="home-wrapper">
            <PullToRefresh onRefresh={carregar} />

            {/* ── HEADER ── */}
            <div className="h-greeting">
                <p className="h-greeting-date">Olympus</p>
                <h1 className="h-greeting-title">Professores</h1>
                <p className="h-greeting-sub">
                    {meuProfessor ? 'Você tem um professor ativo' : 'Encontre seu personal trainer'}
                </p>
            </div>

            {/* ── MEU PROFESSOR ATIVO ── */}
            {meuProfessor && (
                <div className="vk-active-card">
                    <div className="vk-active-hero">
                        <div className="vk-active-avatar">
                            {meuProfessor.avatar
                                ? <img src={meuProfessor.avatar} alt={meuProfessor.nome} />
                                : <AvatarPlaceholder size={64} />}
                        </div>
                        <div className="vk-active-info">
                            <p className="vk-active-label">Meu Professor</p>
                            <p className="vk-active-name">{meuProfessor.nome}</p>
                            <div className="vk-prof-tags">
                                {meuProfessor.especialidade && <span className="vk-tag">{meuProfessor.especialidade}</span>}
                                {meuProfessor.cidade && <span className="vk-tag neutral">{meuProfessor.cidade} – {meuProfessor.estado}</span>}
                            </div>
                        </div>
                    </div>
                    <div className="vk-active-footer">
                        {meuProfessor.chat_id && (
                            <button
                                className="vk-btn-connect"
                                style={{ marginRight: 8 }}
                                onClick={() => navigate(`/chat/${meuProfessor.chat_id}`)}
                            >
                                Mensagem
                            </button>
                        )}
                        <button className="vk-btn-disconnect" onClick={() => encerrarVinculo(meuProfessor.vinculo_id)}>
                            Encerrar vínculo
                        </button>
                    </div>
                </div>
            )}

            {/* ── TOGGLE PROCURANDO (só se não tiver professor) ── */}
            {!meuProfessor && (
                <div className={`vk-toggle-bar${procurando ? ' active' : ''}`}>
                    <div className="vk-toggle-info">
                        <p className="vk-toggle-title">Estou procurando professor</p>
                        <p className="vk-toggle-sub">
                            {procurando ? 'Você aparece para professores disponíveis' : 'Ative para aparecer na busca de professores'}
                        </p>
                    </div>
                    <label className="vk-switch">
                        <input type="checkbox" checked={procurando} onChange={toggleProcurando} />
                        <span className="vk-switch-track" />
                    </label>
                </div>
            )}

            {/* ── TABS ── */}
            {(
                <>
                    <div className="vk-tabs">
                        <button
                            className={`vk-tab${aba === 'disponiveis' ? ' active' : ''}`}
                            onClick={() => setAba('disponiveis')}
                        >
                            Disponíveis
                            {professores.length > 0 && (
                                <span className="vk-tab-badge">{professores.length}</span>
                            )}
                        </button>
                        <button
                            className={`vk-tab${aba === 'pendentes' ? ' active' : ''}`}
                            onClick={() => setAba('pendentes')}
                        >
                            Pedidos
                            {pendentesRecebidos.length > 0 && (
                                <span className="vk-tab-badge">{pendentesRecebidos.length}</span>
                            )}
                        </button>
                        <button
                            className={`vk-tab${aba === 'historico' ? ' active' : ''}`}
                            onClick={() => setAba('historico')}
                        >
                            Histórico
                            {historico.length > 0 && (
                                <span className="vk-tab-badge neutral">{historico.length}</span>
                            )}
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
                                        <div className="vk-skel-line xshort" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── ABA: PROFESSORES DISPONÍVEIS ── */}
                    {!loading && aba === 'disponiveis' && (
                        <div className="vk-list">
                            {professores.length === 0 ? (
                                <div className="vk-empty">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    Nenhum professor disponível no momento.
                                </div>
                            ) : professores.map(prof => (
                                <div key={prof.id} className="vk-prof-card">
                                    <div className="vk-prof-hero">
                                        <div className="vk-prof-avatar">
                                            {prof.avatar
                                                ? <img src={prof.avatar} alt={prof.nome} />
                                                : <AvatarPlaceholder size={58} />}
                                        </div>
                                        <div className="vk-prof-info">
                                            <p className="vk-prof-name">{prof.nome}</p>
                                            <div className="vk-prof-tags">
                                                {prof.especialidade && <span className="vk-tag">{prof.especialidade}</span>}
                                                {prof.cref && <span className="vk-tag neutral">CREF {prof.cref}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="vk-prof-body">
                                        <div className="vk-prof-meta">
                                            {prof.cidade && <span>{prof.cidade} – {prof.estado}</span>}
                                            {prof.cidade && prof.experiencia && <span className="vk-meta-sep" />}
                                            {prof.experiencia && <span>{prof.experiencia} anos exp.</span>}
                                            {prof.preco_hora && <><span className="vk-meta-sep" /><span>R$ {prof.preco_hora}/h</span></>}
                                        </div>
                                        {meuProfessor ? (
                                            <button className="vk-btn-pending" disabled>Já vinculado</button>
                                        ) : pedidosEnviados.has(prof.id) ? (
                                            <button className="vk-btn-pending" disabled>
                                                {pendentes.find(p => p.professor_id === prof.id && p.iniciado_por === userId) ? 'Enviado' : 'Pedido recebido'}
                                            </button>
                                        ) : (
                                            <button className="vk-btn-connect" onClick={() => enviarPedido(prof.id)}>
                                                Conectar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── ABA: HISTÓRICO ── */}
                    {!loading && aba === 'historico' && (
                        <div className="vk-list">
                            {historico.length === 0 ? (
                                <div className="vk-empty">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    Nenhum professor anterior.
                                </div>
                            ) : historico.map(h => {
                                const avatarUrl = h.avatar?.startsWith('http') ? h.avatar : h.avatar ? `${API}/${h.avatar}` : null;
                                return (
                                    <div key={h.vinculo_id} className="vk-prof-card">
                                        <div className="vk-prof-hero">
                                            <div className="vk-prof-avatar" style={{ opacity: 0.7 }}>
                                                {avatarUrl
                                                    ? <img src={avatarUrl} alt={h.nome} />
                                                    : <AvatarPlaceholder size={58} />}
                                            </div>
                                            <div className="vk-prof-info">
                                                <p className="vk-prof-name" style={{ color: 'var(--h-text-muted)' }}>{h.nome}</p>
                                                <div className="vk-prof-tags">
                                                    {h.especialidade && <span className="vk-tag neutral">{h.especialidade}</span>}
                                                    {h.cidade && <span className="vk-tag neutral">{h.cidade} – {h.estado}</span>}
                                                </div>
                                                <p style={{ fontSize: '0.65rem', color: 'var(--h-text-dim)', marginTop: 4 }}>
                                                    Vínculo encerrado em {formatarDataExibicao(h.created_at?.split('T')[0])}
                                                </p>
                                            </div>
                                        </div>
                                        {h.chat_id && (
                                            <div className="vk-prof-body">
                                                <div />
                                                <button
                                                    className="vk-btn-connect"
                                                    onClick={() => navigate(`/chat/${h.chat_id}`)}
                                                >
                                                    Ver mensagens
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* ── ABA: PEDIDOS RECEBIDOS ── */}
                    {!loading && aba === 'pendentes' && (
                        <div className="vk-list">
                            {pendentesRecebidos.length === 0 ? (
                                <div className="vk-empty">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                                    </svg>
                                    Nenhum pedido recebido.
                                </div>
                            ) : pendentesRecebidos.map(p => (
                                <div key={p.id} className="vk-request-card">
                                    <div className="vk-request-body">
                                        <div className="vk-prof-avatar">
                                            {p.professor_avatar
                                                ? <img src={p.professor_avatar} alt={p.professor_nome} />
                                                : <AvatarPlaceholder size={52} />}
                                        </div>
                                        <div className="al-info">
                                            <p className="al-name">{p.professor_nome}</p>
                                            <p className="al-meta">
                                                {p.especialidade && <span>{p.especialidade}</span>}
                                                {p.especialidade && p.cref && <span className="al-meta-dot" />}
                                                {p.cref && <span>CREF {p.cref}</span>}
                                            </p>
                                            <p style={{ fontSize: '0.68rem', color: 'var(--h-text-dim)', marginTop: 3 }}>
                                                Pedido em {formatarDataExibicao(p.created_at?.split('T')[0])}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="vk-request-actions">
                                        <button className="vk-btn-accept" onClick={() => aceitarPedido(p.id)}>Aceitar</button>
                                        <button className="vk-btn-reject" onClick={() => recusarPedido(p.id)}>Recusar</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

        </div>
    );
}
