import React, { useContext, useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { AuthContext } from '../../AuthContext';
import '../../styles/ModalHistorico.css';

const METRICS = [
    { key: 'maxCarga',    label: 'Carga Máx',  unit: 'kg',     deltaKey: 'deltaCarga'  },
    { key: 'totalVolume', label: 'Volume',      unit: 'kg·rep', deltaKey: 'deltaVolume' },
    { key: 'max1RM',      label: '1RM (Epley)', unit: 'kg',     deltaKey: 'delta1RM'    },
];

// Regressão linear simples para linha de tendência
function calcTrend(data, key) {
    const n = data.length;
    if (n < 2) return data.map(d => ({ ...d, trend: d[key] }));
    const ys    = data.map(d => d[key]);
    const sumX  = (n * (n - 1)) / 2;
    const sumY  = ys.reduce((a, b) => a + b, 0);
    const sumXY = ys.reduce((acc, y, i) => acc + i * y, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const slope     = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    return data.map((d, i) => ({ ...d, trend: +(intercept + slope * i).toFixed(1) }));
}

const CustomTooltip = ({ active, payload, label, metric }) => {
    if (!active || !payload?.length) return null;
    const point  = payload[0]?.payload;
    const val    = point?.[metric.key];
    const delta  = point?.[metric.deltaKey];
    const series = point?.seriesDetalhe || [];

    const deltaColor = delta == null ? null : delta > 0 ? '#2ECC71' : delta < 0 ? '#E84040' : '#6B7A99';
    const deltaSign  = delta > 0 ? '+' : '';

    return (
        <div style={{
            background: 'var(--h-surface)',
            border: '1px solid var(--h-border)',
            borderRadius: 10,
            padding: '10px 14px',
            boxShadow: 'var(--h-shadow)',
            minWidth: 140,
        }}>
            <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '0.62rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--h-text-dim)',
                marginBottom: 4,
            }}>
                {new Date(label + 'T12:00:00').toLocaleDateString('pt-BR')}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
                <span style={{
                    fontFamily: 'Bebas Neue, sans-serif',
                    fontSize: '1.3rem',
                    letterSpacing: '0.04em',
                    color: 'var(--h-text)',
                    lineHeight: 1,
                }}>
                    {val != null ? (Number.isInteger(val) ? val : val.toFixed(1)) : '—'}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--h-text-dim)' }}>{metric.unit}</span>
            </div>

            {delta != null && (
                <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: deltaColor,
                    fontFamily: 'Barlow Condensed, sans-serif',
                    letterSpacing: '0.04em',
                    marginBottom: series.length ? 8 : 0,
                }}>
                    {deltaSign}{delta} {metric.unit} vs anterior
                </div>
            )}

            {series.length > 0 && (
                <div style={{ borderTop: '1px solid var(--h-border)', paddingTop: 6, marginTop: 4 }}>
                    {[...series]
                        .sort((a, b) => a.serie - b.serie)
                        .map((s, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: 6,
                                fontSize: '0.75rem',
                                color: 'var(--h-text-muted)',
                                fontFamily: 'Barlow Condensed, sans-serif',
                                lineHeight: 1.6,
                            }}>
                                <span style={{ color: 'var(--h-text-dim)', minWidth: 20 }}>{s.serie}ª</span>
                                <span>{s.carga}kg × {s.reps} reps</span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};

const CustomDot = ({ cx, cy, index, prIndex, lineColor }) => {
    if (index === prIndex) {
        return (
            <g key={`dot-pr-${index}`}>
                <circle cx={cx} cy={cy} r={7} fill="#F5A623" strokeWidth={0} />
                <text
                    x={cx} y={cy - 13}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily="Barlow Condensed, sans-serif"
                    fontWeight="700"
                    letterSpacing="0.06em"
                    fill="#F5A623"
                >
                    PR
                </text>
            </g>
        );
    }
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill={lineColor} strokeWidth={0} />;
};

const CustomActiveDot = ({ cx, cy, lineColor }) => (
    <circle cx={cx} cy={cy} r={6} fill={lineColor} strokeWidth={0} />
);

export default function GraficoHistoricoExercicio({ dados = [], loading = false }) {
    const { darkMode } = useContext(AuthContext);
    const [metric, setMetric] = useState('maxCarga');

    const currentMetric = METRICS.find(m => m.key === metric);

    const lineColor  = darkMode ? '#6AAFF0' : '#19222B';
    const trendColor = darkMode ? 'rgba(106,175,240,0.3)' : 'rgba(25,34,43,0.2)';
    const gridColor  = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    const tickColor  = darkMode ? '#6B7A99' : '#9CAAB8';

    const dadosComTrend = useMemo(() => calcTrend(dados, metric), [dados, metric]);

    const prIndex = useMemo(() => {
        if (!dados.length) return -1;
        let max = -Infinity, idx = -1;
        dados.forEach((d, i) => { if (d[metric] > max) { max = d[metric]; idx = i; } });
        return idx;
    }, [dados, metric]);

    return (
        <>
            <div className="mh-metric-row">
                {METRICS.map(m => (
                    <button
                        key={m.key}
                        type="button"
                        className={`mh-metric-btn${metric === m.key ? ' active' : ''}`}
                        onClick={() => setMetric(m.key)}
                    >
                        {m.label}
                    </button>
                ))}
            </div>

            <div className="mh-chart-wrap">
                {loading ? (
                    <div className="mh-chart-loading">Carregando gráfico...</div>
                ) : dados.length === 0 ? (
                    <div className="mh-chart-empty">Sem dados para o gráfico.</div>
                ) : dados.length === 1 ? (
                    <div className="mh-chart-empty" style={{ flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: '1.4rem' }}>🏁</span>
                        <span>Primeira sessão registrada!</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--h-text-dim)' }}>
                            Complete mais sessões para ver sua evolução aqui.
                        </span>
                    </div>
                ) : (
                    <ResponsiveContainer key={`${darkMode}-${metric}`} width="100%" height={220}>
                        <LineChart data={dadosComTrend} margin={{ top: 16, right: 16, left: -16, bottom: 4 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={str => {
                                    const d = new Date(str + 'T12:00:00');
                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                }}
                                tick={{ fontFamily: 'Barlow Condensed', fontSize: 11, fill: tickColor, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontFamily: 'Barlow Condensed', fontSize: 11, fill: tickColor, fontWeight: 700 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={<CustomTooltip metric={currentMetric} />}
                                cursor={{ stroke: lineColor, strokeWidth: 1, strokeOpacity: 0.3 }}
                            />

                            {/* Linha de tendência (tracejada) */}
                            <Line
                                type="monotone"
                                dataKey="trend"
                                stroke={trendColor}
                                strokeWidth={1.5}
                                strokeDasharray="5 4"
                                dot={false}
                                activeDot={false}
                            />

                            {/* Linha principal com PR badge */}
                            <Line
                                type="monotone"
                                dataKey={metric}
                                stroke={lineColor}
                                strokeWidth={2.5}
                                dot={(props) => (
                                    <CustomDot {...props} prIndex={prIndex} lineColor={lineColor} />
                                )}
                                activeDot={(props) => (
                                    <CustomActiveDot {...props} lineColor={lineColor} />
                                )}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </>
    );
}
