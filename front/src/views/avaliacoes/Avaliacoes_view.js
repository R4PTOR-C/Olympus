import React, { useEffect, useState } from 'react';

const Avaliacoes_view = ({ usuarioId }) => {
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAvaliacoes = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/avaliacoes/usuarios/${usuarioId}`);
                if (!response.ok) throw new Error('Erro ao carregar avaliações.');

                const data = await response.json();
                setAvaliacoes(data);
                setLoading(false);
            } catch (err) {
                console.error('Erro ao carregar avaliações:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAvaliacoes();
    }, [usuarioId]);

    if (loading) return <div>Carregando avaliações...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="avaliacoes-view">
            <h4>Avaliações Físicas</h4>
            {avaliacoes.length > 0 ? (
                <ul className="list-group">
                    {avaliacoes.map(avaliacao => (
                        <li key={avaliacao.id} className="list-group-item">
                            <p><strong>Data:</strong> {new Date(avaliacao.data_avaliacao).toLocaleDateString()}</p>
                            <p><strong>Altura:</strong> {avaliacao.altura}m</p>
                            <p><strong>Peso:</strong> {avaliacao.peso}kg</p>
                            <p><strong>Gordura Corporal:</strong> {avaliacao.gordura_corporal}%</p>
                            <p><strong>Medições:</strong> {avaliacao.medicoes ? JSON.stringify(avaliacao.medicoes) : 'Nenhuma'}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Nenhuma avaliação registrada.</p>
            )}
        </div>
    );
};

export default Avaliacoes_view;
