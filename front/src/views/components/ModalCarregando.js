import React from 'react';
import '../../styles/ModalCarregando.css';

const ModalCarregando = ({ show }) => {
    if (!show) return null;

    return (
        <div className="mc-overlay">
            <svg className="mc-spinner" viewBox="0 0 44 44" fill="none">
                <circle className="mc-spinner-track" cx="22" cy="22" r="18" strokeWidth="3.5" />
                <circle className="mc-spinner-arc"   cx="22" cy="22" r="18" strokeWidth="3.5" />
            </svg>
            <span className="mc-label">Carregando</span>
        </div>
    );
};

export default ModalCarregando;
