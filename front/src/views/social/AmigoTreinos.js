import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import '../../styles/UsuariosView.css';
import '../../styles/TreinosForm.css';
import '../../styles/Social.css';
import PullToRefresh from '../components/PullToRefresh';
import BadgeNivel from '../components/BadgeNivel';

const API = process.env.REACT_APP_API_BASE_URL;
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });
const isVideo = (url) => /\.(mp4|mov|webm)(\?|$)/i.test(url || '') || (url || '').includes('/video/');
const treinoImagemUrl = (imagem) => `${API}/uploads/${imagem}`;

const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const mapDiasBack = {
    'Segunda': 'Segunda-feira', 'Terça': 'Terça-feira', 'Quarta': 'Quarta-feira',
    'Quinta': 'Quinta-feira', 'Sexta': 'Sexta-feira', 'Sábado': 'Sábado', 'Domingo': 'Domingo',
};
const mapDias = Object.fromEntries(Object.entries(mapDiasBack).map(([curto, longo]) => [longo, curto]));
const DIAS_FULL = diasSemana.map(d => mapDiasBack[d]);
const diaDeHojeFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][new Date().getDay()];

export default function AmigoTreinos() {
    const { amigoId } = useParams();
    const { state }   = useLocation();
    const { userId }  = useContext(AuthContext);

    const nomeAmigo   = state?.nome || 'Amigo';
    const avatarAmigo = state?.avatar || null;
    const nivelAmigo  = state?.nivel || 1;

    const [treinos,      setTreinos]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [diasOcupados, setDiasOcupados] = useState([]);
    const [expandido,    setExpandido]    = useState(null);   // treinoId aberto
    const [exsPorTreino, setExsPorTreino] = useState({});     // { treinoId: [...] }
    const [loadingExId,  setLoadingExId]  = useState(null);
    const [copiarAlvo,   setCopiarAlvo]   = useState(null);   // treino a copiar (modal)
    const [copiando,     setCopiando]     = useState(false);
    const [toast,        setToast]        = useState(null);

    const carregar = useCallback(async () => {
        setLoading(true);
        try {
            const headers = authHeader();
            const [amigoRes, meusRes] = await Promise.all([
                fetch(`${API}/amizades/${amigoId}/treinos`, { headers }),
                fetch(`${API}/amizades/${userId}/treinos`,  { headers }),
            ]);
            const amigoData = await amigoRes.json();
            const meusData  = await meusRes.json();
            setTreinos(Array.isArray(amigoData) ? amigoData : []);
            setDiasOcupados(Array.isArray(meusData) ? meusData.map(t => t.dia_semana) : []);
        } catch (err) {
            console.error('Erro ao carregar treinos do amigo:', err);
        } finally {
            setLoading(false);
        }
    }, [amigoId, userId]);

    useEffect(() => { carregar(); }, [carregar]);

    const toggleExpandir = async (treinoId) => {
        if (expandido === treinoId) { setExpandido(null); return; }
        setExpandido(treinoId);
        if (!exsPorTreino[treinoId]) {
            setLoadingExId(treinoId);
            try {
                const res = await fetch(`${API}/treinos/treinos/${treinoId}/exercicios`, { headers: authHeader() });
                const data = await res.json();
                setExsPorTreino(prev => ({ ...prev, [treinoId]: Array.isArray(data) ? data : [] }));
            } catch {
                setExsPorTreino(prev => ({ ...prev, [treinoId]: [] }));
            } finally {
                setLoadingExId(null);
            }
        }
    };

    const confirmarCopia = async (dia) => {
        if (!copiarAlvo) return;
        setCopiando(true);
        try {
            const res = await fetch(`${API}/treinos/treinos/${copiarAlvo.id}/copiar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ dia_semana: dia }),
            });
            if (res.ok) {
                setDiasOcupados(prev => [...prev, dia]);
                setCopiarAlvo(null);
                setToast('Treino copiado para os seus treinos!');
            } else {
                setToast('Não foi possível copiar o treino.');
            }
        } catch {
            setToast('Erro de conexão.');
        } finally {
            setCopiando(false);
            setTimeout(() => setToast(null), 2200);
        }
    };

    const renderDropdown = (treinoId) => {
        if (loadingExId === treinoId && !exsPorTreino[treinoId]) {
            return <div className="at-ex-msg">Carregando exercícios...</div>;
        }
        const exs = exsPorTreino[treinoId] || [];
        if (exs.length === 0) return <div className="at-ex-msg">Sem exercícios neste treino.</div>;
        return (
            <div className="at-ex-dropdown">
                {exs.map(ex => (
                    <div key={ex.exercicio_id} className="tf-ex-card" style={{ cursor: 'default' }}>
                        <div className="tf-ex-gif">
                            {ex.gif_url && (
                                isVideo(ex.gif_url)
                                    ? <video src={ex.gif_url} autoPlay loop muted playsInline />
                                    : <img src={ex.gif_url} alt={ex.nome_exercicio} />
                            )}
                        </div>
                        <p className="tf-ex-name">{ex.nome_exercicio}</p>
                        <span className="at-ex-sets">{(ex.series_alvo || '–')} × {(ex.reps_alvo || '–')}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="uv-page">
            <PullToRefresh onRefresh={carregar} />

            {/* ── HEADER ── */}
            <div className="uv-header">
                {avatarAmigo ? (
                    <img src={avatarAmigo} alt={nomeAmigo} className="uv-avatar" />
                ) : (
                    <div className="uv-avatar-placeholder">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                )}
                <h1 className="uv-user-name">{nomeAmigo}</h1>
                <div style={{ marginTop: 12 }}><BadgeNivel nivel={nivelAmigo} variant="full" expansivel /></div>
            </div>

            {/* ── BOARD (somente leitura, exercícios em dropdown) ── */}
            {loading ? (
                <div className="uv-board">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="uv-skel-day" style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="uv-skel-day-header"><div className="uv-skel-line" style={{ width: 90 }} /></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="uv-board">
                    {diasSemana.map(dia => {
                        const treinosDoDia = treinos.filter(t => mapDias[t.dia_semana] === dia);
                        const diaCompleto  = mapDiasBack[dia];
                        return (
                            <div className={`uv-day-block${diaCompleto === diaDeHojeFull ? ' uv-today' : ''}`} key={dia}>
                                <div className="uv-day-header">
                                    <span className="uv-day-name">{diaCompleto}</span>
                                    {treinosDoDia.length > 0 && (
                                        <span className="uv-day-badge">{treinosDoDia[0].grupo_muscular || 'Treino'}</span>
                                    )}
                                </div>

                                <div className="uv-droppable">
                                    {treinosDoDia.length > 0 ? (
                                        treinosDoDia.map(t => {
                                            const aberto = expandido === t.id;
                                            return (
                                                <React.Fragment key={t.id}>
                                                    <div
                                                        className="uv-workout-card"
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => toggleExpandir(t.id)}
                                                    >
                                                        <div className="uv-thumb">
                                                            {t.imagem ? (
                                                                <img src={treinoImagemUrl(t.imagem)} alt={t.nome_treino} />
                                                            ) : (
                                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="uv-workout-info">
                                                            <p className="uv-workout-name">{t.nome_treino}</p>
                                                            {t.descricao && <p className="uv-workout-desc">{t.descricao}</p>}
                                                        </div>
                                                        <div className="uv-actions" onClick={e => e.stopPropagation()}>
                                                            <button className="uv-btn-edit" onClick={() => toggleExpandir(t.id)}>
                                                                {aberto ? 'Fechar' : 'Ver'}
                                                            </button>
                                                            <button className="uv-btn-edit" onClick={() => setCopiarAlvo(t)}>Copiar</button>
                                                        </div>
                                                    </div>

                                                    {aberto && renderDropdown(t.id)}
                                                </React.Fragment>
                                            );
                                        })
                                    ) : (
                                        <div className="uv-empty-day" style={{ cursor: 'default' }}>Descanso</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── MODAL: ESCOLHER DIA ── */}
            {copiarAlvo && (
                <div className="at-modal-overlay" onClick={() => !copiando && setCopiarAlvo(null)}>
                    <div className="at-sheet" onClick={e => e.stopPropagation()}>
                        <h3 className="at-sheet-title">Copiar "{copiarAlvo.nome_treino}"</h3>
                        <p className="at-sheet-sub">Escolha o dia da semana:</p>
                        {DIAS_FULL.map(dia => {
                            const ocupado = diasOcupados.includes(dia);
                            return (
                                <button key={dia} className="at-day-btn" disabled={copiando} onClick={() => confirmarCopia(dia)}>
                                    <span>{dia}</span>
                                    {ocupado && <span className="at-day-btn-tag">já tem treino</span>}
                                </button>
                            );
                        })}
                        <button className="at-cancel-btn" onClick={() => setCopiarAlvo(null)} disabled={copiando}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* ── TOAST ── */}
            {toast && <div className="at-toast">{toast}</div>}
        </div>
    );
}
