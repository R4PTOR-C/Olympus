import React, { useEffect, useState } from 'react';
import GraficoHistoricoExercicio from './GraficoHistoricoExercicio';

function ModalHistoricoExercicio({ exercicio, userId, onClose }) {
    const [historico, setHistorico] = useState({});
    const [datasOrdenadas, setDatasOrdenadas] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    useEffect(() => {
        if (!exercicio) return;

        const fetchHistorico = async () => {
            try {
                setLoading(true);
                setErro(null);

                // ✅ URL corrigida para bater com o backend
                const res = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios/${exercicio.exercicio_id}/historico`,
                    { credentials: 'include' }
                );


                if (!res.ok) throw new Error('Falha ao carregar histórico');
                const data = await res.json();

                // Agrupa por data (YYYY-MM-DD)
                const agrupado = data.reduce((acc, item) => {
                    const raw = item.data_treino || '';
                    const key = raw.includes('T') ? raw.split('T')[0] : raw; // segurança
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(item);
                    return acc;
                }, {});

                // Ordena datas (ASC) e seleciona a mais recente
                const ordenadas = Object.keys(agrupado).sort((a, b) => a.localeCompare(b));
                setHistorico(agrupado);
                setDatasOrdenadas(ordenadas);
                setDataSelecionada(ordenadas[ordenadas.length - 1] || null);
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
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
            role="dialog" aria-modal="true"
        >
            <div className="bg-white rounded shadow p-4"
                 style={{ width: '92%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <h5 className="mb-1">Histórico: {exercicio?.nome_exercicio}</h5>
                        <small className="text-muted">{exercicio?.grupo_muscular}</small>
                    </div>
                    <button className="btn-close" aria-label="Fechar" onClick={onClose}></button>
                </div>

                {/* Gráfico */}
                <div className="mb-3">
                    <GraficoHistoricoExercicio userId={userId} exercicioId={exercicio.exercicio_id} />
                </div>

                {/* Corpo */}
                {loading && <p>Carregando...</p>}
                {!loading && erro && <div className="alert alert-danger">{erro}</div>}

                {!loading && !erro && datasOrdenadas.length === 0 && (
                    <div className="text-muted">Ainda não há séries registradas para este exercício.</div>
                )}

                {!loading && !erro && datasOrdenadas.length > 0 && (
                    <>
                        <div className="mb-3">
                            <strong>Datas:</strong>
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {datasOrdenadas.map((data) => (
                                    <button
                                        key={data}
                                        className={`btn btn-sm ${dataSelecionada === data ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setDataSelecionada(data)}
                                    >
                                        {new Date(data).toLocaleDateString('pt-BR')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {dataSelecionada && (
                            <div>
                                <h6>Detalhes de {new Date(dataSelecionada).toLocaleDateString('pt-BR')}:</h6>
                                {historico[dataSelecionada].map((s, i) => (
                                    <div key={`${dataSelecionada}-${i}`} className="border-bottom py-2">
                                        <div><strong>Treino:</strong> {s.nome_treino}</div>
                                        <div><strong>{s.numero_serie}ª série:</strong> {s.carga} kg × {s.repeticoes} reps</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default ModalHistoricoExercicio;
