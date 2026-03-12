import React, { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import '../../styles/NavbarInferior.css';

function NavbarInferior() {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId, funcao } = useContext(AuthContext);

    const isActive = (path) => location.pathname.startsWith(path);

    const herculesActive = isActive('/hercules');
    const isProfessor = funcao === 'Professor';

    // ── Navbar do Professor ──
    if (isProfessor) {
        const leftItems = [
            {
                label: 'Alunos',
                path: '/usuarios',
                icon: (active) => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                ),
            },
            {
                label: 'Treinos',
                path: '/treinos',
                icon: (active) => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                ),
            },
        ];

        const rightItems = [
            {
                label: 'Mensagens',
                path: '/chat',
                icon: (active) => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                ),
            },
            {
                label: 'Perfil',
                path: `/professores/edit/${userId}`,
                icon: (active) => (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                ),
            },
        ];

        return (
            <nav className="nav-inferior d-md-none">
                {leftItems.map(item => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            className={`nav-inf-item${active ? ' active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon(active)}
                            <span className="nav-inf-label">{item.label}</span>
                        </button>
                    );
                })}

                {/* Botão central — Hércules */}
                <div className="nav-inf-center" onClick={() => navigate('/hercules')}>
                    <div className={`nav-inf-circle${herculesActive ? ' active' : ''}`}>
                        <img src="/hercules.png" alt="Hércules" className="nav-inf-hercules-img" />
                    </div>
                    <span className={`nav-inf-center-label${herculesActive ? ' active' : ''}`}>Hércules</span>
                </div>

                {rightItems.map(item => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            className={`nav-inf-item${active ? ' active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon(active)}
                            <span className="nav-inf-label">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        );
    }

    // ── Navbar do Aluno ──
    const leftItems = [
        {
            label: 'Home',
            path: `/home/${userId}`,
            icon: (active) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? '#4A90D9' : 'none'} stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
            ),
        },
        {
            label: 'Treinos',
            path: `/usuarios/view/${userId}`,
            icon: (active) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
            ),
        },
    ];

    const rightItems = [
        {
            label: 'Histórico',
            path: '/historico-exercicios',
            icon: (active) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
            ),
        },
        {
            label: 'Personal',
            path: '/procurar-professor',
            icon: (active) => (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#4A90D9' : '#3D4E6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            ),
        },
    ];

    return (
        <nav className="nav-inferior d-md-none">
            {leftItems.map(item => {
                const active = isActive(item.path);
                return (
                    <button
                        key={item.path}
                        className={`nav-inf-item${active ? ' active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon(active)}
                        <span className="nav-inf-label">{item.label}</span>
                    </button>
                );
            })}

            {/* Botão central — Hércules */}
            <div className="nav-inf-center" onClick={() => navigate('/hercules')}>
                <div className={`nav-inf-circle${herculesActive ? ' active' : ''}`}>
                    <img src="/hercules.png" alt="Hércules" className="nav-inf-hercules-img" />
                </div>
                <span className={`nav-inf-center-label${herculesActive ? ' active' : ''}`}>Hércules</span>
            </div>

            {rightItems.map(item => {
                const active = isActive(item.path);
                return (
                    <button
                        key={item.path}
                        className={`nav-inf-item${active ? ' active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        {item.icon(active)}
                        <span className="nav-inf-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

export default NavbarInferior;
