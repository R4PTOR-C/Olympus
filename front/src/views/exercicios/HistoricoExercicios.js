import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import ModalHistoricoExercicio from '../components/ModalHistoricoExercicios';

function HistoricoExercicios() {
    const { userId } = useContext(AuthContext);

    const [exercicios, setExercicios] = useState([]);
    const [exercicioModal, setExercicioModal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios_realizados`, {
                    credentials: 'include'
                });
                const data = await res.json();
                setExercicios(data);
            } catch (err) {
                console.error('Erro ao buscar exercícios realizados:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchExercicios();
    }, [userId]);

    if (loading) return <div className="container mt-4">Carregando...</div>;

    return (
        <div className="container mt-4">
            <h4 className="mb-3">Histórico por Exercício</h4>

            <div className="d-flex flex-wrap justify-content-center gap-3">
                {exercicios.map((ex) => (
                    <div
                        key={ex.exercicio_id}
                        className="card shadow-sm p-2"
                        style={{ width: '100%', maxWidth: '400px', cursor: 'pointer' }}
                        onClick={() => setExercicioModal(ex)}
                    >
                        <img
                            src={ex.gif_url}
                            alt={`GIF do exercício ${ex.nome_exercicio}`}
                            className="card-img-top"
                            style={{ maxHeight: '200px', objectFit: 'contain' }}
                        />
                        <div className="card-body">
                            <h5 className="card-title">{ex.nome_exercicio}</h5>
                            <p className="card-text">
                                <small className="text-muted">{ex.grupo_muscular}</small>
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {exercicioModal && (
                <ModalHistoricoExercicio
                    exercicio={exercicioModal}
                    userId={userId}
                    onClose={() => setExercicioModal(null)}
                />
            )}
        </div>
    );
}

export default HistoricoExercicios;
