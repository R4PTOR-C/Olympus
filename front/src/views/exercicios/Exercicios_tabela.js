import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/ExerciciosTabela.css';

const GRUPOS = ['Todos', 'Peitoral', 'Bíceps', 'Tríceps', 'Costas', 'Ombros', 'Pernas', 'Abdômen', 'Panturrilha'];
const ROWS_OPTIONS = [25, 50, 100];

const isVideo = (url) => /\.(mp4|mov|webm)(\?|$)/i.test(url) || url?.includes('/video/');

const levelClass = (nivel) => {
    const map = { 'Iniciante': 'iniciante', 'Intermediário': 'intermediario', 'Avançado': 'avancado' };
    return map[nivel] || '';
};

const IconPlus = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
);

const IconSearch = () => (
    <svg className="et-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

const IconX = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

const IconEdit = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
);

const IconTrash = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14H6L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/>
        <path d="M9 6V4h6v2"/>
    </svg>
);

const IconChevron = ({ dir }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
            ? <polyline points="15 18 9 12 15 6"/>
            : <polyline points="9 18 15 12 9 6"/>}
    </svg>
);

const Exercicios_tabela = () => {
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    const [exercicios, setExercicios]   = useState([]);
    const [loading, setLoading]         = useState(true);
    const [search, setSearch]           = useState('');
    const [grupoFiltro, setGrupoFiltro] = useState('Todos');
    const [page, setPage]               = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [gifModal, setGifModal]       = useState(null);

    useEffect(() => {
        fetch(`${apiUrl}/exercicios`)
            .then(r => r.json())
            .then(data => setExercicios(data))
            .finally(() => setLoading(false));
    }, [apiUrl]);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return exercicios.filter(e => {
            const matchGrupo  = grupoFiltro === 'Todos' || e.grupo_muscular === grupoFiltro;
            const matchSearch = !term ||
                e.nome_exercicio?.toLowerCase().includes(term) ||
                e.grupo_muscular?.toLowerCase().includes(term);
            return matchGrupo && matchSearch;
        });
    }, [exercicios, search, grupoFiltro]);

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const safePage   = Math.min(page, Math.max(0, totalPages - 1));
    const paginated  = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage);
    const from = filtered.length ? safePage * rowsPerPage + 1 : 0;
    const to   = Math.min((safePage + 1) * rowsPerPage, filtered.length);

    const handleDelete = (id) => {
        if (!window.confirm('Deletar este exercício?')) return;
        fetch(`${apiUrl}/exercicios/${id}`, { method: 'DELETE' })
            .then(r => { if (r.ok) setExercicios(prev => prev.filter(e => e.id !== id)); });
    };

    const Thumbnail = ({ ex, className }) => {
        if (!ex.gif_url) return <div className={`et-thumb-empty ${className || ''}`} />;
        return isVideo(ex.gif_url)
            ? <video src={ex.gif_url} autoPlay loop muted playsInline className={`et-thumb ${className || ''}`} onClick={() => setGifModal(ex.gif_url)} />
            : <img src={ex.gif_url} alt={ex.nome_exercicio} className={`et-thumb ${className || ''}`} onClick={() => setGifModal(ex.gif_url)} />;
    };

    return (
        <div className="et-wrapper">

            {/* ── PAGE HEADER ── */}
            <div className="et-page-header">
                <div className="et-header-inner">
                    <div className="et-header-left">
                        <h1 className="et-title">Exercícios</h1>
                        <span className="et-subtitle">{exercicios.length} cadastrados</span>
                    </div>
                    <button className="et-btn-new" onClick={() => navigate('/exercicios/new')}>
                        <IconPlus /> Novo Exercício
                    </button>
                </div>
            </div>

            {/* ── CONTROLS ── */}
            <div className="et-controls">
                <div className="et-search-wrap">
                    <IconSearch />
                    <input
                        className="et-search"
                        placeholder="Buscar por nome ou grupo..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(0); }}
                    />
                    {search && (
                        <button className="et-search-clear" onClick={() => setSearch('')}>
                            <IconX />
                        </button>
                    )}
                </div>
                <div className="et-filters">
                    {GRUPOS.map(g => (
                        <button
                            key={g}
                            className={`et-filter${grupoFiltro === g ? ' active' : ''}`}
                            onClick={() => { setGrupoFiltro(g); setPage(0); }}
                        >
                            {g}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── RESULTS BAR ── */}
            <div className="et-results-bar">
                <span className="et-results-count">
                    {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
                    {grupoFiltro !== 'Todos' && ` · ${grupoFiltro}`}
                    {search && ` · "${search}"`}
                </span>
            </div>

            {/* ── LOADING ── */}
            {loading ? (
                <div className="et-loading">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="et-row-skel" style={{ animationDelay: `${i * 0.06}s` }} />
                    ))}
                </div>

            /* ── EMPTY ── */
            ) : filtered.length === 0 ? (
                <div className="et-empty">
                    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.25 }}>
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p>Nenhum exercício encontrado</p>
                </div>

            ) : (
                <>
                    {/* ════════════════════════════ */}
                    {/* TABLE — desktop              */}
                    {/* ════════════════════════════ */}
                    <div className="et-table-wrap">
                        <table className="et-table">
                            <thead>
                                <tr>
                                    <th className="et-th-media">Mídia</th>
                                    <th className="et-th-name">Nome</th>
                                    <th className="et-th-group">Grupo</th>
                                    <th className="et-th-level">Nível</th>
                                    <th className="et-th-actions">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map(ex => (
                                    <tr key={ex.id} className="et-row">

                                        <td className="et-td-media">
                                            <Thumbnail ex={ex} />
                                        </td>

                                        <td className="et-td-name">
                                            <span className="et-ex-name">{ex.nome_exercicio}</span>
                                            <span className="et-ex-id">#{ex.id}</span>
                                        </td>

                                        <td className="et-td-group">
                                            {ex.grupo_muscular && (
                                                <span className="et-badge et-badge-group">{ex.grupo_muscular}</span>
                                            )}
                                        </td>

                                        <td className="et-td-level">
                                            {ex.nivel && (
                                                <span className={`et-badge et-badge-level et-level-${levelClass(ex.nivel)}`}>
                                                    {ex.nivel}
                                                </span>
                                            )}
                                        </td>

                                        <td className="et-td-actions">
                                            <button
                                                className="et-action-btn et-edit-btn"
                                                onClick={() => navigate(`/exercicios/edit/${ex.id}`)}
                                                title="Editar"
                                            >
                                                <IconEdit /> <span>Editar</span>
                                            </button>
                                            <button
                                                className="et-action-btn et-del-btn"
                                                onClick={() => handleDelete(ex.id)}
                                                title="Deletar"
                                            >
                                                <IconTrash /> <span>Deletar</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ════════════════════════════ */}
                    {/* CARDS — mobile               */}
                    {/* ════════════════════════════ */}
                    <div className="et-cards">
                        {paginated.map(ex => (
                            <div key={ex.id} className="et-card">
                                <div className="et-card-thumb">
                                    <Thumbnail ex={ex} />
                                </div>
                                <div className="et-card-body">
                                    <div className="et-card-badges">
                                        {ex.grupo_muscular && (
                                            <span className="et-badge et-badge-group">{ex.grupo_muscular}</span>
                                        )}
                                        {ex.nivel && (
                                            <span className={`et-badge et-badge-level et-level-${levelClass(ex.nivel)}`}>
                                                {ex.nivel}
                                            </span>
                                        )}
                                    </div>
                                    <span className="et-ex-name">{ex.nome_exercicio}</span>
                                    <span className="et-ex-id">#{ex.id}</span>
                                </div>
                                <div className="et-card-actions">
                                    <button
                                        className="et-action-btn et-edit-btn"
                                        onClick={() => navigate(`/exercicios/edit/${ex.id}`)}
                                        title="Editar"
                                    >
                                        <IconEdit />
                                    </button>
                                    <button
                                        className="et-action-btn et-del-btn"
                                        onClick={() => handleDelete(ex.id)}
                                        title="Deletar"
                                    >
                                        <IconTrash />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── PAGINATION ── */}
                    <div className="et-pagination">
                        <span className="et-pag-info">
                            {from}–{to} de {filtered.length}
                        </span>

                        <div className="et-pag-controls">
                            <button
                                className="et-pag-btn"
                                disabled={safePage === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                            >
                                <IconChevron dir="left" />
                            </button>
                            <span className="et-pag-pages">{safePage + 1} / {totalPages}</span>
                            <button
                                className="et-pag-btn"
                                disabled={safePage >= totalPages - 1}
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            >
                                <IconChevron dir="right" />
                            </button>
                        </div>

                        <div className="et-pag-rows">
                            <span>Por página:</span>
                            {ROWS_OPTIONS.map(n => (
                                <button
                                    key={n}
                                    className={`et-rows-btn${rowsPerPage === n ? ' active' : ''}`}
                                    onClick={() => { setRowsPerPage(n); setPage(0); }}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* ── GIF MODAL ── */}
            {gifModal && (
                <div className="et-modal-overlay" onClick={() => setGifModal(null)}>
                    <div className="et-modal-content" onClick={e => e.stopPropagation()}>
                        {isVideo(gifModal)
                            ? <video src={gifModal} autoPlay loop muted playsInline />
                            : <img src={gifModal} alt="" />
                        }
                        <button className="et-modal-close" onClick={() => setGifModal(null)}>
                            <IconX size={14} />
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Exercicios_tabela;
