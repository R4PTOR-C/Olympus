import React, { useEffect, useState } from 'react';

function ModalHistorico({ usuarioId, treinoId, onClose }) {
    const [treinos, setTreinos] = useState([]);
    const [exerciciosPorData, setExerciciosPorData] = useState({});
    const [dataSelecionada, setDataSelecionada] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTreinosRealizados = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos_realizados?usuario_id=${usuarioId}&treino_id=${treinoId}`, {
                    credentials: 'include'
                });
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
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
                credentials: 'include'
            });
            const exercicios = await res.json();

            const exerciciosComSeries = await Promise.all(
                exercicios.map(async (exercicio) => {
                    const res2 = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${usuarioId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series?data=${data}`, {
                        credentials: 'include'
                    });
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

    return (
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Histórico de Treinos</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        {loading ? (
                            <p>Carregando...</p>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <strong>Datas disponíveis:</strong>
                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                        {treinos.map((t) => (
                                            <button
                                                key={t.id}
                                                className={`btn btn-sm ${dataSelecionada === t.data ? 'btn-primary' : 'btnprimary'}`}
                                                onClick={() => carregarSeriesPorData(t.data)}
                                            >
                                                {dataSelecionada === t.data && (
                                                    <i className="bi bi-clock-history me-1"></i> // <-- ícone de relógio
                                                )}
                                                {new Date(t.data.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR')}
                                            </button>
                                        ))}

                                    </div>
                                </div>

                                {dataSelecionada && exerciciosPorData[dataSelecionada] && (
                                    <div>
                                        <h6>Treino
                                            de {new Date(dataSelecionada.split('T')[0] + 'T12:00:00').toLocaleDateString('pt-BR')}</h6>
                                        {exerciciosPorData[dataSelecionada].map((ex) => (
                                            <div key={ex.exercicio_id} className="mb-3">
                                                <strong>{ex.nome_exercicio}</strong>
                                                {ex.series.length === 0 ? (
                                                    <p className="text-muted">Sem séries registradas.</p>
                                                ) : (
                                                    <ul className="list-group list-group-flush">
                                                        {ex.series.map((serie, i) => (
                                                            <li key={i} className="list-group-item d-flex justify-content-between">
                                                                <span>{serie.numero_serie}ª série</span>
                                                                <span>{serie.carga} kg × {serie.repeticoes} reps</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalHistorico;
