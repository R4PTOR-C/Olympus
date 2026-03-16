import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import HerculesSidebar from './HerculesSidebar';
import '../../styles/HerculesChat.css';

const API = process.env.REACT_APP_API_BASE_URL;

// ── Renderizador de markdown simples ─────────────────────────────────────────
function BubbleText({ texto }) {
    if (!texto) return null;
    const lines = texto.split('\n');
    const result = [];
    let listItems = [];
    let key = 0;

    const inlineStyles = (text) => {
        const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('_') && part.endsWith('_')) return <em key={i}>{part.slice(1, -1)}</em>;
            return part;
        });
    };

    const flushList = () => {
        if (listItems.length > 0) {
            result.push(<ul key={key++} className="hc-md-list">{listItems}</ul>);
            listItems = [];
        }
    };

    for (const line of lines) {
        if (line.startsWith('### ')) {
            flushList();
            result.push(<h5 key={key++} className="hc-md-h3">{inlineStyles(line.slice(4))}</h5>);
        } else if (line.startsWith('## ')) {
            flushList();
            result.push(<h4 key={key++} className="hc-md-h2">{inlineStyles(line.slice(3))}</h4>);
        } else if (line.startsWith('# ')) {
            flushList();
            result.push(<h3 key={key++} className="hc-md-h1">{inlineStyles(line.slice(2))}</h3>);
        } else if (line.match(/^[-*] /)) {
            listItems.push(<li key={key++}>{inlineStyles(line.slice(2))}</li>);
        } else if (line === '---') {
            flushList();
            result.push(<hr key={key++} className="hc-md-hr" />);
        } else if (line.trim() === '') {
            flushList();
        } else {
            flushList();
            result.push(<p key={key++} className="hc-md-p">{inlineStyles(line)}</p>);
        }
    }
    flushList();
    return <>{result}</>;
}

const LOADING_MSGS = [
    'Consultando os deuses do Olimpo...',
    'Pesando cada exercício com cuidado...',
    'Calculando o quanto você vai sofrer amanhã...',
    'Verificando se você aguentaria mais uma série...',
    'Lembrando você que perna não é opcional...',
    'Perguntando pro Zeus o que ele acha...',
    'Organizando sua dor de um jeito eficiente...',
    'Revisando se você vai malhar no dia de perna...',
    'Garantindo que você vai andar torto amanhã...',
    'Montando o treino dos sonhos (ou pesadelos)...',
    'Separando o joio do treino...',
    'Analisando seus músculos com a bola de cristal...',
    'Certificando que vai doer (do jeito certo)...',
    'Checando se o Aquiles fez algo parecido...',
    'Invocando a sabedoria ancestral da hipertrofia...',
    'Descobrindo até onde vai sua coragem...',
    'Ajustando seu treino para máxima glória...',
    'Definindo quantas repetições separam você do shape...',
    'Traduzindo sua vontade em séries e repetições...',
    'Calculando a dose exata de caos muscular...',
    'Preparando um treino digno de semideus...',
    'Decidindo entre evolução e arrependimento...',
    'Lapidando seu sofrimento com precisão olímpica...',
    'Buscando equilíbrio entre força, volume e desespero...',
    'Forjando um treino no fogo da progressão...',
    'Testando se seu descanso foi suficiente mesmo...',
    'Estimando o pump potencial da sessão...',
    'Escolhendo exercícios que respeitam sua dignidade...',
    'Removendo exercícios suspeitos do plano...',
    'Planejando sua próxima crise existencial na academia...',
    'Convertendo disciplina em resultado...',
    'Otimizando seu caminho até o shape...',
    'Analisando se isso é treino ou punição divina...',
    'Consultando Hércules sobre sua próxima batalha...',
    'Verificando se seu posterior vai te perdoar...',
    'Medindo o impacto emocional do leg day...',
    'Calculando a chance de você xingar no final...',
    'Montando uma sequência que até Esparta aprovaria...',
    'Avaliando se cabe mais uma intensidadezinha...',
    'Preparando uma sessão abençoada pela hipertrofia...',
    'Combinando volume, técnica e um pouco de maldade...',
    'Organizando sua evolução sem misericórdia...',
    'Anotando mentalmente seu futuro cansaço...',
    'Vendo se esse treino merece ser chamado de treino...',
    'Ajustando o plano para gerar progresso, não desculpas...',
    'Filtrando o que é útil do que é só firula...',
    'Sincronizando foco, força e sofrimento...',
    'Calculando o delay da dor muscular tardia...',
    'Estudando como te deixar maior sem te quebrar...',
    'Buscando a rota mais curta até o shape impossível...',
    'Preparando o ritual da progressão de carga...',
    'Confirmando que o básico bem feito ainda funciona...',
    'Estimando o nível de respeito que esse treino impõe...',
    'Analisando se o cárdio vai entrar ou ser ignorado...',
    'Checando quantos litros de suor isso vai custar...',
    'Escrevendo sua próxima lenda na academia...',
    'Convertendo esforço em estética...',
    'Reunindo argumentos contra pular o treino...',
    'Ajustando o treino para ficar bruto e inteligente...',
    'Meditando profundamente sobre sua próxima série...',
    'Definindo o limite entre dedicação e loucura...'
];

function HerculesChat() {
    const [msg, setMsg] = useState('');
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0]);
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

    // cicla as mensagens de loading
    useEffect(() => {
        if (!loading) return;
        let idx = 0;
        setLoadingMsg(LOADING_MSGS[0]);
        const interval = setInterval(() => {
            idx = (idx + 1) % LOADING_MSGS.length;
            setLoadingMsg(LOADING_MSGS[idx]);
        }, 2600);
        return () => clearInterval(interval);
    }, [loading]);

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
                    conversaId: idConversa,
                    ...ultimaMeta,
                    ...extra,
                }),
            });

            const data = await res.json();
            setUltimaMeta(data);
            setChat(prev => [...prev, { autor: 'Hércules', texto: data.texto, meta: data }]);
            salvarMensagem('hercules', data.texto, data, idConversa);
        } catch {
            const textoErro = '⚠️ Erro ao falar com Hércules. Tente novamente.';
            setChat(prev => [...prev, { autor: 'Hércules', texto: textoErro }]);
            salvarMensagem('hercules', textoErro, null, idConversa);
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
                            {c.autor === 'Você' ? c.texto : <BubbleText texto={c.texto} />}
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
                        <div className="hc-bubble hc-bubble-loading">
                            <div className="hc-loading-dots">
                                <span /><span /><span />
                            </div>
                            <span className="hc-loading-msg">{loadingMsg}</span>
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
