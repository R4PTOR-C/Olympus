import React, { useEffect, useState } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer,
} from 'recharts';

function agruparPorData(rows) {
    const byDate = new Map();

    for (const r of rows) {
        const dia = r.data_treino.split('T')[0]; // garante formato YYYY-MM-DD
        const carga = r.carga == null ? 0 : Number(r.carga);
        const reps = r.repeticoes == null ? 0 : Number(r.repeticoes);
        const oneRM = carga > 0 && reps > 0 ? carga * (1 + reps / 30) : 0;
        const vol = carga * reps;

        if (!byDate.has(dia)) {
            byDate.set(dia, {
                date: dia,
                maxCarga: 0,
                totalVolume: 0,
                max1RM: 0,
            });
        }
        const d = byDate.get(dia);
        d.maxCarga = Math.max(d.maxCarga, carga);
        d.totalVolume += vol;
        d.max1RM = Math.max(d.max1RM, oneRM);
    }

    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function GraficoHistoricoExercicio({ userId, exercicioId }) {
    const [dados, setDados] = useState([]);
    const [metric, setMetric] = useState('maxCarga');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancel = false;
        async function load() {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios/${exercicioId}/historico`,
                    { credentials: 'include' }
                );
                const rows = await res.json();
                if (!cancel) setDados(agruparPorData(rows));
            } catch (e) {
                console.error('Erro ao carregar histórico:', e);
            } finally {
                if (!cancel) setLoading(false);
            }
        }
        load();
        return () => { cancel = true; };
    }, [userId, exercicioId]);

    if (loading) return <div>Carregando gráfico...</div>;
    if (dados.length === 0) return <div className="text-muted">Sem dados suficientes para o gráfico.</div>;

    const metricLabel = {
        maxCarga: 'Carga Máx (kg)',
        totalVolume: 'Volume (kg-reps)',
        max1RM: '1RM Estimado (kg)',
    }[metric];

    return (
        <div>
            <div className="d-flex gap-2 mb-3 flex-wrap">
                <button
                    type="button"
                    className={`btn btn-sm ${metric === 'maxCarga' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setMetric('maxCarga')}
                >
                    Carga Máx
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${metric === 'totalVolume' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setMetric('totalVolume')}
                >
                    Volume
                </button>
                <button
                    type="button"
                    className={`btn btn-sm ${metric === 'max1RM' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setMetric('max1RM')}
                >
                    1RM (Epley)
                </button>
            </div>

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <LineChart data={dados} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return d.toLocaleDateString('pt-BR');
                            }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            labelFormatter={(str) => {
                                const d = new Date(str);
                                return d.toLocaleDateString('pt-BR');
                            }}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey={metric}
                            name={metricLabel}
                            dot={{ r: 4, stroke: "currentColor", fill: "currentColor" }}
                            stroke="currentColor"
                            strokeWidth={2}
                            className="grafico-linha"
                        />


                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
