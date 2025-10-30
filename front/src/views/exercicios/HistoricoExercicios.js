import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../AuthContext';
import ModalHistoricoExercicio from '../components/ModalHistoricoExercicios';
import ModalCarregando from '../components/ModalCarregando'; // 👈 importa a modal de loading

function HistoricoExercicios() {
    const { userId } = useContext(AuthContext);

    const [exercicios, setExercicios] = useState([]);
    const [exercicioModal, setExercicioModal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/exercicios_realizados`,
                    { credentials: 'include' }
                );
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

    if (loading) return <ModalCarregando show={true} />; // 👈 usa o overlay padronizado

    return (
        <div className="container mt-4 exercicios-container">
            <h4 className="mb-3 text-center">Histórico por Exercício</h4>

            {exercicios.length === 0 ? (
                <div className="text-center mt-5">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="120"
                        height="120"
                        viewBox="0 0 64 64"
                        fill="none"
                        style={{ marginBottom: "1rem" }}
                    >
                        {/* Barra */}
                        <rect x="12" y="28" width="40" height="8" rx="2" fill="#555" />
                        {/* Peso esquerdo */}
                        <rect x="6" y="20" width="6" height="24" rx="2" fill="#888" />
                        <rect x="2" y="22" width="4" height="20" rx="2" fill="#bbb" />
                        {/* Peso direito */}
                        <rect x="52" y="20" width="6" height="24" rx="2" fill="#888" />
                        <rect x="58" y="22" width="4" height="20" rx="2" fill="#bbb" />
                        {/* Zzz animados */}
                        <text x="20" y="25" fontSize="10" fontWeight="bold" fill="#666">
                            Z
                            <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="2s" repeatCount="indefinite" />
                        </text>
                        <text x="26" y="20" fontSize="8" fontWeight="bold" fill="#666">
                            Z
                            <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" begin="0.6s" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
                        </text>
                        <text x="32" y="15" fontSize="6" fontWeight="bold" fill="#666">
                            Z
                            <animateTransform attributeName="transform" type="translate" from="0 0" to="0 -15" begin="1.2s" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="2s" begin="1.2s" repeatCount="indefinite" />
                        </text>
                    </svg>
                    <h5 className="text-muted">Nenhum exercício encontrado no histórico</h5>
                </div>
            ) : (
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
            )}

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
