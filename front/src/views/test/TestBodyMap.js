import React, { useState } from 'react';
import Model from 'react-body-highlighter';

// Mapeamento: nome do banco → músculos da lib (anterior + posterior)
const MUSCLE_MAP = {
    'Peitoral':    { anterior: ['chest'],                   posterior: [] },
    'Bíceps':      { anterior: ['biceps'],                  posterior: [] },
    'Tríceps':     { anterior: [],                          posterior: ['triceps'] },
    'Costas':      { anterior: [],                          posterior: ['upper-back', 'lower-back'] },
    'Ombros':      { anterior: ['front-deltoids'],          posterior: ['back-deltoids'] },
    'Pernas':      { anterior: ['quadriceps'],              posterior: ['hamstring', 'gluteal'] },
    'Abdômen':     { anterior: ['abs'],                     posterior: [] },
    'Panturrilha': { anterior: ['calves'],                  posterior: ['calves'] },
};

const MUSCLES = Object.keys(MUSCLE_MAP);

// Converte séries/mês → frequência 1-9 (escala da lib)
function seriesToFreq(series) {
    if (series === 0) return 0;
    if (series <= 10) return 1;
    if (series <= 20) return 2;
    if (series <= 30) return 3;
    if (series <= 40) return 5;
    if (series <= 60) return 7;
    return 9;
}

function buildModelData(valores) {
    const anterior = [];
    const posterior = [];

    MUSCLES.forEach(nome => {
        const freq = seriesToFreq(valores[nome] || 0);
        if (freq === 0) return;
        const { anterior: ant, posterior: pos } = MUSCLE_MAP[nome];
        if (ant.length > 0) anterior.push({ name: nome, muscles: ant, frequency: freq });
        if (pos.length > 0) posterior.push({ name: nome, muscles: pos, frequency: freq });
    });

    return { anterior, posterior };
}

export default function TestBodyMap() {
    const [valores, setValores] = useState({
        'Peitoral': 0, 'Bíceps': 0, 'Tríceps': 0, 'Costas': 0,
        'Ombros': 0, 'Pernas': 0, 'Abdômen': 0, 'Panturrilha': 0,
    });
    const [tooltip, setTooltip] = useState(null);

    const { anterior, posterior } = buildModelData(valores);

    const handleClick = ({ muscle, data }) => {
        if (!data) return;
        setTooltip({ muscle, nome: data.name, series: valores[data.name] || 0 });
        setTimeout(() => setTooltip(null), 2000);
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.title}>Teste — Body Map</div>
                <div style={styles.subtitle}>react-body-highlighter</div>
            </div>

            {/* Corpo humano */}
            <div style={styles.bodyContainer}>
                <div style={styles.modelWrap}>
                    <div style={styles.modelLabel}>Frente</div>
                    <Model
                        data={anterior}
                        highlightedColors={['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#e53e3e', '#dc2626', '#ff1744', '#ff0000', '#ff3d00']}
                        onClick={handleClick}
                        style={{ width: '100%' }}
                    />
                </div>
                <div style={styles.modelWrap}>
                    <div style={styles.modelLabel}>Costas</div>
                    <Model
                        data={posterior}
                        highlightedColors={['#fecaca', '#fca5a5', '#f87171', '#ef4444', '#e53e3e', '#dc2626', '#ff1744', '#ff0000', '#ff3d00']}
                        type="posterior"
                        onClick={handleClick}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>

            {/* Tooltip click */}
            {tooltip && (
                <div style={styles.tooltip}>
                    <strong>{tooltip.nome}</strong> — {tooltip.series} séries
                </div>
            )}

            {/* Sliders de teste */}
            <div style={styles.sliders}>
                <div style={styles.slidersTitle}>Simular séries/mês</div>
                {MUSCLES.map(nome => (
                    <div key={nome} style={styles.sliderRow}>
                        <span style={styles.sliderLabel}>{nome}</span>
                        <input
                            type="range" min={0} max={100} step={5}
                            value={valores[nome]}
                            onChange={e => setValores(v => ({ ...v, [nome]: Number(e.target.value) }))}
                            style={styles.range}
                        />
                        <span style={styles.sliderValue}>{valores[nome]}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        background: '#0e0e1a',
        padding: '20px 16px 40px',
        fontFamily: 'system-ui, sans-serif',
        color: '#e8edf5',
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.6rem',
        letterSpacing: '0.06em',
        color: '#e8edf5',
    },
    subtitle: {
        fontSize: 11,
        color: '#ef4444',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginTop: 2,
    },
    bodyContainer: {
        display: 'flex',
        gap: 8,
        justifyContent: 'center',
        marginBottom: 20,
    },
    modelWrap: {
        flex: 1,
        maxWidth: 200,
        background: '#13131f',
        borderRadius: 16,
        padding: '12px 8px',
        border: '1px solid #1e1e30',
    },
    modelLabel: {
        textAlign: 'center',
        fontSize: 11,
        color: '#4a4a6a',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    tooltip: {
        background: '#1e1e30',
        border: '1px solid #ef4444',
        borderRadius: 10,
        padding: '8px 16px',
        textAlign: 'center',
        fontSize: 13,
        color: '#e8edf5',
        marginBottom: 16,
    },
    sliders: {
        background: '#13131f',
        borderRadius: 16,
        padding: '16px',
        border: '1px solid #1e1e30',
    },
    slidersTitle: {
        fontSize: 12,
        color: '#4a4a6a',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    sliderRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    sliderLabel: {
        fontSize: 13,
        color: '#9090b8',
        width: 90,
        flexShrink: 0,
    },
    range: {
        flex: 1,
        accentColor: '#ef4444',
    },
    sliderValue: {
        fontSize: 12,
        color: '#ef4444',
        fontWeight: 600,
        width: 28,
        textAlign: 'right',
    },
};
