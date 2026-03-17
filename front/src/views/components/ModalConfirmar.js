import React from 'react';
import '../../styles/ModalConfirmar.css';

const ModalConfirmar = ({ titulo, mensagem, labelConfirmar = 'Confirmar', labelCancelar = 'Cancelar', onConfirmar, onCancelar, perigoso = false }) => (
    <div className="mcf-overlay" onClick={onCancelar}>
        <div className="mcf-sheet" onClick={e => e.stopPropagation()}>
            <h2 className="mcf-title">{titulo}</h2>
            <p className="mcf-text">{mensagem}</p>
            <div className="mcf-actions">
                <button className="mcf-btn-cancel" onClick={onCancelar}>{labelCancelar}</button>
                <button className={`mcf-btn-confirm${perigoso ? ' perigoso' : ''}`} onClick={onConfirmar}>{labelConfirmar}</button>
            </div>
        </div>
    </div>
);

export default ModalConfirmar;
