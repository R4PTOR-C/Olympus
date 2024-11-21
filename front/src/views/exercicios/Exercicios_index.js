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
    const [formData, setFormData] = useState({
        carga_serie_1: '',
        repeticoes_serie_1: '',
        carga_serie_2: '',
        repeticoes_serie_2: '',
        carga_serie_3: '',
        repeticoes_serie_3: '',
    });

    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
                if (!response.ok) throw new Error('Erro ao buscar os exercícios');

                const data = await response.json();

                const exerciciosComDetalhes = await Promise.all(data.map(async (exercicio) => {
                    try {
                        const detalhesResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}`, { credentials: 'include' });
                        if (detalhesResponse.ok) {
                            const detalhes = await detalhesResponse.json();
                            return { ...exercicio, ...detalhes };
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = async (exercicioId) => {
        const sanitizedFormData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
        );

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/registro`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(sanitizedFormData),
                }
            );

            if (response.ok) {
                const data = await response.json();
                alert('Informações registradas com sucesso!');
                setExercicios((prevExercicios) =>
                    prevExercicios.map((ex) =>
                        ex.exercicio_id === exercicioId ? { ...ex, ...sanitizedFormData } : ex
                    )
                );
            } else {
                alert('Erro ao salvar as informações do exercício.');
            }
        } catch (error) {
            alert('Erro ao enviar os dados. Tente novamente mais tarde.');
        } finally {
            setSelectedExercicio(null);
        }
    };

    const handleCardClick = (exercicio) => {
        if (selectedExercicio === exercicio.exercicio_id) {
            setSelectedExercicio(null);
        } else {
            setFormData({
                carga_serie_1: exercicio.carga_serie_1 || '',
                repeticoes_serie_1: exercicio.repeticoes_serie_1 || '',
                carga_serie_2: exercicio.carga_serie_2 || '',
                repeticoes_serie_2: exercicio.repeticoes_serie_2 || '',
                carga_serie_3: exercicio.carga_serie_3 || '',
                repeticoes_serie_3: exercicio.repeticoes_serie_3 || '',
            });
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
                            <div
                                className="card h-100"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCardClick(exercicio)}
                            >
                                <img
                                    src={`${process.env.REACT_APP_API_BASE_URL}/uploads/${exercicio.gif_url}`}
                                    alt={`GIF do exercício ${exercicio.nome_exercicio}`}
                                    className="card-img-top"
                                    style={{
                                        maxHeight: '200px',
                                        width: '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{exercicio.nome_exercicio}</h5>
                                    {exercicio.carga_serie_1 || exercicio.repeticoes_serie_1 ? (
                                        <div>
                                            <p>
                                                <strong>Série 1:</strong> {exercicio.carga_serie_1}{' '}
                                                <img
                                                    src="/weight.png"
                                                    alt="Peso"
                                                    style={{width: '20px', height: '20px'}}
                                                />{' '}
                                                x {exercicio.repeticoes_serie_1}{' '}
                                                <img
                                                    src="/reps.png"
                                                    alt="Repetições"
                                                    style={{width: '20px', height: '20px'}}
                                                />
                                            </p>
                                            <p>
                                                <strong>Série 2:</strong> {exercicio.carga_serie_2}{' '}
                                                <img
                                                    src="/weight.png"
                                                    alt="Peso"
                                                    style={{width: '20px', height: '20px'}}
                                                />{' '}
                                                x {exercicio.repeticoes_serie_2}{' '}
                                                <img
                                                    src="/reps.png"
                                                    alt="Repetições"
                                                    style={{width: '20px', height: '20px'}}
                                                />
                                            </p>
                                            <p>
                                                <strong>Série 3:</strong> {exercicio.carga_serie_3}{' '}
                                                <img
                                                    src="/weight.png"
                                                    alt="Peso"
                                                    style={{width: '20px', height: '20px'}}
                                                />{' '}
                                                x {exercicio.repeticoes_serie_3}{' '}
                                                <img
                                                    src="/reps.png"
                                                    alt="Repetições"
                                                    style={{width: '20px', height: '20px'}}
                                                />
                                            </p>
                                        </div>

                                    ) : (
                                        <p className="text-muted">Sem informações registradas.</p>
                                    )}
                                    {selectedExercicio === exercicio.exercicio_id && (
                                        <form
                                            className="mt-3"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="form-group">
                                                <label>Carga Série 1 (kg)</label>
                                                <input
                                                    type="number"
                                                    name="carga_serie_1"
                                                    value={formData.carga_serie_1}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Repetições Série 1</label>
                                                <input
                                                    type="number"
                                                    name="repeticoes_serie_1"
                                                    value={formData.repeticoes_serie_1}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Carga Série 2 (kg)</label>
                                                <input
                                                    type="number"
                                                    name="carga_serie_2"
                                                    value={formData.carga_serie_2}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Repetições Série 2</label>
                                                <input
                                                    type="number"
                                                    name="repeticoes_serie_2"
                                                    value={formData.repeticoes_serie_2}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Carga Série 3 (kg)</label>
                                                <input
                                                    type="number"
                                                    name="carga_serie_3"
                                                    value={formData.carga_serie_3}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Repetições Série 3</label>
                                                <input
                                                    type="number"
                                                    name="repeticoes_serie_3"
                                                    value={formData.repeticoes_serie_3}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-primary mt-3"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFormSubmit(exercicio.exercicio_id);
                                                }}
                                            >
                                                Salvar
                                            </button>
                                        </form>
                                    )}
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
