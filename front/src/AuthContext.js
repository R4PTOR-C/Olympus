// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null, avatar: null });
    const [loading, setLoading] = useState(true);

    // Função para carregar a sessão ao iniciar
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.loggedIn) {
                        setUser({
                            loggedIn: true,
                            userName: data.userName,
                            userId: data.userId,
                            funcao: data.userFuncao,
                            avatar: data.userAvatar
                        });
                    } else {
                        setUser({ loggedIn: false });
                    }
                } catch (err) {
                    console.error('Erro ao verificar sessão:', err);
                }
            } else {
                setUser({ loggedIn: false });
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    // Função para login que atualiza o estado e armazena o token
    const login = (userData, token) => {
        localStorage.setItem('token', token);
        setUser({
            loggedIn: true,
            userName: userData.userName,
            userId: userData.userId,
            funcao: userData.funcao,
            avatar: userData.avatar
        });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser({ loggedIn: false, userName: '', userId: null, avatar: null });
    };

    // ✅ NOVO: função para atualizar os dados do usuário dinamicamente
    const updateUser = (updates) => {
        setUser(prev => ({
            ...prev,
            ...updates
        }));
    };

    if (loading) {
        return <div className="loading-indicator">Carregando...</div>;
    }

    return (
        <AuthContext.Provider value={{ ...user, login, logout, updateUser, loading }}>
            {!loading ? children : <div>Carregando...</div>}
        </AuthContext.Provider>

    );
};
