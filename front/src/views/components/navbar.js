import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Navbar() {
    const user = useContext(AuthContext);

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
                            <span className="navbar-text ms-3">
                                Olá, {user.userName}!
                            </span>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
