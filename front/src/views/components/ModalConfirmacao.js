import React from "react";

export default function ModalConfirmacao({ show, onClose, onConfirm, titulo, mensagem }) {
    if (!show) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded shadow p-4" style={{ width: "90%", maxWidth: 400 }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="mb-0">{titulo}</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                {/* Corpo */}
                <p>{mensagem}</p>

                {/* Ações */}
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-outline-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
