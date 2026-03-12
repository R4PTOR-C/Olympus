import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageStateHandler from "./components/PageStateHandler";
import { AuthContext } from "../AuthContext";
import '../styles/home.css';
import ModalCarregando from './components/ModalCarregando';

const WEEK = [
    { short: 'Seg', full: 'Segunda-feira', jsDay: 1 },
    { short: 'Ter', full: 'Terça-feira',   jsDay: 2 },
    { short: 'Qua', full: 'Quarta-feira',  jsDay: 3 },
    { short: 'Qui', full: 'Quinta-feira',  jsDay: 4 },
    { short: 'Sex', full: 'Sexta-feira',   jsDay: 5 },
    { short: 'Sáb', full: 'Sábado',        jsDay: 6 },
    { short: 'Dom', full: 'Domingo',       jsDay: 0 },
];

const MONTHS = [
    'Jan','Fev','Mar','Abr','Mai','Jun',
    'Jul','Ago','Set','Out','Nov','Dez'
];

function Home() {
    const { darkMode } = useContext(AuthContext);
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [treinos, setTreinos] = useState([]);
    const [exerciciosTreinoDoDia, setExerciciosTreinoDoDia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/'); return; }

        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }

        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                    fetchTreinos(data.userId, token);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao verificar sessão:', err);
                setError('Erro ao verificar sessão');
                setLoading(false);
            });
    }, [navigate, darkMode]);

    const fetchTreinos = async (userId, token) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error();
            const data = await response.json();
            setTreinos(data);

            const today = getToday();
            const treinoDoDia = data.find(t => t.dia_semana === today);
            if (treinoDoDia) fetchExerciciosTreino(treinoDoDia.id, token);
        } catch {
            setError('Erro ao buscar os treinos');
        }
    };

    const fetchExerciciosTreino = async (treinoId, token) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!response.ok) throw new Error();
            const data = await response.json();
            setExerciciosTreinoDoDia(data.slice(0, 4));
        } catch {
            console.error('Erro ao buscar exercícios do treino');
        }
    };

    const getToday = () => {
        const days = ["Domingo","Segunda-feira","Terça-feira","Quarta-feira","Quinta-feira","Sexta-feira","Sábado"];
        return days[new Date().getDay()];
    };

    const treinoImagemUrl = (imagem) =>
        `${process.env.REACT_APP_API_BASE_URL}/uploads/${imagem}`;

    const today           = getToday();
    const todayJsDay      = new Date().getDay();
    const treinoDoDia     = treinos.find(t => t.dia_semana === today);
    const proximosTreinos = treinos.filter(t => t.dia_semana !== today);

    const now = new Date();
    const dateRange = `${now.getDate()} de ${MONTHS[now.getMonth()]}`;

    if (loading) return <ModalCarregando show={true} />;
    if (error)   return <div style={{ color: '#fff', padding: '2rem' }}>Erro: {error}</div>;

    return (
        <PageStateHandler>
            <div className="home-wrapper">
                {user.loggedIn ? (
                    <>
                        {/* ── WEEK STRIP ── */}
                        <div className="h-week-header">
                            <span className="h-week-header-title">Semana</span>
                            <span className="h-week-header-date">{today.split('-')[0].trim()} · {dateRange}</span>
                        </div>
                        <div className="h-week-strip">
                            {WEEK.map(day => {
                                const hasWorkout = treinos.some(t => t.dia_semana === day.full);
                                const isToday    = day.jsDay === todayJsDay;
                                const cls = `h-week-day${isToday ? ' active' : hasWorkout ? ' has-workout' : ' empty'}`;
                                return (
                                    <div
                                        key={day.short}
                                        className={cls}
                                        onClick={() => {
                                            const t = treinos.find(tr => tr.dia_semana === day.full);
                                            if (t) navigate(`/treinos/${t.id}/exercicios`);
                                        }}
                                    >
                                        <span className="h-wd-label">{day.short}</span>
                                        <div className="h-wd-dot" />
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── GRID PRINCIPAL ── */}
                        <div className="h-desktop-grid">

                            {/* COLUNA: Treino do Dia */}
                            <div>
                                <div className="h-sec-header">
                                    <span className="h-sec-title">Treino do Dia</span>
                                </div>

                                {treinoDoDia ? (
                                    <div
                                        className="h-today-card"
                                        onClick={() => navigate(`/treinos/${treinoDoDia.id}/exercicios`)}
                                    >
                                        <div className="h-today-hero">
                                            <div className="h-muscle-wrap">
                                                <img
                                                    src={treinoImagemUrl(treinoDoDia.imagem)}
                                                    alt={treinoDoDia.nome_treino}
                                                />
                                            </div>
                                            <div className="h-today-info">
                                                <div className="h-today-badge">
                                                    <span className="h-today-badge-dot" />
                                                    Treino de Hoje
                                                </div>
                                                <div className="h-today-name">{treinoDoDia.nome_treino}</div>
                                                <div className="h-today-day">
                                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    {treinoDoDia.dia_semana}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-today-body">
                                            <div className="h-meta-row">
                                                <div className="h-meta-pill">
                                                    <span className="h-meta-val">{exerciciosTreinoDoDia.length || '—'}</span>
                                                    <span className="h-meta-lbl">Exercícios</span>
                                                </div>
                                                <div className="h-meta-pill">
                                                    <span className="h-meta-val">{treinoDoDia.grupo_muscular || '—'}</span>
                                                    <span className="h-meta-lbl">Grupo</span>
                                                </div>
                                                <div className="h-meta-pill">
                                                    <span className="h-meta-val">Hipert.</span>
                                                    <span className="h-meta-lbl">Foco</span>
                                                </div>
                                            </div>

                                            {Array.isArray(treinoDoDia.grupos_auxiliares) && treinoDoDia.grupos_auxiliares.length > 0 && (
                                                <div className="h-ex-tags" style={{ marginTop: 8 }}>
                                                    {treinoDoDia.grupos_auxiliares.map(g => (
                                                        <span key={g} className="h-ex-tag" style={{ opacity: 0.75 }}>
                                                            {g}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}


                                            <div className="h-cta-row">
                                                <button className="h-btn-primary">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                        <polygon points="5,3 19,12 5,21"/>
                                                    </svg>
                                                    Ver Treino Completo
                                                </button>
                                                {treinoDoDia.descricao && (
                                                    <button
                                                        className="h-btn-ghost"
                                                        title={treinoDoDia.descricao}
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-rest-card">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
                                            <rect x="12" y="28" width="40" height="8" rx="2" fill="#2c3e50"/>
                                            <rect x="6" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                                            <rect x="2" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                                            <rect x="52" y="20" width="6" height="24" rx="2" fill="#3d4e6a"/>
                                            <rect x="58" y="22" width="4" height="20" rx="2" fill="#4A90D9" opacity="0.4"/>
                                            <text x="20" y="25" fontSize="10" fontWeight="bold" fill="#3D4E6A">Z
                                                <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" dur="2s" repeatCount="indefinite"/>
                                                <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite"/>
                                            </text>
                                            <text x="26" y="20" fontSize="8" fontWeight="bold" fill="#3D4E6A">Z
                                                <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" begin="0.6s" dur="2s" repeatCount="indefinite"/>
                                                <animate attributeName="opacity" values="1;0" dur="2s" begin="0.6s" repeatCount="indefinite"/>
                                            </text>
                                            <text x="32" y="15" fontSize="6" fontWeight="bold" fill="#3D4E6A">Z
                                                <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" begin="1.2s" dur="2s" repeatCount="indefinite"/>
                                                <animate attributeName="opacity" values="1;0" dur="2s" begin="1.2s" repeatCount="indefinite"/>
                                            </text>
                                        </svg>
                                        <h5>Dia de Descanso</h5>
                                        <p>Nenhum treino agendado para hoje</p>
                                    </div>
                                )}
                            </div>

                            {/* COLUNA: Próximos Treinos */}
                            <div>
                                <div className="h-sec-header">
                                    <span className="h-sec-title">Próximos Treinos</span>
                                </div>

                                {proximosTreinos.length > 0 ? (
                                    <div className="h-upcoming-list">
                                        {proximosTreinos.map(treino => (
                                            <div
                                                className="h-upc-card"
                                                key={treino.id}
                                                onClick={() => navigate(`/treinos/${treino.id}/exercicios`)}
                                            >
                                                <div className="h-upc-thumb">
                                                    <img src={treinoImagemUrl(treino.imagem)} alt={treino.nome_treino} />
                                                </div>
                                                <div className="h-upc-info">
                                                    <div className="h-upc-day">{treino.dia_semana}</div>
                                                    <div className="h-upc-name">{treino.nome_treino}</div>
                                                    {treino.descricao && (
                                                        <div className="h-upc-desc">{treino.descricao}</div>
                                                    )}
                                                </div>
                                                <svg className="h-upc-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M9 18l6-6-6-6"/>
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-empty-upcoming">
                                        Nenhum outro treino cadastrado.
                                    </div>
                                )}
                            </div>

                        </div>
                    </>
                ) : (
                    <p style={{ color: 'var(--h-text)', padding: '2rem' }}>Você não está logado.</p>
                )}
            </div>
        </PageStateHandler>
    );
}

export default Home;
