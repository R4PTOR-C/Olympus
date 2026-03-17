import React, { useState, useEffect } from 'react';
import CalendarioData, { normalizarData } from './CalendarioData';
import '../../styles/ModalEdicaoCampo.css';

const aplicarMascaraCref = (valor) => {
    const clean = valor.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    let result = '';
    for (let i = 0; i < clean.length && i < 9; i++) {
        if (i === 6) result += '-';
        if (i === 7) result += '/';
        result += clean[i];
    }
    return result;
};

const aplicarMascaraTelefone = (valor) => {
    if (!valor) return '';
    let digitos = valor.replace(/\D/g, '');
    if (digitos.length > 11) digitos = digitos.substring(0, 11);
    if (digitos.length <= 10) {
        return digitos.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, ddd, p1, p2) =>
            [ddd ? `(${ddd}` + (ddd.length === 2 ? ') ' : '') : '', p1, p2 ? '-' + p2 : ''].join('')
        );
    }
    return digitos.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, ddd, p1, p2) =>
        [ddd ? `(${ddd}` + (ddd.length === 2 ? ') ' : '') : '', p1, p2 ? '-' + p2 : ''].join('')
    );
};

/* Formata YYYY-MM-DD → "15 de março de 1990" */
const formatarDataExibicao = (iso) => {
    if (!iso) return null;
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
};

const ModalEdicaoCampo = ({ campo, valorAtual, onClose, onSave }) => {
    const valorInicial = campo.tipo === 'date'
        ? normalizarData(valorAtual)
        : (valorAtual || '');

    const [valor, setValor] = useState(valorInicial);

    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleChange = (e) => {
        let v = e.target.value;
        if (campo.name === 'telefone') v = aplicarMascaraTelefone(v);
        if (campo.name === 'cref') v = aplicarMascaraCref(v);
        setValor(v);
    };

    const isDate = campo.tipo === 'date';

    return (
        <div className="mec-overlay" onClick={onClose}>
            <div className="mec-sheet" onClick={e => e.stopPropagation()}>

                {/* ── HEADER ── */}
                <div className="mec-header">
                    <div className="mec-header-info">
                        <div className="mec-label">Editando</div>
                        <div className="mec-title">{campo.label}</div>
                        {isDate && valor && (
                            <div className="mec-date-preview">{formatarDataExibicao(valor)}</div>
                        )}
                    </div>
                    <button className="mec-close-btn" onClick={onClose} aria-label="Fechar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6"  y2="18"/>
                            <line x1="6"  y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* ── BODY ── */}
                <div className="mec-body">
                    {isDate ? (
                        <CalendarioData value={valor} onChange={setValor} />
                    ) : campo.tipo === 'select' ? (
                        <div className="mec-select-wrap">
                            <select
                                className="mec-select"
                                value={valor}
                                onChange={handleChange}
                            >
                                <option value="">Selecione</option>
                                {campo.options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <input
                            type={campo.tipo}
                            className="mec-input"
                            value={campo.name === 'telefone' ? aplicarMascaraTelefone(valor) : campo.name === 'cref' ? aplicarMascaraCref(valor) : valor}
                            onChange={handleChange}
                            autoFocus
                        />
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="mec-footer">
                    <button className="mec-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button
                        className="mec-btn-save"
                        onClick={() => onSave(campo.name, valor)}
                        disabled={isDate && !valor}
                    >
                        Salvar
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ModalEdicaoCampo;
