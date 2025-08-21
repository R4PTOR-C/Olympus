// AuthContext.js
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({
        loggedIn: false,
        userName: '',
        userId: null,
        avatar: null
    });
    const [loading, setLoading] = useState(true);

    // ✅ Estado de dark mode
    const [darkMode, setDarkMode] = useState(false);

    // 🔹 Carregar tema salvo no localStorage ao iniciar
    useEffect(() => {
        const savedTheme = localStorage.getItem('darkMode');
        if (savedTheme !== null) {
            setDarkMode(savedTheme === 'true');
        }
    }, []);

    // 🔹 Salvar tema e aplicar classe no body sempre que mudar
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode);

        if (darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    // 🔹 Verificar sessão
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
                    setUser({ loggedIn: false });
                }
            } else {
                setUser({ loggedIn: false });
            }
            setLoading(false);
        };
        checkSession();
    }, []);

    // 🔹 Função de login
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

    // 🔹 Função de logout
    const logout = () => {
        localStorage.removeItem('token');
        setUser({ loggedIn: false, userName: '', userId: null, avatar: null });
    };

    // 🔹 Atualizar dados do usuário
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
        <AuthContext.Provider
            value={{
                ...user,
                login,
                logout,
                updateUser,
                loading,
                darkMode,
                setDarkMode
            }}
        >
            {!loading ? children : <div>Carregando...</div>}
        </AuthContext.Provider>
    );
};
