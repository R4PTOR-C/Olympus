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
    const [formData, setFormData] = useState({ carga: '', repeticoes: '', series: '' });

    // Buscar detalhes do treino (nome)
    useEffect(() => {
        const fetchTreinoNome = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
                if (!response.ok) throw new Error('Erro ao buscar o nome do treino');
                const data = await response.json();
                setTreinoNome(data.nome_treino); // Atualiza o estado com o nome do treino
            } catch (err) {
                console.error('Erro ao buscar o nome do treino:', err);
                setError('Erro ao buscar o nome do treino');
            }
        };

        fetchTreinoNome();
    }, [treinoId]);

    // Buscar os exercícios do treino específico
    useEffect(() => {
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
            <h2>Exercícios do Treino: <strong>{treinoNome}</strong></h2>
            {exercicios.length > 0 ? (
                <div className="row">
                    {exercicios.map(exercicio => (
                        <div className="col-md-4 mb-4" key={exercicio.exercicio_id}>
                            <div
                                className="card h-100"
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    // Alternar entre mostrar e ocultar o formulário
                                    setSelectedExercicio(selectedExercicio === exercicio.exercicio_id ? null : exercicio.exercicio_id);
                                }}
                            >
                                <div className="card-body">
                                    <h5 className="card-title">{exercicio.nome_exercicio}</h5>
                                    {exercicio.carga && exercicio.repeticoes && exercicio.series ? (
                                        <div className="mt-2">
                                            <p><strong>Carga:</strong> {exercicio.carga} kg</p>
                                            <p><strong>Repetições:</strong> {exercicio.repeticoes}</p>
                                            <p><strong>Séries:</strong> {exercicio.series}</p>
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-muted">
                                            <p>Sem informações registradas.</p>
                                            <p>Clique para adicionar detalhes.</p>
                                        </div>
                                    )}
                                    {selectedExercicio === exercicio.exercicio_id && (
                                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
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
                                                        e.stopPropagation();
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
