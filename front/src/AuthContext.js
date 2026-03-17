// AuthContext.js
import React, { createContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState({
        loggedIn: false,
        userName: '',
        userId: null,
        avatar: null
    });
    const [loading, setLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0);
    const socketRef = useRef(null);
    const [funcaoAtiva, setFuncaoAtiva] = useState(null);

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
                            funcao_extra: data.userFuncaoExtra || null,
                            avatar: data.userAvatar
                        });
                        const saved = localStorage.getItem(`funcaoAtiva_${data.userId}`);
                        const funcaoValida = (saved === data.userFuncao || saved === data.userFuncaoExtra)
                            ? saved
                            : data.userFuncao;
                        setFuncaoAtiva(funcaoValida);
                        conectarSocket(data.userId);
                        subscribeParaPush(data.userId);
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

    const conectarSocket = (userId) => {
        if (socketRef.current) socketRef.current.disconnect();
        const s = io(process.env.REACT_APP_API_BASE_URL, { transports: ['websocket'] });
        s.on('connect', () => s.emit('entrar_sala_usuario', userId));
        s.on('nova_mensagem_notif', () => setMensagensNaoLidas(prev => prev + 1));
        socketRef.current = s;
        setSocket(s);
    };

    const subscribeParaPush = async (userId) => {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
            const reg = await navigator.serviceWorker.ready;
            const keyRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/push/vapid-public-key`);
            const { publicKey } = await keyRes.json();
            if (!publicKey) return;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey
            });
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuarioId: userId, subscription: sub })
            });
        } catch (err) {
            console.log('[Push] Não foi possível assinar:', err.message);
        }
    };

    const login = (userData, token, funcaoInicial = null) => {
        console.log("[AuthContext] Login chamado →", userData);
        localStorage.setItem('token', token);
        setUser({
            loggedIn: true,
            userName: userData.userName,
            userId: userData.userId,
            funcao: userData.funcao,
            funcao_extra: userData.funcao_extra || null,
            avatar: userData.avatar
        });
        const fa = funcaoInicial || userData.funcao;
        localStorage.setItem(`funcaoAtiva_${userData.userId}`, fa);
        setFuncaoAtiva(fa);
        conectarSocket(userData.userId);
        subscribeParaPush(userData.userId);
    };

    const trocarFuncao = () => {
        setUser(prev => {
            const nova = funcaoAtiva === prev.funcao ? prev.funcao_extra : prev.funcao;
            localStorage.setItem(`funcaoAtiva_${prev.userId}`, nova);
            setFuncaoAtiva(nova);
            return prev;
        });
    };

    const resetFuncaoAtiva = () => {
        setUser(prev => {
            localStorage.setItem(`funcaoAtiva_${prev.userId}`, prev.funcao);
            setFuncaoAtiva(prev.funcao);
            return prev;
        });
    };

    const logout = () => {
        console.log("[AuthContext] Logout chamado");
        localStorage.removeItem('token');
        if (user.userId) localStorage.removeItem(`funcaoAtiva_${user.userId}`);
        setFuncaoAtiva(null);
        setUser({ loggedIn: false, userName: '', userId: null, avatar: null });
        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; setSocket(null); }
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
                funcaoAtiva,
                trocarFuncao,
                resetFuncaoAtiva,
                login,
                logout,
                updateUser,
                loading,
                darkMode,
                setDarkMode,
                socket,
                mensagensNaoLidas,
                clearMensagensNaoLidas: () => setMensagensNaoLidas(0)
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
