import React, { useState, useEffect } from 'react';
import Model from 'react-body-highlighter';

const MUSCLE_MAP = {
    'Peitoral':    { anterior: ['chest'],           posterior: [] },
    'Bíceps':      { anterior: ['biceps'],          posterior: [] },
    'Tríceps':     { anterior: [],                  posterior: ['triceps'] },
    'Costas':      { anterior: [],                  posterior: ['upper-back', 'lower-back'] },
    'Ombros':      { anterior: ['front-deltoids'],  posterior: ['back-deltoids'] },
    'Pernas':      { anterior: ['quadriceps'],      posterior: ['hamstring', 'gluteal'] },
    'Abdômen':     { anterior: ['abs'],             posterior: [] },
    'Panturrilha': { anterior: ['calves'],          posterior: ['calves'] },
};

const COLORS = ['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#e53e3e', '#dc2626', '#ff1744', '#ff0000', '#ff3d00'];

function seriesToFreq(series) {
    if (series <= 0)  return 0;
    if (series <= 10) return 1;
    if (series <= 20) return 2;
    if (series <= 30) return 3;
    if (series <= 40) return 5;
    if (series <= 60) return 7;
    return 9;
}

function buildModelData(dados) {
    const anterior = [];
    const posterior = [];
    Object.entries(MUSCLE_MAP).forEach(([nome, { anterior: ant, posterior: pos }]) => {
        const freq = seriesToFreq(dados[nome] || 0);
        if (freq === 0) return;
        if (ant.length > 0) anterior.push({ name: nome, muscles: ant, frequency: freq });
        if (pos.length > 0) posterior.push({ name: nome, muscles: pos, frequency: freq });
    });
    return { anterior, posterior };
}

export default function CorpoMuscular({ dados = {} }) {
    const { anterior, posterior } = buildModelData(dados);
    const [visible, setVisible] = useState(false);
    const [tooltip, setTooltip] = useState(null);

    // fade-in ao montar
    useEffect(() => {
        const t = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(t);
    }, []);

    const handleClick = ({ muscle, data }) => {
        if (!data || !data.exercises?.length) return;
        const nome = data.exercises[0];
        const series = dados[nome] || 0;
        setTooltip({ nome, series });
        setTimeout(() => setTooltip(null), 2500);
    };

    return (
        <div style={{ ...styles.container, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(10px)' }}>
            <style>{`@keyframes fadeSlide { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

            {/* Divisor com título */}
            <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerText}>Visão Corporal</span>
                <div style={styles.dividerLine} />
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div style={styles.tooltip}>
                    <span style={styles.tooltipNome}>{tooltip.nome}</span>
                    <span style={styles.tooltipSeries}>{tooltip.series} séries</span>
                </div>
            )}

            {/* Modelos frente / costas */}
            <div style={styles.modelsRow}>
                <div style={styles.modelWrap}>
                    <div style={styles.label}>Frente</div>
                    <Model
                        data={anterior}
                        highlightedColors={COLORS}
                        bodyColor="#6b6b8a"
                        onClick={handleClick}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={styles.modelWrap}>
                    <div style={styles.label}>Costas</div>
                    <Model
                        data={posterior}
                        highlightedColors={COLORS}
                        bodyColor="#6b6b8a"
                        type="posterior"
                        onClick={handleClick}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Legenda gradiente */}
            <div style={styles.legend}>
                <span style={styles.legendLabel}>Baixo</span>
                <div style={styles.gradientBar} />
                <span style={styles.legendLabel}>Alto</span>
            </div>
        </div>
    );
}

const styles = {
    container: {
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        paddingBottom: 4,
    },
    divider: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px 8px',
    },
    dividerLine: {
        flex: 1,
        height: 1,
        background: 'var(--h-border, rgba(255,255,255,0.07))',
    },
    dividerText: {
        fontSize: 10,
        color: 'var(--h-text-muted, #4a4a6a)',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
    },
    tooltip: {
        margin: '0 16px 8px',
        background: '#1e1e30',
        border: '1px solid #ef4444',
        borderRadius: 10,
        padding: '7px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        animation: 'fadeSlide 0.2s ease',
    },
    tooltipNome: {
        fontSize: 13,
        color: '#e8edf5',
        fontWeight: 600,
    },
    tooltipSeries: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: 700,
    },
    modelsRow: {
        display: 'flex',
        gap: 8,
        padding: '0 8px',
    },
    modelWrap: {
        flex: 1,
    },
    label: {
        textAlign: 'center',
        fontSize: 10,
        color: 'var(--h-text-muted, #4a4a6a)',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    legend: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 24px 4px',
    },
    legendLabel: {
        fontSize: 10,
        color: 'var(--h-text-muted, #4a4a6a)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
    },
    gradientBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        background: 'linear-gradient(to right, #fecaca, #ef4444, #ff0000, #ff3d00)',
    },
};
