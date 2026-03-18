// src/views/components/Navbar.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeSwitch from "../components/DarkModeSwitch";
import usePWAInstall from "../../hooks/usePWAInstall";


function Navbar() {
    const user = useContext(AuthContext);
    const navigate = useNavigate();
    const { userId, avatar, funcao, funcao_extra, funcaoAtiva, trocarFuncao, loggedIn, darkMode, mensagensNaoLidas } = useContext(AuthContext);

    const { isInstallable, installApp } = usePWAInstall(); // 👈 AQUI



    const handleLogout = () => {
        user.logout();
    };

    const homeLink =
        funcaoAtiva === 'Professor'
            ? '/usuarios'
            : `/home/${userId}`;

    return (
        <nav className="navbar navbar-expand-lg custom-navbar-bg">
            <div className="container-fluid d-flex justify-content-between align-items-center">

                {/* Logo Olympus */}
                <Link
                    className="navbar-brand"
                    to={homeLink}
                >
                    <img src="/logo_texto_azul.png" alt="Olympus" className="navbar-logo-texto" />
                </Link>

                {/* Links centrais */}
                <div className="d-none d-md-flex align-items-center gap-3">
                    {funcaoAtiva === 'Professor' ? (
                        <>
                            <Link className="nav-link position-relative" to="/usuarios">
                                Alunos
                                {mensagensNaoLidas > 0 && <span className="navbar-dot-neon" />}
                            </Link>
                            <Link className="nav-link position-relative" to="/meus-chats">
                                Mensagens
                                {mensagensNaoLidas > 0 && (
                                    <span className="navbar-badge">{mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}</span>
                                )}
                            </Link>
                        </>
                    ) : (
                        <>
                            <img src="/dumbbell2.png" alt="Repetições" style={{ width: '20px', height: '20px' }} />
                            <Link className="nav-link" to={`/home/${userId}`}>Treinos</Link>
                            <Link className="nav-link position-relative" to="/procurar-professor">
                                Personal
                                {mensagensNaoLidas > 0 && <span className="navbar-dot-neon" />}
                            </Link>
                            <button
                                className="btn btn-outline-light"
                                onClick={() => navigate(`/usuarios/view/${userId}`)}
                            >
                                Meus Treinos
                            </button>
                            <button
                                className="btn btn-outline-light"
                                onClick={() => navigate(`/hercules`)}
                            >
Hércules                            </button>
                            <button
                                className="btn btn-outline-light"
                                onClick={() => navigate(`/historico-exercicios`)}
                            >
                                Histórico Treinos
                            </button>
                        </>
                    )}
                </div>

                {/* Lado direito */}
                <div className="d-flex align-items-center gap-3">
                    {loggedIn && (
                        <>
                            {/* Ícone de chat
                            <button
                                className="btn btn-link text-white p-0 position-relative"
                                onClick={() => navigate('/meus-chats')}
                                title="Mensagens"
                            >
                                <i className="bi bi-chat-dots" style={{ fontSize: '1.5rem' }}></i>
                            </button>
                            */}
                            {/* Dropdown no avatar */}
                            <div className="dropdown">
                                <a
                                    href="#"
                                    className="d-flex align-items-center"
                                    id="userDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    {avatar ? (
                                        <img
                                            src={avatar}
                                            alt="Avatar do usuário"
                                            className="navbar-avatar"
                                        />
                                    ) : (
                                        <div className="navbar-avatar navbar-avatar-placeholder">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                <circle cx="12" cy="7" r="4"/>
                                            </svg>
                                        </div>
                                    )}
                                </a>

                                {/* Menu dropdown */}
                                <ul
                                    className="dropdown-menu dropdown-menu-end animate-dropdown shadow-lg border-0 rounded-3"
                                    aria-labelledby="userDropdown"
                                >



                                    <li
                                        className="dropdown-item d-flex justify-content-between align-items-center"
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.currentTarget.querySelector('.dm-btn')?.click();
                                        }}
                                    >
                                        <span>{darkMode ? 'Modo claro' : 'Modo escuro'}</span>
                                        <DarkModeSwitch />
                                    </li>

                                    <li><hr className="dropdown-divider" /></li>

                                    {funcao_extra && (
                                        <li>
                                            <button className="dropdown-item" onClick={() => {
                                                trocarFuncao();
                                                const proximaFuncao = funcaoAtiva === funcao ? funcao_extra : funcao;
                                                if (proximaFuncao === 'Professor') {
                                                    navigate('/usuarios');
                                                } else {
                                                    navigate(`/home/${userId}`);
                                                }
                                            }}>
                                                Trocar para modo {funcaoAtiva === funcao ? funcao_extra : funcao}
                                            </button>
                                        </li>
                                    )}

                                    <li>
                                        <Link className="dropdown-item" to={funcaoAtiva === 'Professor' ? `/professores/edit/${userId}` : `/usuarios/edit/${userId}`}>
                                            Perfil
                                        </Link>
                                    </li>

                                    <li>
                                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                                            Logout
                                        </button>
                                    </li>
                                </ul>

                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
