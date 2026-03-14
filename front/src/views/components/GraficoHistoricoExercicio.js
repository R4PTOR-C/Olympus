import React, { useContext, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip,
    CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { AuthContext } from '../../AuthContext';
import '../../styles/ModalHistorico.css';

const METRICS = [
    { key: 'maxCarga',    label: 'Carga Máx',  unit: 'kg'     },
    { key: 'totalVolume', label: 'Volume',      unit: 'kg·rep' },
    { key: 'max1RM',      label: '1RM (Epley)', unit: 'kg'     },
];

const CustomTooltip = ({ active, payload, label, unit, lineColor }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0].value;
    return (
        <div style={{
            background: 'var(--h-surface)',
            border: '1px solid var(--h-border)',
            borderRadius: 10,
            padding: '8px 14px',
            boxShadow: 'var(--h-shadow)',
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
            <div style={{
                fontFamily: 'Bebas Neue, sans-serif',
                fontSize: '1.3rem',
                letterSpacing: '0.04em',
                color: lineColor,
                lineHeight: 1,
            }}>
                {Number.isInteger(val) ? val : val.toFixed(1)}
                <span style={{ fontSize: '0.7rem', color: 'var(--h-text-dim)', marginLeft: 4 }}>
                    {unit}
                </span>
            </div>
        </div>
    );
};

/* dados: array já agrupado por data, recebido como prop */
export default function GraficoHistoricoExercicio({ dados = [], loading = false }) {
    const { darkMode } = useContext(AuthContext);
    const [metric, setMetric] = useState('maxCarga');

    const currentMetric = METRICS.find(m => m.key === metric);

    /* Cores que funcionam em atributos SVG (sem CSS vars) */
    const lineColor = darkMode ? '#6AAFF0' : '#19222B';
    const gridColor = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
    const tickColor = darkMode ? '#6B7A99'               : '#9CAAB8';

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
                ) : dados.length < 2 ? (
                    <div className="mh-chart-empty">
                        {dados.length === 0
                            ? 'Sem dados para o gráfico.'
                            : 'Registre mais sessões para ver a evolução.'}
                    </div>
                ) : (
                    <ResponsiveContainer key={darkMode ? 'dark' : 'light'} width="100%" height={220}>
                        <LineChart data={dados} margin={{ top: 6, right: 16, left: -16, bottom: 4 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={gridColor}
                                vertical={false}
                            />
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
                                content={<CustomTooltip unit={currentMetric.unit} lineColor={lineColor} />}
                                cursor={{ stroke: lineColor, strokeWidth: 1, strokeOpacity: 0.4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey={metric}
                                stroke={lineColor}
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: lineColor, stroke: lineColor }}
                                activeDot={{ r: 6, fill: lineColor, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </>
    );
}
