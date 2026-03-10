import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../../styles/ModalHistorico.css';

function ModalHistorico({ usuarioId, treinoId, onClose }) {
    const [treinos,          setTreinos]          = useState([]);
    const [exerciciosPorData, setExerciciosPorData] = useState({});
    const [dataSelecionada,  setDataSelecionada]  = useState(null);
    const [loading,          setLoading]          = useState(true);

    const datasTreinadas = treinos.map(t => t.data.split('T')[0]);

    useEffect(() => {
        const fetchTreinosRealizados = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos_realizados?usuario_id=${usuarioId}&treino_id=${treinoId}`,
                    { credentials: 'include' }
                );
                const data = await res.json();
                setTreinos(data.sort((a, b) => b.data.localeCompare(a.data)));
            } catch (err) {
                console.error('Erro ao buscar histórico:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTreinosRealizados();
    }, [usuarioId, treinoId]);

    const carregarSeriesPorData = async (data) => {
        try {
            setLoading(true);
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`,
                { credentials: 'include' }
            );
            const exercicios = await res.json();

            const exerciciosComSeries = await Promise.all(
                exercicios.map(async (exercicio) => {
                    const res2 = await fetch(
                        `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${usuarioId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series?data=${data}`,
                        { credentials: 'include' }
                    );
                    const series = res2.ok ? await res2.json() : [];
                    return { ...exercicio, series };
                })
            );

            setExerciciosPorData(prev => ({ ...prev, [data]: exerciciosComSeries }));
            setDataSelecionada(data);
        } catch (err) {
            console.error('Erro ao carregar séries da data:', err);
        } finally {
            setLoading(false);
        }
    };

    const tileClassName = ({ date, view }) => {
        if (view === 'month') {
            const dataStr = date.toISOString().split('T')[0];
            if (datasTreinadas.includes(dataStr)) return 'treino-realizado';
        }
        return null;
    };

    const onSelectDate = (date) => {
        const dataISO = date.toISOString().split('T')[0];
        const treino  = treinos.find(t => t.data.startsWith(dataISO));
        if (treino) carregarSeriesPorData(treino.data);
    };

    const formatDate = (iso) =>
        new Date(iso.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

    return (
        <div className="mh-overlay" onClick={onClose} role="dialog" aria-modal="true">
            <div className="mh-sheet" onClick={e => e.stopPropagation()}>

                {/* ── HEADER ── */}
                <div className="mh-header">
                    <div className="mh-header-row">
                        <div className="mh-header-info">
                            <div className="mh-badge">
                                <span className="mh-badge-dot" />
                                Histórico de Treinos
                            </div>
                            <div className="mh-title">Calendário</div>
                            <div className="mh-subtitle">
                                {datasTreinadas.length > 0
                                    ? `${datasTreinadas.length} sessão${datasTreinadas.length !== 1 ? 'ões' : ''} registrada${datasTreinadas.length !== 1 ? 's' : ''}`
                                    : 'Nenhuma sessão ainda'}
                            </div>
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

                    {loading && !dataSelecionada ? (
                        <div className="mh-chart-loading">Carregando histórico...</div>
                    ) : (
                        <>
                            {/* Calendário */}
                            <div className="mh-sec-label">Selecione uma data</div>
                            <div className="mh-calendar-wrap">
                                <Calendar
                                    onClickDay={onSelectDate}
                                    tileClassName={tileClassName}
                                    locale="pt-BR"
                                />
                            </div>

                            {/* Detalhe da data */}
                            {dataSelecionada && exerciciosPorData[dataSelecionada] && (
                                <>
                                    <div className="mh-sec-label">
                                        {formatDate(dataSelecionada)}
                                    </div>

                                    {loading ? (
                                        <div className="mh-chart-loading">Carregando séries...</div>
                                    ) : (
                                        exerciciosPorData[dataSelecionada].map(ex => (
                                            <div key={ex.exercicio_id} className="mh-ex-card">
                                                <div className="mh-ex-card-header">
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--h-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                                                    </svg>
                                                    <span className="mh-ex-name">{ex.nome_exercicio}</span>
                                                </div>

                                                {ex.series.length === 0 ? (
                                                    <div className="mh-ex-empty">Sem séries registradas.</div>
                                                ) : (
                                                    <div className="mh-series-wrap" style={{ margin: '0', borderRadius: 0, border: 'none' }}>
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
                                                                {ex.series.map((serie, i) => (
                                                                    <tr key={i}>
                                                                        <td className="mh-serie-num">{serie.numero_serie}ª</td>
                                                                        <td>
                                                                            <span className="mh-serie-val">
                                                                                {serie.carga}<small>kg</small>
                                                                            </span>
                                                                        </td>
                                                                        <td className="mh-serie-sep">×</td>
                                                                        <td>
                                                                            <span className="mh-serie-val">
                                                                                {serie.repeticoes}<small>rep</small>
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </>
                            )}

                            {!dataSelecionada && datasTreinadas.length === 0 && (
                                <div className="mh-empty">
                                    Nenhum treino realizado ainda. Complete um treino para ver o histórico aqui.
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── FOOTER ── */}
                <div className="mh-footer">
                    <button className="mh-btn-close" onClick={onClose}>Fechar</button>
                </div>

            </div>
        </div>
    );
}

export default ModalHistorico;
