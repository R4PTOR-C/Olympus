import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar sessão do usuário com o token JWT ao carregar o contexto
        const checkSession = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await response.json();
                    if (data.loggedIn) {
                        setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                    } else {
                        setUser({ loggedIn: false });
                    }
                } catch (err) {
                    console.error('Erro ao verificar sessão:', err);
                }
            } else {
                setUser({ loggedIn: false });
            }
            setLoading(false); // Define loading como false após a verificação
        };

        checkSession();
    }, []);

    const login = (userData) => {
        setUser({
            loggedIn: true,
            userName: userData.userName,
            userId: userData.userId,
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser({ loggedIn: false, userName: '', userId: null });
    };

    return (
        <AuthContext.Provider value={{ ...user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
