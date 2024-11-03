import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook para navegação

    useEffect(() => {
        // Verificar sessão do usuário
        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                console.log('Dados da sessão no cliente:', data); // Log para depuração
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                    fetchTreinos(data.userId); // Buscar treinos do usuário logado
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao verificar sessão:', err);
                setError('Erro ao verificar sessão');
                setLoading(false);
            });
    }, []);

    const fetchTreinos = async (userId) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos`, { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Erro ao buscar os treinos');
            }
            const data = await response.json();
            setTreinos(data);
        } catch (err) {
            console.error('Erro ao buscar treinos:', err);
            setError('Erro ao buscar os treinos');
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            {user.loggedIn ? (
                <div>
                    <h2>Seus Treinos</h2>
                    {treinos.length > 0 ? (
                        <div className="row">
                            {treinos.map(treino => (
                                <div className="col-md-4 mb-4" key={treino.id}>
                                    <div className="card h-100" onClick={() => navigate(`/treinos/${treino.id}/exercicios`)} style={{ cursor: 'pointer' }}>
                                        <div className="card-body">
                                            <h5 className="card-title">{treino.nome_treino}</h5>
                                            <p className="card-text"><strong>Descrição:</strong> {treino.descricao}</p>
                                            <p className="card-text"><strong>Dia da Semana:</strong> {treino.dia_semana}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>Você não tem treinos cadastrados.</p>
                    )}
                </div>
            ) : (
                <p>Você não está logado.</p>
            )}
        </div>
    );
}

export default Home;
