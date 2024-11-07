import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Navbar() {
    const user = useContext(AuthContext);

    // Construir a URL do avatar, assumindo que está sendo servido a partir de "/uploads"
    const avatarUrl = user.avatar ? `${process.env.REACT_APP_API_BASE_URL}/uploads/${user.avatar}` : null;


    console.log("Avatar URL:", avatarUrl);
    console.log("User Avatar Field:", user.avatar);

    return (
        <nav className="navbar navbar-expand-lg custom-navbar-bg">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">OLYMPUS</a>

                <button className="navbar-toggler navbar-toggler-custom" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    {/* Pesquisa centralizada */}
                    <div className="mx-auto search-container">
                        <form className="d-flex" role="search">
                            <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                            <button className="btn btn-outline-success" type="submit">Search</button>
                        </form>
                    </div>

                    {/* Links de navegação alinhados à direita */}
                    <ul className="navbar-nav ms-auto mb-2 mb-lg-0 user-links">
                        {user.funcao === 'Professor' ? (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/usuarios">Alunos</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/exercicios_new">Exercicios</Link>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/home">Exercicios</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="#">Avaliação Física</Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="nav-link" to="#">Calendario</Link>
                                </li>
                            </>
                        )}
                        {user.loggedIn && (
                            <>
                                <span className="navbar-text ms-3">
                                    Olá, {user.userName}!
                                </span>
                                {avatarUrl ? (
                                    <li className="nav-item ms-3">
                                        <Link to={`/usuarios/edit/${user.userId}`}>
                                            <img
                                                src={avatarUrl}
                                                alt="Avatar do usuário"
                                                className="rounded-circle"
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer' }}
                                            />
                                        </Link>
                                    </li>
                                ) : (
                                    <li className="nav-item ms-3">
                                        <Link to={`/usuarios/edit/${user.userId}`}>
                                            <span className="btn btn-secondary">Perfil</span>
                                        </Link>
                                    </li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
