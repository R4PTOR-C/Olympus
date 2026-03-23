// src/views/components/Navbar.jsx
import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../../AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import DarkModeSwitch from './DarkModeSwitch';

function Navbar() {
    const { userId, avatar, funcao, funcao_extra, funcaoAtiva, trocarFuncao, loggedIn, darkMode, mensagensNaoLidas, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isActive = (path) => location.pathname.startsWith(path);

    const homeLink = funcaoAtiva === 'Professor' ? '/usuarios' : `/home/${userId}`;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const NavItem = ({ to, icon, label, badge }) => {
        const active = isActive(to);
        return (
            <button className={`nb-item${active ? ' active' : ''}`} onClick={() => navigate(to)}>
                <div className="nb-icon-wrap">
                    {icon(active)}
                    {badge}
                </div>
                <span className="nb-label">{label}</span>
            </button>
        );
    };

    const professorItems = [
        {
            to: '/usuarios',
            label: 'Alunos',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            ),
            badge: mensagensNaoLidas > 0 ? <span className="nb-dot" /> : null,
        },
        {
            to: '/meus-chats',
            label: 'Mensagens',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
            ),
            badge: mensagensNaoLidas > 0 ? (
                <span className="nb-badge">{mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}</span>
            ) : null,
        },
        {
            to: `/historico-alunos`,
            label: 'Histórico',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
            ),
        },
    ];

    const alunoItems = [
        {
            to: `/home/${userId}`,
            label: 'Home',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill={active ? '#4A90D9' : 'none'} stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
            ),
        },
        {
            to: `/usuarios/view/${userId}`,
            label: 'Treinos',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
            ),
        },
        {
            to: '/hercules',
            label: 'Hércules',
            icon: (active) => (
                <img src="/hercules.png" alt="Hércules" style={{ width: 18, height: 18, objectFit: 'contain', opacity: active ? 1 : 0.5 }} />
            ),
        },
        {
            to: '/historico-exercicios',
            label: 'Histórico',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
            ),
        },
        {
            to: '/procurar-professor',
            label: 'Personal',
            icon: (active) => (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#7B8FA8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            ),
            badge: mensagensNaoLidas > 0 ? <span className="nb-dot" /> : null,
        },
    ];

    const items = funcaoAtiva === 'Professor' ? professorItems : alunoItems;

    return (
        <nav className="nb-top">
            {/* Logo */}
            <Link className="nb-logo" to={homeLink}>
                <img src="/logo_texto_azul.png" alt="Olympus" className="nb-logo-img" />
            </Link>

            {/* Nav items — hidden on mobile (bottom navbar handles navigation) */}
            {loggedIn && (
                <div className="nb-items d-none d-md-flex">
                    {items.map(item => (
                        <NavItem key={item.to} {...item} />
                    ))}
                </div>
            )}

            {/* Avatar + dropdown */}
            {loggedIn && (
                <div className="nb-avatar-wrap" ref={dropdownRef}>
                    <button
                        className="nb-avatar-btn"
                        onClick={() => setDropdownOpen(o => !o)}
                    >
                        {avatar ? (
                            <img src={avatar} alt="Avatar" className="nb-avatar" />
                        ) : (
                            <div className="nb-avatar nb-avatar-placeholder">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                        )}
                    </button>

                    {dropdownOpen && (
                        <ul className="nb-dropdown animate-dropdown">
                            <li
                                className="nb-dd-item d-flex justify-content-between align-items-center"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.querySelector('.dm-btn')?.click();
                                }}
                            >
                                <span>{darkMode ? 'Modo claro' : 'Modo escuro'}</span>
                                <DarkModeSwitch />
                            </li>

                            <li><hr className="nb-dd-divider" /></li>

                            {funcao_extra && (
                                <li>
                                    <button className="nb-dd-item" onClick={() => {
                                        trocarFuncao();
                                        const next = funcaoAtiva === funcao ? funcao_extra : funcao;
                                        navigate(next === 'Professor' ? '/usuarios' : `/home/${userId}`);
                                        setDropdownOpen(false);
                                    }}>
                                        Trocar para modo {funcaoAtiva === funcao ? funcao_extra : funcao}
                                    </button>
                                </li>
                            )}

                            <li>
                                <button className="nb-dd-item" onClick={() => {
                                    navigate(funcaoAtiva === 'Professor' ? `/professores/edit/${userId}` : `/usuarios/edit/${userId}`);
                                    setDropdownOpen(false);
                                }}>
                                    Perfil
                                </button>
                            </li>

                            <li>
                                <button className="nb-dd-item nb-dd-danger" onClick={() => {
                                    logout();
                                    setDropdownOpen(false);
                                }}>
                                    Logout
                                </button>
                            </li>
                        </ul>
                    )}
                </div>
            )}
        </nav>
    );
}

export default Navbar;
