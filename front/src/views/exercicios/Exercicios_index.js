import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext'; // Importa o contexto de autenticação

function Exercicios_index() {
    const { treinoId } = useParams(); // Pega o ID do treino da URL
    const [exercicios, setExercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId } = useContext(AuthContext); // Pega o ID do usuário logado
    const [selectedExercicio, setSelectedExercicio] = useState(null);
    const [formData, setFormData] = useState({ carga: '', repeticoes: '', series: '' });

    useEffect(() => {
        // Buscar os exercícios do treino específico, incluindo informações de registro
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
                if (!response.ok) {
                    throw new Error('Erro ao buscar os exercícios');
                }
                const data = await response.json();

                // Buscar informações detalhadas de cada exercício
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
        setFormData({ ...formData, [name]: value });
    };

    const handleFormSubmit = async (exercicioId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/registro`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`Dados salvos com sucesso para o exercício ${exercicioId}:`, data);
                alert('Informações registradas com sucesso!');
                // Atualiza os exercícios com as novas informações
                setExercicios(prevExercicios => prevExercicios.map(ex => ex.exercicio_id === exercicioId ? { ...ex, ...formData } : ex));
            } else {
                console.error('Erro ao salvar os dados:', response.statusText);
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
            <h2>Exercícios do Treino do Aluno com ID: {userId}</h2>
            {exercicios.length > 0 ? (
                <div className="row">
                    {exercicios.map(exercicio => (
                        <div className="col-md-4 mb-4" key={exercicio.exercicio_id}>
                            <div
                                className="card h-100"
                                style={{cursor: 'pointer'}}
                                onClick={() => {
                                    // Alternar entre mostrar e ocultar o formulário
                                    setSelectedExercicio(selectedExercicio === exercicio.exercicio_id ? null : exercicio.exercicio_id);
                                }}
                            >
                                <div className="card-body">
                                    <h5 className="card-title">{exercicio.nome_exercicio}</h5>

                                    {exercicio.carga && exercicio.repeticoes && exercicio.series ? (
                                        // Exibe informações registradas do exercício
                                        <div className="mt-2">
                                            <p><strong>Carga:</strong> {exercicio.carga} kg</p>
                                            <p><strong>Repetições:</strong> {exercicio.repeticoes}</p>
                                            <p><strong>Séries:</strong> {exercicio.series}</p>
                                        </div>
                                    ) : (
                                        // Exibe um placeholder caso as informações não estejam disponíveis
                                        <div className="mt-2 text-muted">
                                            <p>Sem informações registradas.</p>
                                            <p>Clique para adicionar detalhes.</p>
                                        </div>
                                    )}

                                    {selectedExercicio === exercicio.exercicio_id && (
                                        <div
                                            className="mt-3"
                                            onClick={(e) => e.stopPropagation()} // Previne que o clique dentro do formulário feche o card
                                        >
                                            <form>
                                                <div className="form-group">
                                                    <label>Carga (kg)</label>
                                                    <input
                                                        type="number"
                                                        name="carga"
                                                        value={formData.carga}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                    />
                                                </div>
                                                <div className="form-group mt-2">
                                                    <label>Repetições</label>
                                                    <input
                                                        type="number"
                                                        name="repeticoes"
                                                        value={formData.repeticoes}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                    />
                                                </div>
                                                <div className="form-group mt-2">
                                                    <label>Séries</label>
                                                    <input
                                                        type="number"
                                                        name="series"
                                                        value={formData.series}
                                                        onChange={handleInputChange}
                                                        className="form-control"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mt-3"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Previne que o clique no botão feche o card
                                                        handleFormSubmit(exercicio.exercicio_id);
                                                    }}
                                                >
                                                    Salvar
                                                </button>
                                            </form>
                                        </div>
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
