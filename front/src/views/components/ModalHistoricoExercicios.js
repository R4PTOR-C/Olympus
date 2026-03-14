import React, { useEffect, useState } from 'react';
import GraficoHistoricoExercicio from './GraficoHistoricoExercicio';
import '../../styles/ModalHistorico.css';

/* Agrupa rows por data e calcula métricas para o gráfico */
function agruparParaGrafico(rows) {
    const byDate = new Map();
    for (const r of rows) {
        const dia   = (r.data_treino || '').split('T')[0];
        const carga = r.carga      == null ? 0 : Number(r.carga);
        const reps  = r.repeticoes == null ? 0 : Number(r.repeticoes);
        const oneRM = carga > 0 && reps > 0 ? carga * (1 + reps / 30) : 0;

        if (!byDate.has(dia)) {
            byDate.set(dia, { date: dia, maxCarga: 0, totalVolume: 0, max1RM: 0 });
        }
        const d = byDate.get(dia);
        d.maxCarga     = Math.max(d.maxCarga, carga);
        d.totalVolume += carga * reps;
        d.max1RM       = Math.max(d.max1RM, oneRM);
    }
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/* Agrupa rows por sessão (treino_realizado_id) para exibição de cards separados */
function agruparPorData(rows) {
    const acc = {};
    for (const r of rows) {
        const key = r.treino_realizado_id != null
            ? `tr_${r.treino_realizado_id}`
            : (r.data_treino || '').split('T')[0];
        if (!acc[key]) acc[key] = { nomeTreino: r.nome_treino || '', data: (r.data_treino || '').split('T')[0], series: [], series_alvo: r.series_alvo, reps_alvo: r.reps_alvo };
        acc[key].series.push(r);
    }
    for (const key of Object.keys(acc)) {
        acc[key].series.sort((a, b) => a.numero_serie - b.numero_serie);
    }
    /* Ordena por data mais recente, depois por treino_realizado_id decrescente */
    return Object.entries(acc).sort(([, a], [, b]) => {
        const dataDiff = b.data.localeCompare(a.data);
        if (dataDiff !== 0) return dataDiff;
        const idA = a.series[0]?.treino_realizado_id ?? 0;
        const idB = b.series[0]?.treino_realizado_id ?? 0;
        return idB - idA;
    });
}

function formatDate(iso) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    });
}

function ModalHistoricoExercicio({ exercicio, userId, onClose }) {
    const [dadosGrafico, setDadosGrafico] = useState([]);
    const [sessoes,      setSessoes]      = useState([]);   // [{data, {nomeTreino, series}}]
    const [loading,      setLoading]      = useState(true);
    const [erro,         setErro]         = useState(null);

    useEffect(() => {
        if (!exercicio) return;

        const fetchHistorico = async () => {
            try {
                setLoading(true);
                setErro(null);

                const res = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios/${exercicio.exercicio_id}/historico`,
                    { credentials: 'include' }
                );
                if (!res.ok) throw new Error('Falha ao carregar histórico');
                const rows = await res.json();

                setDadosGrafico(agruparParaGrafico(rows));
                setSessoes(agruparPorData(rows));
            } catch (err) {
                console.error('Erro ao carregar histórico:', err);
                setErro('Não foi possível carregar o histórico.');
            } finally {
                setLoading(false);
            }
        };

        fetchHistorico();
    }, [exercicio, userId]);

    return (
        <div className="mh-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="mh-sheet" onClick={e => e.stopPropagation()}>

                {/* ── HEADER ── */}
                <div className="mh-header">
                    <div className="mh-header-row">
                        <div className="mh-header-info">
                            <div className="mh-badge">
                                <span className="mh-badge-dot" />
                                Histórico
                            </div>
                            <div className="mh-title">{exercicio?.nome_exercicio}</div>
                            {exercicio?.grupo_muscular && (
                                <div className="mh-subtitle">{exercicio.grupo_muscular}</div>
                            )}
                        </div>
                        <button className="mh-close-btn" onClick={onClose} aria-label="Fechar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6"  y2="18"/>
                                <line x1="6"  y1="6" x2="18" y2="18"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── BODY ── */}
                <div className="mh-body">

                    {/* Gráfico — recebe dados já processados */}
                    <div className="mh-sec-label">Evolução</div>
                    <GraficoHistoricoExercicio dados={dadosGrafico} loading={loading} />

                    {/* Sessões */}
                    <div className="mh-sec-label" style={{ marginTop: 8 }}>
                        Sessões
                        {sessoes.length > 0 && (
                            <span style={{ fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: '0.7rem', color: 'var(--h-accent)', marginLeft: 8, letterSpacing: '0.08em' }}>
                                {sessoes.length}
                            </span>
                        )}
                    </div>

                    {loading && <div className="mh-chart-loading">Carregando sessões...</div>}
                    {!loading && erro && <div className="mh-error">{erro}</div>}
                    {!loading && !erro && sessoes.length === 0 && (
                        <div className="mh-empty">Nenhuma série registrada para este exercício.</div>
                    )}

                    {!loading && !erro && sessoes.map(([key, { nomeTreino, data, series, series_alvo, reps_alvo }], idx) => (
                        <div key={key} className="mh-session-card">
                            {/* Cabeçalho da sessão */}
                            <div className="mh-session-header">
                                <div className="mh-session-num">
                                    Sessão {sessoes.length - idx}
                                </div>
                                <div className="mh-session-date">{formatDate(data)}</div>
                                {nomeTreino && (
                                    <div className="mh-session-treino">{nomeTreino}</div>
                                )}
                                {(series_alvo || reps_alvo) && (
                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 5,
                                        padding: '3px 9px',
                                        borderRadius: 20,
                                        background: 'rgba(74,144,217,0.1)',
                                        border: '1px solid rgba(74,144,217,0.3)',
                                        fontSize: '0.72rem',
                                        color: '#4A90D9',
                                        fontWeight: 700,
                                        letterSpacing: '0.04em',
                                        marginLeft: 'auto',
                                    }}>
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                        </svg>
                                        Meta:{series_alvo ? ` ${series_alvo} séries` : ''}
                                        {series_alvo && reps_alvo ? ' × ' : ''}
                                        {reps_alvo ? `${reps_alvo} reps` : ''}
                                    </div>
                                )}
                            </div>

                            {/* Séries */}
                            <table className="mh-series-table">
                                <thead>
                                    <tr>
                                        <th>Série</th>
                                        <th>Carga</th>
                                        <th className="mh-serie-sep"> </th>
                                        <th>Reps</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {series.map((s, i) => (
                                        <tr key={i}>
                                            <td className="mh-serie-num">{s.numero_serie}ª</td>
                                            <td>
                                                <span className="mh-serie-val">
                                                    {s.carga}<small>kg</small>
                                                </span>
                                            </td>
                                            <td className="mh-serie-sep">×</td>
                                            <td>
                                                <span className="mh-serie-val">
                                                    {s.repeticoes}<small>rep</small>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>

                {/* ── FOOTER ── */}
                <div className="mh-footer">
                    <button className="mh-btn-close" onClick={onClose}>Fechar</button>
                </div>

            </div>
        </div>
    );
}

export default ModalHistoricoExercicio;
