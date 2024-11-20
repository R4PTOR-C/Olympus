import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Navbar() {
    const user = useContext(AuthContext);

    // Construir a URL do avatar, assumindo que está sendo servido a partir de "/uploads"
    const avatarUrl = user.avatar ? `${process.env.REACT_APP_API_BASE_URL}/uploads/${user.avatar}` : null;

    // Função de logout
    const handleLogout = () => {
        user.logout();
    };

    // Determinar o link para "OLYMPUS" baseado na função do usuário
    const homeLink = user.funcao === 'Professor' ? '/usuarios' : '/home';

    return (
        <nav className="navbar navbar-expand-lg custom-navbar-bg">
            <div className="container-fluid">
                {/* Link "OLYMPUS" redirecionando condicionalmente */}
                <Link className="navbar-brand" style={{ fontFamily: 'delirium' }} to={homeLink}>
                    OLYMPUS
                </Link>

                <button
                    className="navbar-toggler navbar-toggler-custom"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 user-links align-items-center">
                        {/* Links de navegação */}
                        {user.funcao === 'Professor' ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/usuarios">Alunos</Link>
                                </li>
                                {/* Dropdown para Exercícios */}
                                <li className="nav-item dropdown">
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
                                        <li>
                                            <Link className="dropdown-item" to="/exercicios_new">Novo Exercício</Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/exercicios">Tabela de Exercícios</Link>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/home">Exercícios</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="#">Avaliação Física</Link>
                                </li>
                            </>
                        )}

                        {/* Dropdown do usuário */}
                        {user.loggedIn && (
                            <li className="nav-item dropdown ms-3">
                                <a
                                    className="nav-link dropdown-toggle d-flex align-items-center"
                                    href="#"
                                    id="userDropdown"
                                    role="button"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                >
                                    <span>Olá, {user.userName}!</span>
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt="Avatar do usuário"
                                            className="rounded-circle ms-2"
                                            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <span className="ms-2"></span>
                                    )}
                                </a>
                                <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                    <li>
                                        <Link className="dropdown-item" to={`/usuarios/edit/${user.userId}`}>
                                            Perfil
                                        </Link>
                                    </li>
                                    <li>
                                        <hr className="dropdown-divider" />
                                    </li>
                                    <li>
                                        <button className="dropdown-item" onClick={handleLogout}>
                                            Logout
                                        </button>
                                    </li>
                                </ul>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
