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
    const [darkMode, setDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem("darkMode");
        return savedTheme ? savedTheme === "true" : false;
    });

    // 🔹 Carregar tema salvo no localStorage ao iniciar
    useEffect(() => {
        const savedTheme = localStorage.getItem('darkMode');
        console.log("[AuthContext] useEffect init → savedTheme:", savedTheme);
        if (savedTheme !== null) {
            setDarkMode(savedTheme === 'true');
        }
    }, []);

    // 🔹 Salvar tema e aplicar classe no body sempre que mudar
    useEffect(() => {
        console.log("[AuthContext] useEffect darkMode →", darkMode);
        localStorage.setItem('darkMode', darkMode);

        if (darkMode) {
            console.log("[AuthContext] Aplicando classe 'dark-mode' no body");
            document.body.classList.add('dark-mode');
        } else {
            console.log("[AuthContext] Removendo classe 'dark-mode' do body");
            document.body.classList.remove('dark-mode');
        }
    }, [darkMode]);

    // 🔹 Verificar sessão
    useEffect(() => {
        const checkSession = async () => {
            const token = localStorage.getItem('token');
            console.log("[AuthContext] Verificando sessão... token:", token);
            if (token) {
                try {
                    const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    console.log("[AuthContext] Resposta da sessão:", data);
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
                    console.error('[AuthContext] Erro ao verificar sessão:', err);
                    setUser({ loggedIn: false });
                }
            } else {
                setUser({ loggedIn: false });
            }
            setLoading(false);
            // DEV: splash fixo — descomente quando terminar os ajustes visuais
             const splash = document.getElementById('splash');
             if (splash) {
                 splash.classList.add('hide');
                 setTimeout(() => splash.remove(), 380);
             }
        };
        checkSession();
    }, []);

    const login = (userData, token) => {
        console.log("[AuthContext] Login chamado →", userData);
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
        console.log("[AuthContext] Logout chamado");
        localStorage.removeItem('token');
        setUser({ loggedIn: false, userName: '', userId: null, avatar: null });
    };

    const updateUser = (updates) => {
        console.log("[AuthContext] updateUser chamado →", updates);
        setUser(prev => ({
            ...prev,
            ...updates
        }));
    };

    if (loading) return null;

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
            {children}
        </AuthContext.Provider>
    );
};
