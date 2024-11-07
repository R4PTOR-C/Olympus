import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Navbar() {
    const user = useContext(AuthContext);

    return (
        <nav className="navbar navbar-expand-lg custom-navbar-bg">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">OLYMPUS</a>

                {/* Botão de Toggle para exibir a navbar no mobile */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarSupportedContent"
                    aria-controls="navbarSupportedContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                {/* Conteúdo colapsável da navbar */}
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    {/* Pesquisa centralizada */}
                    <div className="search-container">
                        <form className="d-flex" role="search">
                            <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
                            <button className="btn btn-outline-success" type="submit">Search</button>
                        </form>
                    </div>

                    {/* Links de navegação e mensagem de usuário */}
                    <div className="user-links">
                        <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                            {user.funcao === 'Professor' ? (
                                <li className="nav-item">
                                    <Link className="nav-link" to="/usuarios">Usuarios</Link>
                                </li>
                            ) : (
                                <li className="nav-item">
                                    <Link className="nav-link" to="/home">Home</Link>
                                </li>
                            )}
                        </ul>
                        {user.loggedIn && (
                            <span className="navbar-text me-3">
                                Olá, {user.userName}!
                            </span>
                        )}
                        <button className="btn btn-outline-primary" type="button">Logout</button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
