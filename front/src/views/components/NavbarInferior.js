import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import '../../styles/NavbarInferior.css'

function NavbarInferior() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId } = useContext(AuthContext); // pega o id do contexto

    const navItems = [
        { icon: 'bi-house', path: `/home/${userId}`, label: 'Home' },
        { icon: 'bi-clock-history', path: '/historico-exercicios', label: 'Histórico' },
        { icon: 'bi-pencil', path: `/usuarios/view/${userId}`, label: 'Editar Treinos' },
        { icon: 'bi-person', path: `/usuarios/edit/${userId}`, label: 'Perfil' },
    ];

    return (
        <nav className="navbar-inferior fixed-bottom d-md-none bg-dark d-flex justify-content-around">
            {navItems.map((item, index) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                    <button
                        key={index}
                        className={`btn d-flex flex-column align-items-center flex-grow-1 border-0 bg-dark ${isActive ? 'text-warning' : 'text-white'}`}
                        onClick={() => navigate(item.path)}
                        style={{ padding: '0.5rem 0' }}
                    >
                        <i className={`bi ${item.icon} fs-4`}></i>
                        <div style={{ fontSize: '0.75rem' }}>{item.label}</div>
                    </button>
                );
            })}
        </nav>

    );
}

export default NavbarInferior;
