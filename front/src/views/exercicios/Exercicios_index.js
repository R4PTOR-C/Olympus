import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Exercicios_index() {
    const { treinoId } = useParams();
    const { userId } = useContext(AuthContext);

    const [exercicios, setExercicios] = useState([]);
    const [formData, setFormData] = useState({});
    const [editingField, setEditingField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
                if (!response.ok) throw new Error('Erro ao buscar os exercícios');

                const data = await response.json();

                const exerciciosComSeries = await Promise.all(
                    data.map(async (exercicio) => {
                        try {
                            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series`, { credentials: 'include' });
                            if (res.ok) {
                                const series = await res.json();
                                return { ...exercicio, series };
                            }
                        } catch (err) {
                            console.error(`Erro ao buscar séries do exercício ${exercicio.exercicio_id}:`, err);
                        }
                        return { ...exercicio, series: [] };
                    })
                );

                setExercicios(exerciciosComSeries);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchExercicios();
    }, [treinoId, userId]);

    const handleAddSerie = (exercicioId) => {
        const listaAtual = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const maxNumero = listaAtual.reduce((max, s) => Math.max(max, s.numero_serie), 0);
        const novaSerie = { numero_serie: maxNumero + 1, carga: '', repeticoes: '' };
        const novaLista = [...listaAtual, novaSerie];

        setFormData(prev => ({ ...prev, [exercicioId]: novaLista }));
        setEditingField({ exercicioId, numero_serie: novaSerie.numero_serie, campo: 'carga' });
        console.log(`Adicionada série ${novaSerie.numero_serie} ao exercício ${exercicioId}`);
    };

    const handleRemoverSerie = async (numero_serie, exercicioId) => {
        const listaAtual = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const novaLista = listaAtual.filter(s => Number(s.numero_serie) !== Number(numero_serie));

        const reorganizado = novaLista.map((s, index) => ({
            ...s,
            numero_serie: index + 1
        }));

        // Atualiza local
        setFormData(prev => ({ ...prev, [exercicioId]: reorganizado }));
        setExercicios(prev => prev.map(ex =>
            ex.exercicio_id === exercicioId ? { ...ex, series: reorganizado } : ex
        ));

        if (editingField?.exercicioId === exercicioId && editingField?.numero_serie === numero_serie) {
            setEditingField(null);
        }

        console.log(`Removida série ${numero_serie} do exercício ${exercicioId}`);

        // ✅ Persistir no backend
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ series: reorganizado }),
            });
        } catch (err) {
            console.error('Erro ao salvar exclusão de série:', err);
        }
    };


    const handleBlurSalvar = async (exercicioId) => {
        const series = formData[exercicioId] || [];
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ series }),
            });

            setExercicios(prev =>
                prev.map(ex => ex.exercicio_id === exercicioId ? { ...ex, series } : ex)
            );
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setEditingField(null);
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            <div className="row">
                {exercicios.map((exercicio) => {
                    const series = formData[exercicio.exercicio_id] || exercicio.series || [];
                    return (
                        <div className="col-md-4 mb-4" key={exercicio.exercicio_id}>
                            <div className="card h-100 p-3">
                                <img
                                    src={`${process.env.REACT_APP_API_BASE_URL}/uploads/${exercicio.gif_url}`}
                                    alt={`GIF do exercício ${exercicio.nome_exercicio}`}
                                    className="card-img-top"
                                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{exercicio.nome_exercicio}</h5>

                                    {series.map((serie, index) => (
                                        <div className="d-flex align-items-center justify-content-between mb-2" key={index}>
                                            <div className="d-flex justify-content-between align-items-center mb-2" key={index}>
                                                <strong className="me-2">{serie.numero_serie}ª:</strong>

                                                {/* CARGA */}
                                                {editingField?.exercicioId === exercicio.exercicio_id && editingField?.numero_serie === serie.numero_serie && editingField?.campo === 'carga' ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm me-2"
                                                        style={{ width: '80px' }}
                                                        value={serie.carga || ''}
                                                        onChange={(e) => {
                                                            const novaLista = series.map(s =>
                                                                s.numero_serie === serie.numero_serie ? { ...s, carga: e.target.value } : s
                                                            );
                                                            setFormData(prev => ({ ...prev, [exercicio.exercicio_id]: novaLista }));
                                                        }}
                                                        onBlur={() => handleBlurSalvar(exercicio.exercicio_id)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        className="me-2"
                                                        onClick={() => setEditingField({ exercicioId: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'carga' })}
                                                        style={{ cursor: 'pointer' }}
                                                    >
          {serie.carga || '-'} kg
          <img src="/weight.png" alt="Peso" style={{ width: '18px', height: '18px', marginLeft: '4px' }} />
        </span>
                                                )}

                                                <span className="me-1">×</span>

                                                {/* REPETIÇÕES */}
                                                {editingField?.exercicioId === exercicio.exercicio_id && editingField?.numero_serie === serie.numero_serie && editingField?.campo === 'repeticoes' ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm me-2"
                                                        style={{ width: '80px' }}
                                                        value={serie.repeticoes || ''}
                                                        onChange={(e) => {
                                                            const novaLista = series.map(s =>
                                                                s.numero_serie === serie.numero_serie ? { ...s, repeticoes: e.target.value } : s
                                                            );
                                                            setFormData(prev => ({ ...prev, [exercicio.exercicio_id]: novaLista }));
                                                        }}
                                                        onBlur={() => handleBlurSalvar(exercicio.exercicio_id)}
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingField({ exercicioId: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'repeticoes' })}
                                                        style={{ cursor: 'pointer' }}
                                                    >
          {serie.repeticoes || '-'} reps
          <img src="/reps.png" alt="Repetições" style={{ width: '18px', height: '18px', marginLeft: '4px' }} />
        </span>
                                                )}
                                            </div>

                                            {/* Botão de Remover */}
                                            <button
                                                className="btn p-0 m-0"
                                                style={{ color: 'red', fontSize: '1.4rem', lineHeight: '1', border: 'none', background: 'none' }}
                                                onClick={() => handleRemoverSerie(serie.numero_serie, exercicio.exercicio_id)}
                                                title="Remover série"
                                            >
                                                &minus;
                                            </button>

                                        </div>
                                    ))}


                                    <button
                                        className="btn btn-outline-primary btn-sm mt-2"
                                        onClick={() => handleAddSerie(exercicio.exercicio_id)}
                                        type="button"
                                    >
                                        + Adicionar Série
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default Exercicios_index;
