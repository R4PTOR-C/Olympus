// src/views/components/Navbar.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import DarkModeSwitch from "../components/DarkModeSwitch";

function Navbar() {
    const user = useContext(AuthContext);
    const navigate = useNavigate();
    const { userId, avatar, funcao, loggedIn } = useContext(AuthContext);

    const avatarUrl = avatar || '/default-avatar.png'; // imagem padrão opcional

    const handleLogout = () => {
        user.logout();
    };

    const homeLink =
        funcao === 'Professor'
            ? '/usuarios'
            : `/home/${userId}`;

    return (
        <nav className="navbar navbar-expand-lg custom-navbar-bg">
            <div className="container-fluid d-flex justify-content-between align-items-center">

                {/* Logo Olympus */}
                <Link
                    className="navbar-brand"
                    style={{ fontFamily: 'delirium' }}
                    to={homeLink}
                >
                    OLYMPUS
                </Link>

                {/* Links centrais */}
                <div className="d-none d-md-flex align-items-center gap-3">
                    {funcao === 'Professor' ? (
                        <>
                            <Link className="nav-link" to="/usuarios">Alunos</Link>
                            <Link className="nav-link" to="/meus-chats">Mensagens</Link>
                            <div className="nav-item dropdown">
                                <a
                                    className="nav-link dropdown-toggle"
                                    href="#"
                                    id="exerciciosDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    Exercícios
                                </a>
                                <ul className="dropdown-menu" aria-labelledby="exerciciosDropdown">
                                    <li><Link className="dropdown-item" to="/exercicios_new">Novo Exercício</Link></li>
                                    <li><Link className="dropdown-item" to="/exercicios">Tabela de Exercícios</Link></li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <>
                            <img src="/dumbbell2.png" alt="Repetições" style={{ width: '20px', height: '20px' }} />
                            <Link className="nav-link" to={`/home/${userId}`}>Treinos</Link>
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
                                    <img
                                        src={avatarUrl}
                                        alt="Avatar do usuário"
                                        className="rounded-circle"
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            objectFit: 'cover',
                                            border: '2px solid #fff',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </a>

                                {/* Menu dropdown */}
                                <ul
                                    className="dropdown-menu dropdown-menu-end animate-dropdown shadow-lg border-0 rounded-3"
                                    aria-labelledby="userDropdown"
                                >
                                    <li className="dropdown-item d-flex justify-content-between align-items-center">
                                        <span>Tema escuro</span>
                                        <DarkModeSwitch />
                                    </li>

                                    <li><hr className="dropdown-divider" /></li>

                                    <li>
                                        <Link className="dropdown-item" to={`/usuarios/edit/${userId}`}>
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
