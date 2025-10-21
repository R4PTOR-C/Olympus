import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../AuthContext";
import { io } from "socket.io-client";

function ChatView() {
    const { chatId } = useParams();
    const { userId } = useContext(AuthContext);
    const [mensagens, setMensagens] = useState([]);
    const [novaMensagem, setNovaMensagem] = useState("");
    const [parceiro, setParceiro] = useState(null);
    const [digitando, setDigitando] = useState(false);
    const [usuarioDigitando, setUsuarioDigitando] = useState(false);

    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);
    const API_URL = process.env.REACT_APP_API_BASE_URL;

    // 🔹 Conectar ao socket e entrar na sala
    useEffect(() => {
        socketRef.current = io(API_URL, {
            transports: ["websocket"],
        });

        socketRef.current.emit("entrar_chat", chatId);

        // Recebe mensagens em tempo real
        socketRef.current.on("nova_mensagem", (msg) => {
            setMensagens((prev) => [...prev, msg]);
        });

        // Alguém começou/parou de digitar
        socketRef.current.on("usuario_digitando", (usuario_id) => {
            if (usuario_id !== userId) setUsuarioDigitando(true);
        });
        socketRef.current.on("usuario_parou_digitar", (usuario_id) => {
            if (usuario_id !== userId) setUsuarioDigitando(false);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [API_URL, chatId, userId]);

    // 🔹 Carregar histórico e parceiro
    useEffect(() => {
        const carregarChat = async () => {
            try {
                const resChat = await fetch(`${API_URL}/chat/${chatId}`);
                const chat = await resChat.json();

                const parceiroData =
                    chat.usuario1_id === userId
                        ? { nome: chat.nome2, avatar: chat.avatar2 }
                        : { nome: chat.nome1, avatar: chat.avatar1 };

                setParceiro(parceiroData);

                const resMsgs = await fetch(`${API_URL}/chat/mensagens/${chatId}`);
                const msgs = await resMsgs.json();
                setMensagens(msgs);
            } catch (err) {
                console.error("Erro ao carregar chat:", err);
            }
        };
        carregarChat();
    }, [chatId, API_URL, userId]);

    // 🔹 Scroll automático
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensagens]);

    // Enviar mensagem via socket
    const enviarMensagem = (e) => {
        e.preventDefault();
        if (!novaMensagem.trim()) return;

        const msg = {
            chat_id: chatId,
            remetente_id: userId,
            conteudo: novaMensagem,
        };

        // Envia pro backend (socket)
        socketRef.current.emit("enviar_mensagem", msg);

        setNovaMensagem("");
        socketRef.current.emit("parou_digitar", { chat_id: chatId, usuario_id: userId });
    };



    // 🔹 Controle de “digitando...”
    const handleChange = (e) => {
        setNovaMensagem(e.target.value);

        if (!digitando) {
            setDigitando(true);
            socketRef.current.emit("digitando", { chat_id: chatId, usuario_id: userId });
        }

        clearTimeout(window.digitarTimeout);
        window.digitarTimeout = setTimeout(() => {
            setDigitando(false);
            socketRef.current.emit("parou_digitar", { chat_id: chatId, usuario_id: userId });
        }, 1000);
    };

    return (
        <div className="container mt-4" style={{ maxWidth: 700 }}>
            {/* 🔹 Cabeçalho */}
            <div className="d-flex align-items-center mb-3 border-bottom pb-2">
                {parceiro ? (
                    <>
                        <img
                            src={
                                parceiro.avatar
                                    ? parceiro.avatar.startsWith("http")
                                        ? parceiro.avatar
                                        : `${API_URL}/${parceiro.avatar}`
                                    : "/user.png"
                            }
                            alt={parceiro.nome}
                            className="rounded-circle me-3"
                            style={{ width: 50, height: 50, objectFit: "cover" }}
                        />
                        <h5 className="m-0">{parceiro.nome}</h5>
                    </>
                ) : (
                    <h5>Carregando...</h5>
                )}
            </div>

            {/* 🔹 Mensagens */}
            <div
                className="border rounded p-3 mb-3 bg-light"
                style={{ height: "60vh", overflowY: "auto" }}
            >
                {mensagens.map((m) => (
                    <div
                        key={m.id}
                        className={`d-flex mb-2 ${
                            m.remetente_id === userId
                                ? "justify-content-end"
                                : "justify-content-start"
                        }`}
                    >
                        <div
                            className={`p-2 rounded ${
                                m.remetente_id === userId
                                    ? "bg-primary text-white"
                                    : "bg-white border"
                            }`}
                            style={{ maxWidth: "75%" }}
                        >
                            {m.conteudo}
                            <div className="text-muted small text-end mt-1">
                                {new Date(m.criado_em).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {usuarioDigitando && (
                    <div className="text-muted small fst-italic">Digitando...</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 🔹 Campo de envio */}
            <form onSubmit={enviarMensagem} className="d-flex gap-2">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Digite sua mensagem..."
                    value={novaMensagem}
                    onChange={handleChange}
                />
                <button className="btn btn-primary" type="submit">
                    Enviar
                </button>
            </form>
        </div>
    );
}

export default ChatView;
