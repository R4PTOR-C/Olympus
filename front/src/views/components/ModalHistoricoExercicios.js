import React, { useEffect, useState } from 'react';

function ModalHistoricoExercicio({ exercicio, userId, onClose }) {
    const [historico, setHistorico] = useState([]);
    const [dataSelecionada, setDataSelecionada] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!exercicio) return;

        const fetchHistorico = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios/${exercicio.exercicio_id}/historico`, {
                    credentials: 'include'
                });
                const data = await res.json();

                const agrupado = data.reduce((acc, item) => {
                    const dataKey = item.data_treino.split('T')[0];
                    if (!acc[dataKey]) acc[dataKey] = [];
                    acc[dataKey].push(item);
                    return acc;
                }, {});

                setHistorico(agrupado);
            } catch (err) {
                console.error('Erro ao carregar histórico:', err);
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
        >
            <div className="bg-white rounded shadow p-4" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Histórico: {exercicio.nome_exercicio}</h5>
                    <button className="btn-close" onClick={onClose}></button>
                </div>

                {loading ? (
                    <p>Carregando...</p>
                ) : (
                    <>
                        <div className="mb-3">
                            <strong>Datas:</strong>
                            <div className="d-flex flex-wrap gap-2 mt-2">
                                {Object.keys(historico).map(data => (
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
                                    <div key={i} className="border-bottom py-2">
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
