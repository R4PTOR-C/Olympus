import React, { useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import { Link, useNavigate } from 'react-router-dom';


function Navbar() {
    const user = useContext(AuthContext);
    const navigate = useNavigate();
    const {
        userId,
        userName,
        avatar,
        funcao,
        loggedIn,
        logout,
    } = useContext(AuthContext);


    // Construir a URL do avatar, assumindo que está sendo servido a partir de "/uploads"
    const avatarUrl = avatar ? avatar : null; // Já vem completo do Cloudinary

    // Função de logout
    const handleLogout = () => {
        user.logout();
    };

    // Determinar o link para "OLYMPUS" baseado na função do usuário
    const homeLink =
        user.funcao === 'Professor'
            ? '/usuarios'
            : `/home/${user.userId}`; // ✅ inclui o ID do aluno
    return (
        <nav className="navbar navbar-expand-lg custom-navbar-bg">
            <div className="container-fluid d-flex justify-content-between align-items-center">

                {/* Logo Olympus */}
                <Link className="navbar-brand" style={{ fontFamily: 'delirium' }} to={homeLink}>
                    OLYMPUS
                </Link>

                {/* Links do centro — visíveis apenas em telas médias pra cima */}
                <div className="d-none d-md-flex align-items-center gap-3">
                    {user.funcao === 'Professor' ? (
                        <>
                            <Link className="nav-link" to="/usuarios">Alunos</Link>
                            <div className="nav-item dropdown">
                                <a className="nav-link dropdown-toggle" href="#" id="exerciciosDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
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
                            <Link className="nav-link" to={`/home/${user.userId}`}>Treinos</Link>
                            <button
                                className="btn btn-outline-light"
                                onClick={() => navigate(`/usuarios/view/${user.userId}`)}
                            >
                                Meus Treinos
                            </button>
                        </>
                    )}
                </div>

                {/* Avatar e nome sempre visível no canto direito */}
                {user.loggedIn && (
                    <div className="dropdown d-flex align-items-center">
                        <a
                            className="nav-link dropdown-toggle d-flex align-items-center"
                            href="#"
                            id="userDropdown"
                            role="button"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                        >
                            <span className="d-none d-md-inline">Olá, {user.userName}!</span>
                            <span className="d-inline d-md-none me-2">{user.userName}</span>
                            {avatarUrl && (
                                <img
                                    src={avatarUrl}
                                    alt="Avatar do usuário"
                                    className="rounded-circle ms-2"
                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                            )}
                        </a>
                        <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                            <li><Link className="dropdown-item" to={`/usuarios/edit/${user.userId}`}>Perfil</Link></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                        </ul>
                    </div>
                )}
            </div>


        </nav>
    );
}

export default Navbar;
