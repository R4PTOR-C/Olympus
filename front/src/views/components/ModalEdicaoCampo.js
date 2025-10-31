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

    const aplicarMascaraTelefone = (valor) => {
        if (!valor) return '';

        // remove tudo que não for número
        let digitos = valor.replace(/\D/g, '');

        if (digitos.length > 11) digitos = digitos.substring(0, 11);

        // aplica a máscara conforme o tamanho
        if (digitos.length <= 10) {
            return digitos.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, function(_, ddd, parte1, parte2) {
                return [
                    ddd ? `(${ddd}` + (ddd.length === 2 ? ') ' : '') : '',
                    parte1,
                    parte2 ? '-' + parte2 : ''
                ].join('');
            });
        } else {
            return digitos.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, function(_, ddd, parte1, parte2) {
                return [
                    ddd ? `(${ddd}` + (ddd.length === 2 ? ') ' : '') : '',
                    parte1,
                    parte2 ? '-' + parte2 : ''
                ].join('');
            });
        }
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
                            value={campo.name === "telefone" ? aplicarMascaraTelefone(valor) : valor}
                            onChange={(e) => {
                                let novoValor = e.target.value;
                                if (campo.name === "telefone") {
                                    novoValor = aplicarMascaraTelefone(novoValor);
                                }
                                setValor(novoValor);
                            }}
                            className="form-control"
                        />

                    )}
                </div>

                <div className="bottom-sheet-footer d-flex justify-content-end gap-2">
                    <button className="btn-olympus outline sm" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn-olympus sm" onClick={handleSalvar}>
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalEdicaoCampo;
