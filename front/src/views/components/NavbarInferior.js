import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function NavbarInferior() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId } = useContext(AuthContext); // pega o id do contexto

    const navItems = [
        { icon: 'bi-house', path: `/home/${userId}`, label: 'Home' },
        { icon: 'bi-clock-history', path: '/historico', label: 'Histórico' },
        { icon: 'bi-bar-chart-line', path: '/progresso', label: 'Progresso' },
        { icon: 'bi-pencil', path: '/avaliacoes', label: 'Avaliações' },
        { icon: 'bi-person', path: `/usuarios/edit/${userId}`, label: 'Perfil' },
    ];

    return (
        <nav className="navbar fixed-bottom d-md-none bg-dark justify-content-around py-2">
            {navItems.map((item, index) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                    <button
                        key={index}
                        className={`btn btn-dark d-flex flex-column align-items-center ${isActive ? 'text-warning' : 'text-white'}`}
                        onClick={() => navigate(item.path)}
                    >
                        <i className={`bi ${item.icon} fs-4`}></i>
                        <div style={{ fontSize: '0.75rem' }}>{item.label}</div>
                        {isActive && <div style={{ height: '2px', width: '100%', backgroundColor: 'orange', marginTop: '2px' }} />}
                    </button>
                );
            })}
        </nav>
    );
}

export default NavbarInferior;
