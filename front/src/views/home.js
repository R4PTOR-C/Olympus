import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar token JWT no localStorage
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            navigate('/login'); // Redireciona para a página de login se não houver token
            return;
        }

        // Verificar usuário com o token JWT
        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                    fetchTreinos(data.userId, token); // Buscar treinos do usuário logado com o token
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao verificar sessão:', err);
                setError('Erro ao verificar sessão');
                setLoading(false);
            });
    }, [navigate]);

    const fetchTreinos = async (userId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao buscar os treinos');

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
