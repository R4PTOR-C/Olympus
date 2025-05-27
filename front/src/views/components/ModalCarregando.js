// components/ModalCarregando.js
import React from 'react';
import '../../styles/ModalCarregando.css' // 👈 certifique-se de ter esse CSS criado
import loadingGif from '../../imgs/muscle.gif';


const ModalCarregando = ({ show }) => {
    if (!show) return null;

    return (
        <div className="modal-backdrop show" style={{ zIndex: 1050 }}>
            <div
                className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            >
                <div className="bg-white p-4 rounded d-flex flex-column align-items-center">
                    <img
                        src={loadingGif}
                        alt="Carregando..."
                        className="braco-loading mb-3"
                        width="80"
                        height="80"
                    />

                    <p className="mb-0">Carregando...</p>
                </div>
            </div>
        </div>
    );
};

export default ModalCarregando;
