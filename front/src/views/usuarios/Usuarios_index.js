import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import useSocketRefresh from '../../hooks/useSocketRefresh';
import '../../styles/home.css';
import '../../styles/AlunosIndex.css';
import '../../styles/Vinculos.css';

const API = process.env.REACT_APP_API_BASE_URL;

function AvatarPlaceholder({ size = 48 }) {
    return (
        <div style={{ color: 'var(--h-text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
        </div>
    );
}

const Usuarios_index = () => {
    const { userId } = useContext(AuthContext);
    const navigate = useNavigate();

    const [aba,             setAba]             = useState('meus');   // 'meus' | 'disponiveis' | 'pendentes'
    const [procurando,      setProcurando]      = useState(false);
    const [meusAlunos,      setMeusAlunos]      = useState([]);
    const [alunosDisp,      setAlunosDisp]      = useState([]);
    const [pendentes,       setPendentes]       = useState([]);
    const [pedidosEnviados, setPedidosEnviados] = useState(new Set());
    const [searchTerm,      setSearchTerm]      = useState('');
    const [loading,         setLoading]         = useState(true);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const [userRes, meusRes, dispRes, pendRes] = await Promise.all([
                fetch(`${API}/usuarios/${userId}`),
                fetch(`${API}/vinculos/meus-alunos/${userId}`),
                fetch(`${API}/vinculos/alunos-disponiveis`),
                fetch(`${API}/vinculos/pendentes/${userId}`),
            ]);

            const [userData, meusData, dispData, pendData] = await Promise.all([
                userRes.json(), meusRes.json(), dispRes.json(), pendRes.json(),
            ]);

            setProcurando(userData.procurando || false);
            setMeusAlunos(meusData);
            setAlunosDisp(dispData);
            setPendentes(pendData);

            // Inclui todos os pedidos pendentes (meus ou deles)
            const enviados = new Set(pendData.map(p => p.aluno_id));
            setPedidosEnviados(enviados);
        } catch (err) {
            console.error('Erro ao carregar dados:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { carregar(); }, [carregar]);
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

    const enviarPedido = async (alunoId) => {
        try {
            const res = await fetch(`${API}/vinculos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ professor_id: userId, aluno_id: alunoId, iniciado_por: userId }),
            });
            if (res.ok) setPedidosEnviados(prev => new Set([...prev, alunoId]));
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
            if (res.ok) carregar();
        } catch (err) {
            console.error('Erro ao encerrar vínculo:', err);
        }
    };

    const pendentesRecebidos = pendentes.filter(p => p.iniciado_por !== userId);

    const meusAlunosFiltrados = meusAlunos.filter(a =>
        a.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="home-wrapper">

            {/* ── HEADER ── */}
            <div className="h-greeting">
                <p className="h-greeting-date">Olympus</p>
                <h1 className="h-greeting-title">Alunos</h1>
                <p className="h-greeting-sub">
                    {loading ? 'Carregando...' : `${meusAlunos.length} aluno${meusAlunos.length !== 1 ? 's' : ''} vinculado${meusAlunos.length !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* ── TOGGLE PROCURANDO ── */}
            <div className={`vk-toggle-bar${procurando ? ' active' : ''}`}>
                <div className="vk-toggle-info">
                    <p className="vk-toggle-title">Estou procurando alunos</p>
                    <p className="vk-toggle-sub">
                        {procurando ? 'Você aparece para alunos disponíveis' : 'Ative para aparecer na busca de alunos'}
                    </p>
                </div>
                <label className="vk-switch">
                    <input type="checkbox" checked={procurando} onChange={toggleProcurando} />
                    <span className="vk-switch-track" />
                </label>
            </div>

            {/* ── TABS ── */}
            <div className="vk-tabs">
                <button
                    className={`vk-tab${aba === 'meus' ? ' active' : ''}`}
                    onClick={() => setAba('meus')}
                >
                    Meus Alunos
                    {meusAlunos.length > 0 && <span className="vk-tab-badge">{meusAlunos.length}</span>}
                </button>
                <button
                    className={`vk-tab${aba === 'disponiveis' ? ' active' : ''}`}
                    onClick={() => setAba('disponiveis')}
                >
                    Disponíveis
                    {alunosDisp.length > 0 && <span className="vk-tab-badge">{alunosDisp.length}</span>}
                </button>
                <button
                    className={`vk-tab${aba === 'pendentes' ? ' active' : ''}`}
                    onClick={() => setAba('pendentes')}
                >
                    Pedidos
                    {pendentesRecebidos.length > 0 && <span className="vk-tab-badge">{pendentesRecebidos.length}</span>}
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

            {/* ── ABA: MEUS ALUNOS ── */}
            {!loading && aba === 'meus' && (
                <>
                    {meusAlunos.length > 0 && (
                        <div className="al-search-wrap">
                            <span className="al-search-icon">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                </svg>
                            </span>
                            <input
                                type="text"
                                className="al-search-input"
                                placeholder="Buscar aluno..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="vk-list">
                        {meusAlunosFiltrados.length === 0 ? (
                            <div className="vk-empty">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                {searchTerm ? 'Nenhum aluno encontrado.' : 'Você ainda não tem alunos vinculados.'}
                            </div>
                        ) : meusAlunosFiltrados.map(aluno => (
                            <div key={aluno.id} className="al-card">
                                <div className="al-avatar">
                                    {aluno.avatar
                                        ? <img src={aluno.avatar} alt={aluno.nome} />
                                        : <div className="al-avatar-placeholder"><AvatarPlaceholder size={48} /></div>}
                                </div>
                                <div className="al-info">
                                    <p className="al-name">{aluno.nome}</p>
                                    <p className="al-meta">
                                        {aluno.objetivo && <span>{aluno.objetivo}</span>}
                                        {aluno.objetivo && aluno.idade && <span className="al-meta-dot" />}
                                        {aluno.idade && <span>{aluno.idade} anos</span>}
                                    </p>
                                </div>
                                <div className="al-actions">
                                    {aluno.chat_id && (
                                        <button
                                            className="al-btn-ghost"
                                            title="Mensagem"
                                            onClick={() => navigate(`/chat/${aluno.chat_id}`)}
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                            </svg>
                                        </button>
                                    )}
                                    <Link to={`/usuarios/view/${aluno.id}`} className="al-btn-ghost" title="Ver perfil">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </Link>
                                    <Link to={`/usuarios/${aluno.id}/treinos`} className="al-btn-primary" title="Criar treino">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                    </Link>
                                    <button
                                        className="al-btn-ghost"
                                        title="Encerrar vínculo"
                                        style={{ color: 'rgba(232,64,64,0.6)' }}
                                        onClick={() => encerrarVinculo(aluno.vinculo_id)}
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ── ABA: ALUNOS DISPONÍVEIS ── */}
            {!loading && aba === 'disponiveis' && (
                <div className="vk-list">
                    {alunosDisp.length === 0 ? (
                        <div className="vk-empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            Nenhum aluno procurando professor no momento.
                        </div>
                    ) : alunosDisp.map(aluno => (
                        <div key={aluno.id} className="vk-aluno-card">
                            <div className="al-avatar">
                                {aluno.avatar
                                    ? <img src={aluno.avatar} alt={aluno.nome} />
                                    : <div className="al-avatar-placeholder"><AvatarPlaceholder size={48} /></div>}
                            </div>
                            <div className="al-info">
                                <p className="al-name">{aluno.nome}</p>
                                <p className="al-meta">
                                    {aluno.objetivo && <span>{aluno.objetivo}</span>}
                                    {aluno.objetivo && aluno.idade && <span className="al-meta-dot" />}
                                    {aluno.idade && <span>{aluno.idade} anos</span>}
                                    {aluno.peso && <><span className="al-meta-dot" /><span>{aluno.peso} kg</span></>}
                                </p>
                            </div>
                            {meusAlunos.some(a => a.id === aluno.id) ? (
                                <button className="vk-btn-pending" disabled>Já vinculado</button>
                            ) : pedidosEnviados.has(aluno.id) ? (
                                <button className="vk-btn-pending" disabled>
                                    {pendentes.find(p => p.aluno_id === aluno.id && p.iniciado_por === userId) ? 'Enviado' : 'Pedido recebido'}
                                </button>
                            ) : (
                                <button className="vk-btn-connect" onClick={() => enviarPedido(aluno.id)}>
                                    Conectar
                                </button>
                            )}
                        </div>
                    ))}
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
                                <div className="al-avatar">
                                    {p.aluno_avatar
                                        ? <img src={p.aluno_avatar} alt={p.aluno_nome} />
                                        : <div className="al-avatar-placeholder"><AvatarPlaceholder size={48} /></div>}
                                </div>
                                <div className="al-info">
                                    <p className="al-name">{p.aluno_nome}</p>
                                    <p className="al-meta">Pedido de conexão</p>
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

        </div>
    );
};

export default Usuarios_index;
