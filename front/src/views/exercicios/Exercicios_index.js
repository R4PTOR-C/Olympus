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

    const handleBlurSalvar = async (exercicioId) => {
        const sanitizedFormData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
        );

        try {
            await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/registro`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(sanitizedFormData),
                }
            );

            setExercicios((prevExercicios) =>
                prevExercicios.map((ex) =>
                    ex.exercicio_id === exercicioId ? { ...ex, ...sanitizedFormData } : ex
                )
            );
        } catch (error) {
            console.error('Erro ao salvar as informações do exercício:', error);
        } finally {
            setEditingField(null);
        }
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

    const [editingField, setEditingField] = useState(null);


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

                                    {[1, 2, 3].map((serie) => (
                                        <div className="d-flex align-items-center mb-2" key={serie}>
                                            <strong className="me-2">{serie}ª:</strong>

                                            {/* CARGA */}
                                            {selectedExercicio === exercicio.exercicio_id &&
                                            editingField === `carga_serie_${serie}` ? (
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm me-2"
                                                    style={{ width: '80px' }}
                                                    value={formData[`carga_serie_${serie}`]}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, [`carga_serie_${serie}`]: e.target.value })
                                                    }
                                                    onBlur={() => handleBlurSalvar(exercicio.exercicio_id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    className="me-2"
                                                    style={{ cursor: 'pointer', color: 'black', textDecoration: 'none' }}
                                                    onClick={() => {
                                                        setSelectedExercicio(exercicio.exercicio_id);
                                                        setEditingField(`carga_serie_${serie}`);
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            [`carga_serie_${serie}`]: exercicio[`carga_serie_${serie}`] || '',
                                                        }));
                                                    }}
                                                >
            {exercicio[`carga_serie_${serie}`] || '-'} kg
            <img src="/weight.png" alt="Peso" style={{ width: '20px', height: '20px', marginLeft: '4px' }} />
        </span>
                                            )}

                                            <span className="me-1">×</span>

                                            {/* REPETIÇÕES */}
                                            {selectedExercicio === exercicio.exercicio_id &&
                                            editingField === `repeticoes_serie_${serie}` ? (
                                                <input
                                                    type="number"
                                                    className="form-control form-control-sm me-2"
                                                    style={{ width: '80px' }}
                                                    value={formData[`repeticoes_serie_${serie}`]}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, [`repeticoes_serie_${serie}`]: e.target.value })
                                                    }
                                                    onBlur={() => handleBlurSalvar(exercicio.exercicio_id)}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span
                                                    style={{ cursor: 'pointer', color: 'black', textDecoration: 'none' }}
                                                    onClick={() => {
                                                        setSelectedExercicio(exercicio.exercicio_id);
                                                        setEditingField(`repeticoes_serie_${serie}`);
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            [`repeticoes_serie_${serie}`]: exercicio[`repeticoes_serie_${serie}`] || '',
                                                        }));
                                                    }}
                                                >
            {exercicio[`repeticoes_serie_${serie}`] || '-'} reps
            <img src="/reps.png" alt="Repetições" style={{ width: '20px', height: '20px', marginLeft: '4px' }} />
        </span>
                                            )}
                                        </div>

                                    ))}
                                    
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
