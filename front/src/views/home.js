import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/'); // Redireciona para a página de login se não houver token
            return;
        }

        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                    fetchTreinos(data.userId, token);
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

    // Função para obter o dia da semana atual
    const getToday = () => {
        const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        const todayIndex = new Date().getDay();
        return days[todayIndex];
    };

    const today = getToday();
    const treinoDoDia = treinos.find(treino => treino.dia_semana === today);
    const proximosTreinos = treinos.filter(treino => treino.dia_semana !== today);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            {user.loggedIn ? (
                <div>
                    <h1>Treino do Dia</h1>
                    {treinoDoDia ? (
                        <div className="card mb-4" onClick={() => navigate(`/treinos/${treinoDoDia.id}/exercicios`)}
                             style={{
                                 cursor: 'pointer',
                                 backgroundColor: '#f8f9fa',
                                 padding: '20px',
                                 fontSize: '1.2rem'
                             }}>
                            <div className="card-body">

                                <h5 className="card-title">{treinoDoDia.nome_treino}</h5>
                                <p className="card-text"><strong>Descrição:</strong> {treinoDoDia.descricao}</p>
                                <p className="card-text"><strong>Dia da Semana:</strong> {treinoDoDia.dia_semana}</p>
                            </div>
                        </div>
                    ) : (
                        <p>Não há treino para hoje.</p>
                    )}

                    <h3 className="text-center mt-5">Próximos Treinos</h3>
                    {proximosTreinos.length > 0 ? (
                        <div className="list-group">
                            {proximosTreinos.map(treino => (
                                <div
                                    className="list-group-item list-group-item-action d-flex align-items-center mb-3 shadow-sm"
                                    key={treino.id}
                                    onClick={() => navigate(`/treinos/${treino.id}/exercicios`)}
                                    style={{cursor: 'pointer', borderRadius: '10px'}}
                                >
                                    <div className="me-3">
                                        <i className="bi bi-calendar-event text-primary" style={{fontSize: '2rem'}}></i>
                                    </div>
                                    <div>
                                        <h5 className="mb-1 text-dark">{treino.nome_treino}</h5>
                                        <p className="mb-0 text-muted"><strong>Dia:</strong> {treino.dia_semana}</p>
                                        <p className="mb-0 text-muted"><strong>Descrição:</strong> {treino.descricao}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center">Não há próximos treinos cadastrados.</p>
                    )}

                </div>
            ) : (
                <p>Você não está logado.</p>
            )}
        </div>
    );
}

export default Home;
