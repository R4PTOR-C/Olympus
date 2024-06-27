import React, { useState, useEffect } from 'react';

function Home() {
    const [user, setUser] = useState({ loggedIn: false, userName: '' });

    useEffect(() => {
        fetch('http://localhost:5000/session', { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName });
                }
            });
    }, []);

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
