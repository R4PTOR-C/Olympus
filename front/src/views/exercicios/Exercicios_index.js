import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

function Exercicios_index() {
    const { treinoId } = useParams(); // Pega o ID do treino da URL
    const [treinoNome, setTreinoNome] = useState(''); // Novo estado para o nome do treino
    const [exercicios, setExercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId } = useContext(AuthContext); // Pega o ID do usuário logado
    const [selectedExercicio, setSelectedExercicio] = useState(null);
    const [formData, setFormData] = useState({
        carga_serie_1: '',
        repeticoes_serie_1: '',
        carga_serie_2: '',
        repeticoes_serie_2: '',
        carga_serie_3: '',
        repeticoes_serie_3: '',
    });

    // Buscar os exercícios do treino específico
    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                console.log('Buscando exercícios para o treino:', treinoId);
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
                console.log('Resposta da API ao buscar exercícios:', response);

                if (!response.ok) {
                    throw new Error('Erro ao buscar os exercícios');
                }

                const data = await response.json();
                console.log('Dados de exercícios recebidos:', data);

                // Buscar informações detalhadas de cada exercício
                const exerciciosComDetalhes = await Promise.all(data.map(async (exercicio) => {
                    try {
                        const detalhesResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}`, { credentials: 'include' });
                        console.log(`Resposta da API ao buscar detalhes do exercício ${exercicio.exercicio_id}:`, detalhesResponse);

                        if (detalhesResponse.ok) {
                            const detalhes = await detalhesResponse.json();
                            console.log(`Detalhes do exercício ${exercicio.exercicio_id}:`, detalhes);
                            return { ...exercicio, ...detalhes };
                        }
                    } catch (err) {
                        console.error(`Erro ao buscar detalhes do exercício ${exercicio.exercicio_id}:`, err);
                    }
                    return exercicio;
                }));

                setExercicios(exerciciosComDetalhes);
            } catch (err) {
                console.error('Erro ao buscar exercícios:', err);
                setError('Erro ao buscar os exercícios');
            } finally {
                setLoading(false);
            }
        };

        fetchExercicios();
    }, [treinoId, userId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log('Alterando valor no formulário:', { name, value });
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = async (exercicioId) => {
        // Convertendo valores vazios para null antes do envio
        const sanitizedFormData = Object.fromEntries(
            Object.entries(formData).map(([key, value]) => [key, value === '' ? null : value])
        );

        console.log('Enviando dados para o backend:', {
            userId,
            treinoId,
            exercicioId,
            formData: sanitizedFormData,
        });

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/registro`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify(sanitizedFormData),
                }
            );

            console.log('Resposta da API ao salvar informações:', response);

            if (response.ok) {
                const data = await response.json();
                console.log('Dados retornados do backend após salvar:', data);
                alert('Informações registradas com sucesso!');
                // Atualiza os exercícios com as novas informações
                setExercicios((prevExercicios) =>
                    prevExercicios.map((ex) =>
                        ex.exercicio_id === exercicioId ? { ...ex, ...sanitizedFormData } : ex
                    )
                );
            } else {
                console.error('Erro ao salvar as informações do exercício:', response.statusText);
                alert('Erro ao salvar as informações do exercício.');
            }
        } catch (error) {
            console.error('Erro ao enviar os dados para o backend:', error);
            alert('Erro ao enviar os dados. Tente novamente mais tarde.');
        } finally {
            setSelectedExercicio(null); // Fecha o formulário após o envio
        }
    };


    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            {exercicios.length > 0 ? (
                <div className="row">
                    {exercicios.map(exercicio => (
                        <div className="col-md-4 mb-4" key={exercicio.exercicio_id}>
                            <div className="card h-100" style={{cursor: 'pointer'}} onClick={() => {
                                console.log('Clicou no card do exercício:', exercicio.exercicio_id);
                                setSelectedExercicio(selectedExercicio === exercicio.exercicio_id ? null : exercicio.exercicio_id);
                            }}>
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
                                            <p><strong>Série 1:</strong> {exercicio.carga_serie_1} kg x {exercicio.repeticoes_serie_1} reps</p>
                                            <p><strong>Série 2:</strong> {exercicio.carga_serie_2} kg x {exercicio.repeticoes_serie_2} reps</p>
                                            <p><strong>Série 3:</strong> {exercicio.carga_serie_3} kg x {exercicio.repeticoes_serie_3} reps</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted">Sem informações registradas.</p>
                                    )}
                                    {selectedExercicio === exercicio.exercicio_id && (
                                        <form
                                            className="mt-3"
                                            onClick={(e) => e.stopPropagation()} // Impede que o clique feche o formulário
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
                                                    e.stopPropagation(); // Impede que o clique feche o formulário
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
