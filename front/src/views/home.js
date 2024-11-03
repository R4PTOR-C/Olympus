import React, { useState, useEffect } from 'react';

function Home() {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        <div>
            <h1>Home Page</h1>
            {user.loggedIn ? (
                <div>
                    <p>Bem-vindo, {user.userName}!</p>
                    <h2>Seus Treinos</h2>
                    {treinos.length > 0 ? (
                        <ul>
                            {treinos.map(treino => (
                                <li key={treino.id}>
                                    <strong>{treino.nome_treino}</strong> - {treino.descricao} ({treino.dia_semana})
                                </li>
                            ))}
                        </ul>
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
