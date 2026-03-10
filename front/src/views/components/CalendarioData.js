import React, { useState, useRef, useEffect } from 'react';

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

/* Normaliza qualquer string de data para YYYY-MM-DD */
export function normalizarData(val) {
    if (!val) return '';
    if (typeof val === 'string' && val.includes('T')) return val.split('T')[0];
    return val;
}

/* Monta grade de 42 células (6 semanas) para o mês */
function gerarGrade(ano, mes) {
    const primeiro   = new Date(ano, mes, 1).getDay();   // 0=Dom
    const diasNoMes  = new Date(ano, mes + 1, 0).getDate();
    const diasAntMes = new Date(ano, mes, 0).getDate();

    const cells = [];
    // dias do mês anterior
    for (let i = primeiro - 1; i >= 0; i--) {
        cells.push({ dia: diasAntMes - i, mes: mes - 1, ano: mes === 0 ? ano - 1 : ano, atual: false });
    }
    // dias do mês atual
    for (let d = 1; d <= diasNoMes; d++) {
        cells.push({ dia: d, mes, ano, atual: true });
    }
    // dias do próximo mês
    let prox = 1;
    while (cells.length < 42) {
        cells.push({ dia: prox++, mes: mes + 1, ano: mes === 11 ? ano + 1 : ano, atual: false });
    }
    return cells;
}

function toISO({ dia, mes, ano }) {
    return `${ano}-${String(mes + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
}

export default function CalendarioData({ value, onChange }) {
    const hoje    = new Date();
    const inicial = value ? new Date(value + 'T12:00:00') : hoje;

    const [viewAno,      setViewAno]      = useState(inicial.getFullYear());
    const [viewMes,      setViewMes]      = useState(inicial.getMonth());
    const [anoPickerOn,  setAnoPickerOn]  = useState(false);
    const anoRef = useRef(null);

    const selecionada = value || '';
    const hojeISO     = toISO({ dia: hoje.getDate(), mes: hoje.getMonth(), ano: hoje.getFullYear() });

    /* Scroll do ano selecionado ao abrir o picker */
    useEffect(() => {
        if (anoPickerOn && anoRef.current) {
            const btn = anoRef.current.querySelector('.cal-year-btn.sel');
            btn?.scrollIntoView({ block: 'center' });
        }
    }, [anoPickerOn]);

    const grade = gerarGrade(viewAno, viewMes);

    const irMesAnterior = () => {
        if (viewMes === 0) { setViewMes(11); setViewAno(y => y - 1); }
        else setViewMes(m => m - 1);
    };
    const irProximoMes = () => {
        if (viewMes === 11) { setViewMes(0); setViewAno(y => y + 1); }
        else setViewMes(m => m + 1);
    };

    const handleDia = (cell) => {
        const iso = toISO(cell);
        onChange(iso);
        if (!cell.atual) {
            setViewAno(cell.ano);
            setViewMes(cell.mes < 0 ? 11 : cell.mes > 11 ? 0 : cell.mes);
        }
    };

    const anos = [];
    for (let y = 1930; y <= hoje.getFullYear(); y++) anos.push(y);

    return (
        <div className="cal-wrap">

            {/* ── NAV CABEÇALHO ── */}
            <div className="cal-nav">
                <button className="cal-arrow" onClick={irMesAnterior} aria-label="Mês anterior">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                </button>

                <div className="cal-nav-center">
                    <span className="cal-mes">{MESES[viewMes]}</span>
                    <button
                        className={`cal-ano${anoPickerOn ? ' open' : ''}`}
                        onClick={() => setAnoPickerOn(v => !v)}
                    >
                        {viewAno}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d={anoPickerOn ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}/>
                        </svg>
                    </button>
                </div>

                <button className="cal-arrow" onClick={irProximoMes} aria-label="Próximo mês">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
            </div>

            {/* ── YEAR PICKER ── */}
            {anoPickerOn && (
                <div className="cal-year-picker" ref={anoRef}>
                    {anos.map(y => (
                        <button
                            key={y}
                            className={`cal-year-btn${y === viewAno ? ' sel' : ''}`}
                            onClick={() => { setViewAno(y); setAnoPickerOn(false); }}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            )}

            {!anoPickerOn && (
                <>
                    {/* ── CABEÇALHO DOS DIAS ── */}
                    <div className="cal-grid cal-weekdays">
                        {DIAS_SEMANA.map(d => (
                            <div key={d} className="cal-wd">{d}</div>
                        ))}
                    </div>

                    {/* ── GRADE DE DIAS ── */}
                    <div className="cal-grid cal-days">
                        {grade.map((cell, i) => {
                            const iso   = toISO(cell);
                            const isSel = iso === selecionada;
                            const isHoj = iso === hojeISO;
                            let cls = 'cal-day';
                            if (!cell.atual) cls += ' other';
                            if (isSel)       cls += ' sel';
                            else if (isHoj)  cls += ' hoje';
                            return (
                                <button key={i} className={cls} onClick={() => handleDia(cell)}>
                                    {cell.dia}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
