import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext'; // Importa o contexto de autenticação

function Exercicios_index() {
    const { treinoId } = useParams(); // Pega o ID do treino da URL
    const [exercicios, setExercicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId } = useContext(AuthContext); // Pega o ID do usuário logado

    useEffect(() => {
        // Buscar os exercícios do treino específico
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
                if (!response.ok) {
                    throw new Error('Erro ao buscar os exercícios');
                }
                const data = await response.json();
                setExercicios(data);
            } catch (err) {
                console.error('Erro ao buscar exercícios:', err);
                setError('Erro ao buscar os exercícios');
            } finally {
                setLoading(false);
            }
        };

        fetchExercicios();
    }, [treinoId]);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            <h2>Exercícios do Treino do Aluno com ID: {userId}</h2>
            {exercicios.length > 0 ? (
                <div className="row">
                    {exercicios.map(exercicio => (
                        <div className="col-md-4 mb-4" key={exercicio.exercicio_id}>
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title">{exercicio.nome_exercicio}</h5>
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
