import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';

const normalize = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/**
 * LocationPicker — campo único de localização com bottom sheet.
 *
 * Modo autônomo (padrão): renderiza trigger button + gerencia open state internamente.
 *   Props: estado, cidade, onEstadoChange, onCidadeChange
 *
 * Modo controlado: sheet aberta/fechada pelo pai, sem trigger button.
 *   Props: isOpen, onClose, onSelect(estado, cidade)
 *   (estado/cidade opcionais para marcar o item selecionado na lista)
 */
const LocationPicker = ({
    estado = '',
    cidade = '',
    onEstadoChange,
    onCidadeChange,
    onSelect,
    isOpen: isOpenProp,
    onClose: onCloseProp,
}) => {
    const isControlled = isOpenProp !== undefined;

    const [municipios, setMunicipios] = useState([]);
    const [loadingMunicipios, setLoadingMunicipios] = useState(true);
    const [openInternal, setOpenInternal] = useState(false);
    const [search, setSearch] = useState('');
    const searchRef = useRef(null);

    const open = isControlled ? isOpenProp : openInternal;

    const closeSheet = () => {
        if (isControlled) onCloseProp?.();
        else setOpenInternal(false);
    };

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome')
            .then(r => r.json())
            .then(data => { setMunicipios(data); setLoadingMunicipios(false); })
            .catch(() => setLoadingMunicipios(false));
    }, []);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
            setTimeout(() => searchRef.current?.focus(), 80);
        } else {
            document.body.style.overflow = '';
            setSearch('');
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    const filtered = useMemo(() => {
        const q = normalize(search.trim());
        if (!q) return [];
        return municipios
            .filter(m => normalize(m.nome).includes(q))
            .slice(0, 60);
    }, [search, municipios]);

    const handleSelect = (municipio) => {
        const uf = municipio.microrregiao.mesorregiao.UF.sigla;
        onEstadoChange?.(uf);
        onCidadeChange?.(municipio.nome);
        onSelect?.(uf, municipio.nome);
        closeSheet();
    };

    const displayValue = cidade && estado ? `${cidade} — ${estado}` : '';

    const sheet = open && ReactDOM.createPortal(
        <div className="lp-overlay" onMouseDown={closeSheet}>
            <div className="lp-sheet" onMouseDown={e => e.stopPropagation()}>

                {/* Handle */}
                <div className="lp-sheet-handle-wrap">
                    <div className="lp-sheet-handle" />
                </div>

                {/* Busca */}
                <div className="lp-sheet-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(200,209,208,0.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        ref={searchRef}
                        className="lp-sheet-search"
                        placeholder="Digite o nome da cidade..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search ? (
                        <button type="button" className="lp-sheet-clear" onClick={() => setSearch('')}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    ) : (
                        <button type="button" className="lp-sheet-close" onClick={closeSheet}>
                            Fechar
                        </button>
                    )}
                </div>

                {/* Lista */}
                <div className="lp-sheet-list">
                    {!search.trim() ? (
                        <div className="lp-sheet-hint">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(200,209,208,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <p>Digite o nome da cidade para buscar</p>
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map(m => {
                            const uf = m.microrregiao.mesorregiao.UF.sigla;
                            const selected = cidade === m.nome && estado === uf;
                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    className={`lp-sheet-option${selected ? ' lp-sheet-option--selected' : ''}`}
                                    onClick={() => handleSelect(m)}
                                >
                                    <span className="lp-sheet-cidade">{m.nome}</span>
                                    <span className="lp-sheet-uf">{uf}</span>
                                </button>
                            );
                        })
                    ) : (
                        <div className="lp-sheet-empty">Nenhuma cidade encontrada</div>
                    )}
                </div>

            </div>
        </div>,
        document.body
    );

    // Modo controlado: só renderiza o sheet (portal), sem trigger
    if (isControlled) return sheet;

    // Modo autônomo: renderiza trigger + sheet
    return (
        <div className="auth-field">
            <label className="auth-label">Localização</label>
            <button
                type="button"
                className={`lp-trigger${open ? ' lp-trigger--open' : ''}`}
                onClick={() => !loadingMunicipios && setOpenInternal(true)}
                disabled={loadingMunicipios}
            >
                {loadingMunicipios ? (
                    <span className="lp-placeholder lp-loading">
                        <span className="lp-spinner" />
                        Carregando cidades...
                    </span>
                ) : displayValue ? (
                    <span className="lp-value">{displayValue}</span>
                ) : (
                    <span className="lp-placeholder">Ex: São Paulo, Belo Horizonte...</span>
                )}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.35 }}>
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </button>
            {sheet}
        </div>
    );
};

export default LocationPicker;
