// AuthContext.js
import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API, getToken, lerTokenLocal } from './services/api';

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

    // ✅ Tema: segue o celular, a menos que o usuário tenha escolhido um.
    // localStorage 'tema' = 'claro' | 'escuro' (escolha manual); ausente = sistema.
    // O index.html lê a mesma chave para pintar a splash antes do React.
    const [temaManual, setTemaManual] = useState(() => {
        try {
            // Migração: a chave antiga era sempre gravada; só 'true' era escolha de fato
            const antigo = localStorage.getItem('darkMode');
            if (antigo !== null) {
                localStorage.removeItem('darkMode');
                if (antigo === 'true' && !localStorage.getItem('tema')) localStorage.setItem('tema', 'escuro');
            }
            return localStorage.getItem('tema');
        } catch { return null; }
    });
    const [sistemaEscuro, setSistemaEscuro] = useState(
        () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    );
    const darkMode = temaManual ? temaManual === 'escuro' : sistemaEscuro;

    useEffect(() => {
        const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
        if (!mql) return;
        const onChange = (e) => setSistemaEscuro(e.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    // Escolher o mesmo tema do celular volta a seguir o sistema
    const setDarkMode = useCallback((escuro) => {
        const tema = escuro === sistemaEscuro ? null : (escuro ? 'escuro' : 'claro');
        try {
            if (tema) localStorage.setItem('tema', tema);
            else localStorage.removeItem('tema');
        } catch { /* storage indisponível */ }
        setTemaManual(tema);
    }, [sistemaEscuro]);

    // 🔹 Aplicar classe no body sempre que mudar
    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
    }, [darkMode]);

    const aplicarSessao = (dados) => {
        setUser({
            loggedIn: true,
            userName: dados.userName,
            userId: dados.userId,
            funcao: dados.userFuncao,
            funcao_extra: dados.userFuncaoExtra || null,
            avatar: dados.userAvatar
        });
        const saved = localStorage.getItem(`funcaoAtiva_${dados.userId}`);
        const funcaoValida = (saved === dados.userFuncao || saved === dados.userFuncaoExtra)
            ? saved
            : dados.userFuncao;
        setFuncaoAtiva(funcaoValida);
    };

    // 🔹 Verificar sessão
    useEffect(() => {
        const checkSession = async () => {
            const token = getToken();
            if (token) {
                try {
                    const response = await fetch(`${API}/session`);
                    const data = await response.json();
                    if (response.ok && data.loggedIn) {
                        aplicarSessao(data);
                        conectarSocket(data.userId);
                        subscribeParaPush();
                    } else {
                        localStorage.removeItem('token');
                        setUser({ loggedIn: false });
                    }
                } catch {
                    // Sem conexão (comum na academia): não desloga. Usa os dados
                    // do próprio token enquanto ele não expirar.
                    const local = lerTokenLocal();
                    if (local?.userId) aplicarSessao(local);
                    else setUser({ loggedIn: false });
                }
            } else {
                setUser({ loggedIn: false });
            }
            setLoading(false);
            const splash = document.getElementById('splash');
            if (splash) {
                splash.classList.add('hide');
                setTimeout(() => splash.remove(), 380);
            }
        };
        checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const conectarSocket = (userId) => {
        if (socketRef.current) socketRef.current.disconnect();
        // O servidor coloca o socket na sala do usuário a partir do token
        const s = io(API, { transports: ['websocket'], auth: { token: getToken() } });
        s.on('nova_mensagem_notif', () => setMensagensNaoLidas(prev => prev + 1));
        socketRef.current = s;
        setSocket(s);
    };

    const subscribeParaPush = async () => {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;
            const reg = await navigator.serviceWorker.ready;
            const keyRes = await fetch(`${API}/push/vapid-public-key`);
            const { publicKey } = await keyRes.json();
            if (!publicKey) return;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: publicKey
            });
            await fetch(`${API}/push/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: sub })
            });
        } catch {
            /* push é opcional */
        }
    };

    const login = (userData, token, funcaoInicial = null) => {
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
        subscribeParaPush();
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
        localStorage.removeItem('token');
        if (user.userId) localStorage.removeItem(`funcaoAtiva_${user.userId}`);
        setFuncaoAtiva(null);
        setUser({ loggedIn: false, userName: '', userId: null, avatar: null });
        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; setSocket(null); }
    };

    const updateUser = (updates) => {
        setUser(prev => ({
            ...prev,
            ...updates
        }));
    };

    // Estável entre renders: telas usam como dependência de useEffect
    const clearMensagensNaoLidas = useCallback(() => setMensagensNaoLidas(0), []);

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
                clearMensagensNaoLidas
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
