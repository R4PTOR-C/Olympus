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

    const getToday = () => {
        const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        const todayIndex = new Date().getDay();
        return days[todayIndex];
    };

    const treinoImagemUrl = (imagem) =>
        `${process.env.REACT_APP_API_BASE_URL}/uploads/${imagem}`;

    const today = getToday();
    const treinoDoDia = treinos.find(treino => treino.dia_semana === today);
    const proximosTreinos = treinos.filter(treino => treino.dia_semana !== today);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            {user.loggedIn ? (
                <div className="row">
                    {/* Treino do Dia à esquerda */}
                    <div className="col-md-6">
                        <h2>Treino do Dia</h2>
                        {treinoDoDia ? (
                            <div
                                className="card mb-4 d-flex flex-row align-items-center"
                                onClick={() => navigate(`/treinos/${treinoDoDia.id}/exercicios`)}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: '#f8f9fa',
                                    padding: '20px',
                                    fontSize: '1.2rem',
                                }}
                            >
                                <img
                                    src={treinoImagemUrl(treinoDoDia.imagem)}
                                    alt={`Imagem do treino ${treinoDoDia.nome_treino}`}
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        marginRight: '20px',
                                        borderRadius: '10px',
                                    }}
                                />
                                <div>
                                    <h5 className="card-title">{treinoDoDia.nome_treino}</h5>
                                    <p className="card-text">
                                        <strong>Descrição:</strong> {treinoDoDia.descricao}
                                    </p>
                                    <p className="card-text">
                                        <strong>Dia da Semana:</strong> {treinoDoDia.dia_semana}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p>Não há treino para hoje.</p>
                        )}
                    </div>

                    {/* Próximos Treinos à direita */}
                    <div className="col-md-6">
                        <h2>Próximos Treinos</h2>
                        {proximosTreinos.length > 0 ? (
                            <div>
                                {proximosTreinos.map(treino => (
                                    <div
                                        className="d-flex align-items-center mb-3"
                                        key={treino.id}
                                        onClick={() => navigate(`/treinos/${treino.id}/exercicios`)}
                                        style={{
                                            cursor: 'pointer',
                                            border: '1px solid #ccc',
                                            padding: '10px',
                                            borderRadius: '10px',
                                            backgroundColor: '#f8f9fa',
                                        }}
                                    >
                                        <img
                                            src={treinoImagemUrl(treino.imagem)}
                                            alt={`Imagem do treino ${treino.nome_treino}`}
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                objectFit: 'cover',
                                                marginRight: '15px',
                                                borderRadius: '10px',
                                            }}
                                        />
                                        <div>
                                            <h5 className="text-dark mb-1">{treino.nome_treino}</h5>
                                            <p className="mb-0 text-muted"><strong>Dia:</strong> {treino.dia_semana}</p>
                                            <p className="mb-0 text-muted"><strong>Descrição:</strong> {treino.descricao}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>Não há próximos treinos cadastrados.</p>
                        )}
                    </div>
                </div>
            ) : (
                <p>Você não está logado.</p>
            )}
        </div>
    );
}

export default Home;
