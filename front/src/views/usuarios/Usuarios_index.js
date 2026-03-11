import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/home.css';
import '../../styles/AlunosIndex.css';

const Usuarios_index = () => {
    const [usuarios,         setUsuarios]         = useState([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [loading,          setLoading]          = useState(false);
    const [error,            setError]            = useState(null);
    const [searchTerm,       setSearchTerm]       = useState('');

    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        setLoading(true);
        fetch(`${apiUrl}/usuarios`)
            .then(r => {
                if (!r.ok) throw new Error('Erro na resposta do servidor');
                return r.json();
            })
            .then(data => {
                const alunos = data.filter(u => u.funcao === 'Aluno');
                setUsuarios(alunos);
                setFilteredUsuarios(alunos);
                setLoading(false);
            })
            .catch(() => {
                setError('Erro ao carregar alunos. Tente novamente.');
                setLoading(false);
            });
    }, [apiUrl]);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term) {
            setFilteredUsuarios(
                usuarios.filter(u =>
                    u.nome.toLowerCase().includes(term.toLowerCase()) ||
                    u.email.toLowerCase().includes(term.toLowerCase())
                )
            );
        } else {
            setFilteredUsuarios(usuarios);
        }
    };

    return (
        <div className="home-wrapper">

            {/* ── HEADER ── */}
            <div className="h-greeting">
                <p className="h-greeting-date">Olympus</p>
                <h1 className="h-greeting-title">Alunos</h1>
                <p className="h-greeting-sub">
                    {loading ? 'Carregando...' : `${filteredUsuarios.length} aluno${filteredUsuarios.length !== 1 ? 's' : ''} cadastrado${filteredUsuarios.length !== 1 ? 's' : ''}`}
                </p>
            </div>

            {/* ── BUSCA ── */}
            <div className="al-search-wrap">
                <span className="al-search-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </span>
                <input
                    type="text"
                    className="al-search-input"
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {/* ── ERRO ── */}
            {error && (
                <div style={{ margin: '0 20px 16px', padding: '12px 16px', background: 'rgba(232,64,64,0.08)', border: '1px solid rgba(232,64,64,0.2)', borderRadius: '12px', color: '#E84040', fontSize: '0.82rem' }}>
                    {error}
                </div>
            )}

            {/* ── LOADING SKELETONS ── */}
            {loading && (
                <div className="al-list">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="al-skeleton">
                            <div className="al-skel-circle" />
                            <div className="al-skel-lines">
                                <div className="al-skel-line" />
                                <div className="al-skel-line short" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── LISTA ── */}
            {!loading && !error && (
                filteredUsuarios.length === 0 ? (
                    <div className="al-empty">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" display="block" style={{ margin: '0 auto 10px' }}>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        {searchTerm ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado ainda.'}
                    </div>
                ) : (
                    <div className="al-list">
                        {filteredUsuarios.map(usuario => (
                            <div key={usuario.id} className="al-card">

                                {/* Avatar */}
                                <div className="al-avatar">
                                    {usuario.avatar ? (
                                        <img src={usuario.avatar} alt={usuario.nome} />
                                    ) : (
                                        <div className="al-avatar-placeholder">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                <circle cx="12" cy="7" r="4"/>
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="al-info">
                                    <p className="al-name">{usuario.nome}</p>
                                    <p className="al-meta">
                                        {usuario.objetivo && <span>{usuario.objetivo}</span>}
                                        {usuario.objetivo && usuario.idade && <span className="al-meta-dot" />}
                                        {usuario.idade && <span>{usuario.idade} anos</span>}
                                        {!usuario.objetivo && !usuario.idade && <span>{usuario.email}</span>}
                                    </p>
                                </div>

                                {/* Ações */}
                                <div className="al-actions">
                                    <Link
                                        to={`/usuarios/view/${usuario.id}`}
                                        className="al-btn-ghost"
                                        title="Ver perfil"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </Link>
                                    <Link
                                        to={`/usuarios/${usuario.id}/treinos`}
                                        className="al-btn-primary"
                                        title="Criar treino"
                                    >
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"/>
                                            <line x1="5" y1="12" x2="19" y2="12"/>
                                        </svg>
                                    </Link>
                                </div>

                            </div>
                        ))}
                    </div>
                )
            )}

        </div>
    );
};

export default Usuarios_index;
