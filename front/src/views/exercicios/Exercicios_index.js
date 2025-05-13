import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Exercicios_index() {
    const { treinoId } = useParams();
    const [treinoNome, setTreinoNome] = useState('');
    const [exercicios, setExercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId } = useContext(AuthContext);
    const [selectedExercicio, setSelectedExercicio] = useState(null);
    const [formData, setFormData] = useState([]);
    const [editingField, setEditingField] = useState(null);

    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
                if (!response.ok) throw new Error('Erro ao buscar os exercícios');

                const data = await response.json();

                const exerciciosComDetalhes = await Promise.all(data.map(async (exercicio) => {
                    try {
                        const detalhesResponse = await fetch(
                            `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series`,
                            { credentials: 'include' }
                        );
                        if (detalhesResponse.ok) {
                            const detalhes = await detalhesResponse.json();
                            return {
                                ...exercicio,
                                series: detalhes.map((s) => ({
                                    numero_serie: s.numero_serie,
                                    carga: s.carga,
                                    repeticoes: s.repeticoes,
                                })),
                            };
                        }
                    } catch (err) {
                        console.error(`Erro ao buscar detalhes do exercício ${exercicio.exercicio_id}:`, err);
                    }
                    return exercicio;
                }));

                setExercicios(exerciciosComDetalhes);
            } catch (err) {
                setError('Erro ao buscar os exercícios');
            } finally {
                setLoading(false);
            }
        };

        fetchExercicios();
    }, [treinoId, userId]);

    const handleBlurSalvar = async (exercicioId) => {
        try {
            await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ series: formData }),
                }
            );
            setExercicios((prev) =>
                prev.map((ex) =>
                    ex.exercicio_id === exercicioId ? { ...ex, series: formData } : ex
                )
            );
        } catch (error) {
            console.error('Erro ao salvar:', error);
        } finally {
            setEditingField(null);
        }
    };

    const handleAddSerie = (exercicioId) => {
        const exercicio = exercicios.find((ex) => ex.exercicio_id === exercicioId);
        const baseSeries = selectedExercicio === exercicioId ? formData : exercicio?.series || [];

        const maxNumero = baseSeries.reduce((max, s) => Math.max(max, s.numero_serie), 0);
        const novaSerie = {
            numero_serie: maxNumero + 1,
            carga: '',
            repeticoes: ''
        };

        const novoFormData = [...baseSeries, novaSerie];
        setFormData(novoFormData);
        setSelectedExercicio(exercicioId);

        setTimeout(() => {
            const editing = {
                exercicio_id: exercicioId,
                numero_serie: novaSerie.numero_serie,
                campo: 'carga'
            };
            setEditingField(editing);
            console.log(`Editando série ${editing.numero_serie} do exercício ${editing.exercicio_id}`);
        }, 0);
    };


    const handleCardClick = (exercicio) => {
        if (selectedExercicio === exercicio.exercicio_id) {
            setSelectedExercicio(null);
        } else {
            setFormData(exercicio.series || []);
            setSelectedExercicio(exercicio.exercicio_id);
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            {exercicios.length > 0 ? (
                <div className="row">
                    {exercicios.map((exercicio) => (
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

                                    {(selectedExercicio === exercicio.exercicio_id ? formData : exercicio.series || []).map((serie, index) => (
                                        <div className="d-flex align-items-center mb-2" key={index}>
                                            <strong className="me-2">{serie.numero_serie}ª:</strong>

                                            {editingField?.exercicio_id === exercicio.exercicio_id &&
                                            editingField?.numero_serie === serie.numero_serie &&
                                            editingField?.campo === 'carga' ? (
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm me-2"
                                                    style={{ width: '80px' }}
                                                    value={formData.find(s => s.numero_serie === serie.numero_serie)?.carga || ''}
                                                    onChange={(e) => {
                                                        const updated = formData.map(s =>
                                                            s.numero_serie === serie.numero_serie ? { ...s, carga: e.target.value } : s
                                                        );
                                                        setFormData(updated);
                                                    }}
                                                    onBlur={() => handleBlurSalvar(exercicio.exercicio_id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="me-2"
                                                    onClick={() => {
                                                        setSelectedExercicio(exercicio.exercicio_id);
                                                        setEditingField({ exercicio_id: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'carga' });
                                                        setFormData(exercicio.series || []);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {serie.carga || '-'} kg
                                                </span>
                                            )}

                                            <span className="me-1">×</span>

                                            {editingField?.exercicio_id === exercicio.exercicio_id &&
                                            editingField?.numero_serie === serie.numero_serie &&
                                            editingField?.campo === 'repeticoes' ? (
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm me-2"
                                                    style={{ width: '80px' }}
                                                    value={formData.find(s => s.numero_serie === serie.numero_serie)?.repeticoes || ''}
                                                    onChange={(e) => {
                                                        const updated = formData.map(s =>
                                                            s.numero_serie === serie.numero_serie ? { ...s, repeticoes: e.target.value } : s
                                                        );
                                                        setFormData(updated);
                                                    }}
                                                    onBlur={() => handleBlurSalvar(exercicio.exercicio_id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    onClick={() => {
                                                        setSelectedExercicio(exercicio.exercicio_id);
                                                        setEditingField({ exercicio_id: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'repeticoes' });
                                                        setFormData(exercicio.series || []);
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    {serie.repeticoes || '-'} reps
                                                </span>
                                            )}
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
                    ))}
                </div>
            ) : (
                <p>Este treino não possui exercícios cadastrados.</p>
            )}
        </div>
    );
}

export default Exercicios_index;
