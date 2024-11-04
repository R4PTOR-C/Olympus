import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });

    useEffect(() => {
        // Verificar sessão do usuário
        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, { credentials: 'include' })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                }
            })
            .catch(err => console.error('Erro ao verificar sessão:', err));
    }, []);

    return (
        <AuthContext.Provider value={user}>
            {children}
        </AuthContext.Provider>
    );
};
