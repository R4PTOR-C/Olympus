import React, { useEffect } from 'react';
import '../../styles/ModalSucesso.css'

const ModalSucesso = ({ show, mensagem = "Treino finalizado!" }) => {
    if (!show) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', zIndex: 1050 }}
        >
            <div className="bg-white rounded shadow p-4 text-center" style={{ maxWidth: '300px', width: '90%' }}>
                <svg viewBox="0 0 52 52" width="100" height="100" className="checkmark animated-check">
                    <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" />
                    <path className="checkmark__check" fill="none" d="M14 27l7 7 16-16" />
                </svg>
                <h5 className="mt-3">{mensagem}</h5>
            </div>
        </div>
    );
};

export default ModalSucesso;
