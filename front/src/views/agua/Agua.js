import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../AuthContext';

const calcularMeta = (peso) => Math.round((peso * 35) / 50) * 50;
const OPCOES = [150, 200, 300, 500];

// ── Garrafa SVG ───────────────────────────────────────────────────────────────

const BOTTLE_TOP    = 52;
const BOTTLE_BOTTOM = 228;
const LIQUID_HEIGHT = BOTTLE_BOTTOM - BOTTLE_TOP;
const BOTTLE_PATH   = "M38 8 L38 18 Q22 28 20 48 L18 220 Q18 232 30 232 L70 232 Q82 232 82 220 L80 48 Q78 28 62 18 L62 8 Z";
const CAP_PATH      = "M36 4 Q36 0 50 0 Q64 0 64 4 L64 8 L36 8 Z";

function GarrafaAgua({ percentual }) {
    const pct = Math.min(Math.max(percentual, 0), 1);
    const targetY = BOTTLE_TOP + LIQUID_HEIGHT * (1 - pct);

    const waterRectRef = useRef(null);
    const shineRectRef = useRef(null);
    const wavePathRef  = useRef(null);
    const textRef      = useRef(null);

    const currentYRef = useRef(BOTTLE_BOTTOM); // start empty
    const targetYRef  = useRef(targetY);
    const phaseRef    = useRef(0);
    const frameRef    = useRef(null);

    // Keep target ref in sync with prop
    useEffect(() => {
        targetYRef.current = targetY;
    }, [targetY]);

    // Single rAF loop: lerp water level + animate wave
    useEffect(() => {
        const tick = () => {
            // Lerp towards target (ease-out)
            const cur = currentYRef.current;
            const tgt = targetYRef.current;
            const next = Math.abs(cur - tgt) < 0.05 ? tgt : cur + (tgt - cur) * 0.06;
            currentYRef.current = next;

            const y = next;
            const fillH = Math.max(BOTTLE_BOTTOM - y + 10, 0);

            if (waterRectRef.current) {
                waterRectRef.current.setAttribute('y', y);
                waterRectRef.current.setAttribute('height', fillH);
            }
            if (shineRectRef.current) {
                shineRectRef.current.setAttribute('y', y + 6);
                shineRectRef.current.setAttribute('height', Math.max(BOTTLE_BOTTOM - y - 12, 0));
            }

            // Wave
            phaseRef.current += 0.05;
            if (wavePathRef.current) {
                if (y < BOTTLE_BOTTOM - 4 && y > BOTTLE_TOP) {
                    const phase = phaseRef.current;
                    let d = `M 18 ${y}`;
                    for (let x = 18; x <= 82; x += 2) {
                        d += ` L ${x} ${y + Math.sin(x * 0.18 + phase) * 1.8}`;
                    }
                    d += ` L 82 ${BOTTLE_BOTTOM} L 18 ${BOTTLE_BOTTOM} Z`;
                    wavePathRef.current.setAttribute('d', d);
                    wavePathRef.current.setAttribute('display', '');
                } else {
                    wavePathRef.current.setAttribute('display', 'none');
                }
            }

            // Percentage text
            if (textRef.current) {
                const animPct = Math.round((1 - (y - BOTTLE_TOP) / LIQUID_HEIGHT) * 100);
                const clamped = Math.max(0, Math.min(100, animPct));
                textRef.current.textContent = `${clamped}%`;
                const textY = Math.max(y + (BOTTLE_BOTTOM - y) / 2 + 5, BOTTLE_BOTTOM - 8);
                textRef.current.setAttribute('y', textY);
                textRef.current.setAttribute('display', clamped >= 15 ? '' : 'none');
            }

            frameRef.current = requestAnimationFrame(tick);
        };

        frameRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameRef.current);
    }, []);

    return (
        <svg viewBox="0 0 100 260" style={{ width: 120, height: 300, overflow: 'visible' }}>
            <defs>
                <clipPath id="bottle-liquid-clip">
                    <path d={BOTTLE_PATH} />
                </clipPath>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6EB0F5" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#2166b0" stopOpacity="1" />
                </linearGradient>
                <linearGradient id="bottleGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(74,144,217,0.08)" />
                    <stop offset="40%" stopColor="rgba(74,144,217,0.18)" />
                    <stop offset="100%" stopColor="rgba(74,144,217,0.06)" />
                </linearGradient>
            </defs>

            {/* Bottle glass fill */}
            <path d={BOTTLE_PATH} fill="url(#bottleGrad)" />

            {/* Liquid group, clipped to bottle shape */}
            <g clipPath="url(#bottle-liquid-clip)">
                <rect ref={waterRectRef} x="0" y={BOTTLE_BOTTOM} width="100" height="0" fill="url(#waterGrad)" />
                <path ref={wavePathRef}  fill="rgba(110,176,245,0.45)" display="none" />
                <rect ref={shineRectRef} x="26" y={BOTTLE_BOTTOM} width="6" height="0" rx="3" fill="rgba(255,255,255,0.15)" />
            </g>

            {/* Bottle outline */}
            <path d={BOTTLE_PATH} fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="1.5" />

            {/* Glass shine */}
            <path d="M28 55 Q26 100 27 150" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" />

            {/* Cap */}
            <path d={CAP_PATH} fill="rgba(74,144,217,0.5)" stroke="rgba(74,144,217,0.7)" strokeWidth="1" />

            {/* Percentage */}
            <text
                ref={textRef}
                x="50"
                y={BOTTLE_BOTTOM - 8}
                textAnchor="middle"
                fill="rgba(255,255,255,0.85)"
                fontSize="13"
                fontFamily="'Bebas Neue', sans-serif"
                letterSpacing="0.05em"
                display="none"
            />
        </svg>
    );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function Agua() {
    const { userId } = useContext(AuthContext);
    const token = localStorage.getItem('token');

    const [consumido,    setConsumido]    = useState(0);
    const [registros,    setRegistros]    = useState([]);
    const [meta,         setMeta]         = useState(2500);
    const [metaBase,     setMetaBase]     = useState(2500); // meta calculada pelo peso
    const [customMl,     setCustomMl]     = useState('');
    const [editandoMeta, setEditandoMeta] = useState(false);
    const [metaInput,    setMetaInput]    = useState('');
    const metaEditRef = useRef(null);

    const percentual = consumido / meta;
    const restante   = Math.max(meta - consumido, 0);

    // Carrega dados do dia
    useEffect(() => {
        if (!userId) return;
        fetch(`${process.env.REACT_APP_API_BASE_URL}/agua/usuarios/${userId}/hoje`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                setConsumido(data.total || 0);
                setMeta(data.meta || 2500);
                setMetaBase(data.meta || 2500);
                setRegistros((data.registros || []).map(r => ({
                    id:   r.id,
                    ml:   r.ml,
                    hora: new Date(r.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                })).reverse());
            })
            .catch(() => {});
    }, [userId, token]);

    const abrirEdicaoMeta = () => {
        setMetaInput(String(meta));
        setEditandoMeta(true);
        setTimeout(() => metaEditRef.current?.select(), 50);
    };

    const confirmarMeta = async () => {
        const val = parseInt(metaInput, 10);
        if (val >= 500 && val <= 6000) {
            setMeta(val);
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/agua/usuarios/${userId}/meta`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ meta_agua_ml: val }),
            }).catch(() => {});
        }
        setEditandoMeta(false);
    };

    const adicionar = async (ml) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/agua/usuarios/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ml }),
            });
            if (!res.ok) return;
            const novo = await res.json();
            setConsumido(prev => Math.min(prev + ml, meta));
            setRegistros(prev => [{
                id:   novo.id,
                ml:   novo.ml,
                hora: new Date(novo.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            }, ...prev]);
        } catch {}
    };

    const removerUltimo = async () => {
        if (registros.length === 0) return;
        const [ultimo, ...resto] = registros;
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/agua/registros/${ultimo.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setConsumido(prev => Math.max(prev - ultimo.ml, 0));
            setRegistros(resto);
        } catch {}
    };

    const handleCustom = () => {
        const ml = parseInt(customMl, 10);
        if (!ml || ml <= 0) return;
        adicionar(ml);
        setCustomMl('');
    };

    const metaAtingida = consumido >= meta;

    return (
        <div style={S.page}>
            <div style={S.card}>

                {/* Header */}
                <div style={S.header}>
                    <div>
                        <span style={S.titulo}>Hidratação</span>
                        <p style={S.subtitulo}>Registre seu consumo de água ao longo do dia</p>
                    </div>
                    <span style={S.data}>{new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
                </div>

                {/* Garrafa + stats */}
                <div style={S.hero}>
                    <div style={S.bottleWrap}>
                        {metaAtingida && <div style={S.metaBadge}>Meta atingida!</div>}
                        <GarrafaAgua percentual={percentual} />
                    </div>

                    <div style={S.stats}>
                        <div style={S.statBlock}>
                            <span style={S.statVal}>{consumido}</span>
                            <span style={S.statLbl}>ml consumidos</span>
                        </div>
                        <div style={S.statDivider} />
                        <div style={S.statBlock}>
                            <span style={{ ...S.statVal, color: metaAtingida ? '#48BB78' : '#E8EDF5' }}>{restante}</span>
                            <span style={S.statLbl}>ml restantes</span>
                        </div>
                        <div style={S.statDivider} />
                        <div style={{ ...S.statBlock, cursor: 'pointer' }} onClick={abrirEdicaoMeta}>
                            <span style={S.statVal}>
                                {meta}
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 4, verticalAlign: 'middle' }}>
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                            </span>
                            <span style={S.statLbl}>
                                ml meta
                                {meta === metaBase && (
                                    <span style={S.metaHint}> · calculado pelo peso</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Painel de edição da meta */}
                {editandoMeta && (
                    <div style={S.metaPanel}>
                        <div style={S.metaPanelTop}>
                            <span style={S.metaPanelLabel}>Meta diária</span>
                            <span style={S.metaPanelHint}>entre 500 e 6000 ml</span>
                        </div>
                        <div style={S.metaPanelRow}>
                            <div style={S.metaPanelInputWrap}>
                                <input
                                    ref={metaEditRef}
                                    type="number"
                                    inputMode="numeric"
                                    value={metaInput}
                                    onChange={e => setMetaInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && confirmarMeta()}
                                    style={S.metaPanelInput}
                                />
                                <span style={S.metaPanelUnit}>ml</span>
                            </div>
                            <button style={S.metaPanelConfirm} onClick={confirmarMeta}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </button>
                            <button style={S.metaPanelCancel} onClick={() => setEditandoMeta(false)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        {meta === metaBase && (
                            <span style={S.metaPanelSugestao}>
                                Meta atual calculada pelo seu peso: {metaBase} ml
                            </span>
                        )}
                    </div>
                )}

                {/* Botões rápidos */}
                <div style={S.sectionLabel}>Adicionar</div>
                <div style={S.btnGrid}>
                    {OPCOES.map(ml => (
                        <button key={ml} style={S.btnOpcao} onClick={() => adicionar(ml)}>
                            <span style={S.btnMl}>{ml}</span>
                            <span style={S.btnUnit}>ml</span>
                        </button>
                    ))}
                </div>

                {/* Custom input */}
                <div style={S.customRow}>
                    <input
                        type="number"
                        inputMode="numeric"
                        placeholder="Outro valor (ml)"
                        value={customMl}
                        onChange={e => setCustomMl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCustom()}
                        style={S.customInput}
                    />
                    <button style={S.btnAdd} onClick={handleCustom}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                    </button>
                </div>

                {/* Histórico do dia */}
                {registros.length > 0 && (
                    <>
                        <div style={{ ...S.sectionLabel, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Hoje</span>
                            <button style={S.btnDesfazer} onClick={removerUltimo}>
                                desfazer último
                            </button>
                        </div>
                        <div style={S.timeline}>
                            {registros.map((r, i) => (
                                <div key={i} style={S.timelineItem}>
                                    <div style={S.timelineDot} />
                                    <span style={S.timelineHora}>{r.hora}</span>
                                    <span style={S.timelineMl}>+{r.ml} ml</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
    page: {
        minHeight: '100dvh',
        background: '#0E1117',
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px 80px',
        fontFamily: "'Barlow', sans-serif",
    },
    card: {
        width: '100%',
        maxWidth: 420,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titulo: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.8rem',
        color: '#E8EDF5',
        letterSpacing: '0.05em',
    },
    subtitulo: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.78rem',
        color: 'rgba(232,237,245,0.35)',
        margin: '2px 0 0',
        lineHeight: 1.4,
    },
    data: {
        fontSize: '0.8rem',
        color: 'rgba(232,237,245,0.35)',
        textTransform: 'capitalize',
    },
    hero: {
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        marginBottom: 28,
        padding: '20px',
        background: '#151B26',
        borderRadius: 20,
        border: '1px solid rgba(74,144,217,0.12)',
    },
    bottleWrap: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    metaBadge: {
        position: 'absolute',
        top: -10,
        background: '#48BB78',
        color: '#fff',
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
    },
    stats: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    statBlock: {
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    statVal: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.6rem',
        color: '#4A90D9',
        lineHeight: 1,
        letterSpacing: '0.03em',
    },
    statLbl: {
        fontSize: '0.7rem',
        color: 'rgba(232,237,245,0.35)',
        letterSpacing: '0.04em',
    },
    statDivider: {
        height: 1,
        background: 'rgba(255,255,255,0.06)',
    },
    sectionLabel: {
        fontSize: '0.72rem',
        fontWeight: 700,
        color: 'rgba(232,237,245,0.35)',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    btnGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 10,
    },
    btnOpcao: {
        background: '#151B26',
        border: '1.5px solid rgba(74,144,217,0.2)',
        borderRadius: 14,
        padding: '14px 8px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        transition: 'all 0.15s',
        WebkitTapHighlightColor: 'transparent',
    },
    btnMl: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.4rem',
        color: '#E8EDF5',
        lineHeight: 1,
    },
    btnUnit: {
        fontSize: '0.65rem',
        color: 'rgba(232,237,245,0.35)',
        letterSpacing: '0.05em',
    },
    customRow: {
        display: 'flex',
        gap: 10,
        marginTop: 4,
    },
    customInput: {
        flex: 1,
        background: '#151B26',
        border: '1.5px solid rgba(255,255,255,0.08)',
        borderRadius: 14,
        padding: '13px 16px',
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.95rem',
        color: '#E8EDF5',
        outline: 'none',
    },
    btnAdd: {
        background: '#4A90D9',
        border: 'none',
        borderRadius: 14,
        width: 50,
        cursor: 'pointer',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 16px rgba(74,144,217,0.3)',
    },
    metaHint: {
        color: 'rgba(74,144,217,0.5)',
        fontSize: '0.65rem',
    },
    metaPanel: {
        background: '#151B26',
        border: '1.5px solid rgba(74,144,217,0.25)',
        borderRadius: 16,
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
    },
    metaPanelTop: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    metaPanelLabel: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '0.78rem',
        color: 'rgba(232,237,245,0.5)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    metaPanelHint: {
        fontSize: '0.7rem',
        color: 'rgba(232,237,245,0.2)',
    },
    metaPanelRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    metaPanelInputWrap: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        background: '#0E1117',
        border: '1.5px solid rgba(74,144,217,0.4)',
        borderRadius: 12,
        padding: '10px 14px',
        gap: 6,
    },
    metaPanelInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.5rem',
        color: '#E8EDF5',
        lineHeight: 1,
        minWidth: 0,
    },
    metaPanelUnit: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.75rem',
        color: 'rgba(232,237,245,0.3)',
        alignSelf: 'flex-end',
        paddingBottom: 2,
    },
    metaPanelConfirm: {
        background: '#4A90D9',
        border: 'none',
        borderRadius: 12,
        width: 44,
        height: 44,
        cursor: 'pointer',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 4px 14px rgba(74,144,217,0.3)',
    },
    metaPanelCancel: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12,
        width: 44,
        height: 44,
        cursor: 'pointer',
        color: 'rgba(232,237,245,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    metaPanelSugestao: {
        fontSize: '0.72rem',
        color: 'rgba(74,144,217,0.5)',
    },
    btnDesfazer: {
        background: 'none',
        border: 'none',
        color: 'rgba(232,237,245,0.25)',
        fontSize: '0.75rem',
        cursor: 'pointer',
        padding: 0,
        fontFamily: "'Barlow', sans-serif",
    },
    timeline: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
    },
    timelineItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
    },
    timelineDot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: '#4A90D9',
        flexShrink: 0,
    },
    timelineHora: {
        fontSize: '0.8rem',
        color: 'rgba(232,237,245,0.35)',
        minWidth: 36,
    },
    timelineMl: {
        fontSize: '0.9rem',
        color: '#E8EDF5',
        fontWeight: 600,
    },
};
