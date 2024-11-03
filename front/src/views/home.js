import React, { useState, useEffect } from 'react';

function Home() {
    const [user, setUser] = useState({ loggedIn: false, userName: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                console.log('Dados da sessão no cliente:', data); // Log para depuração
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName });
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao verificar sessão:', err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <p>Carregando...</p>;
    }

    return (
        <div>
            <h1>Home Page</h1>
            {user.loggedIn ? (
                <p>Bem-vindo, {user.userName}!</p>
            ) : (
                <p>Você não está logado.</p>
            )}
        </div>
    );
}

export default Home;
