import React, { useState, useEffect } from 'react';
import '../../styles/ModalEdicaoCampo.css';

const ModalEdicaoCampo = ({ campo, valorAtual, onClose, onSave }) => {
    const [valor, setValor] = useState(valorAtual || '');

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleSalvar = () => {
        onSave(campo.name, valor);
    };

    return (
        <div className="bottom-sheet-backdrop" onClick={onClose}>
            <div
                className="bottom-sheet card shadow-lg"
                onClick={(e) => e.stopPropagation()} // evita fechar ao clicar dentro
            >
                <div className="bottom-sheet-header d-flex justify-content-between align-items-center">
                    <h5 className="m-0">Editar {campo.label}</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                <div className="bottom-sheet-body">
                    <label className="form-label">{campo.label}</label>
                    {campo.tipo === 'select' ? (
                        <select
                            className="form-select"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                        >
                            <option value="">Selecione</option>
                            {campo.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type={campo.tipo}
                            className="form-control"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                        />
                    )}
                </div>

                <div className="bottom-sheet-footer d-flex justify-content-end gap-2">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn btn-primary" onClick={handleSalvar}>
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalEdicaoCampo;
