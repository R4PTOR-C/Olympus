import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../AuthContext";

function ChatsList() {
    const { userId } = useContext(AuthContext);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await fetch(`${API_URL}/chat/usuario/${userId}`);
                const data = await res.json();
                setChats(data);
            } catch (err) {
                console.error("Erro ao carregar chats:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchChats();
    }, [userId, API_URL]);

    if (loading) return <div className="text-center mt-5">Carregando chats...</div>;

    return (
        <div className="container mt-4" style={{ maxWidth: 700 }}>
            <h2 className="text-center mb-4">Minhas Conversas</h2>

            {chats.length === 0 ? (
                <p className="text-center">Nenhum chat iniciado ainda.</p>
            ) : (
                <div className="list-group shadow-sm">
                    {chats.map((c) => (
                        <button
                            key={c.chat_id}
                            className="list-group-item list-group-item-action d-flex align-items-center justify-content-between"
                            onClick={() => navigate(`/chat/${c.chat_id}`)}
                        >
                            <div className="d-flex align-items-center">
                                <img
                                    src={
                                        c.parceiro_avatar
                                            ? c.parceiro_avatar.startsWith("http")
                                                ? c.parceiro_avatar
                                                : `${API_URL}/${c.parceiro_avatar}`
                                            : "/user.png"
                                    }
                                    alt={c.parceiro_nome}
                                    className="rounded-circle me-3"
                                    style={{ width: 50, height: 50, objectFit: "cover" }}
                                />
                                <div className="text-start">
                                    <strong>{c.parceiro_nome}</strong>
                                    <div className="text-muted small">
                                        {c.ultima_mensagem || "Sem mensagens ainda"}
                                    </div>
                                </div>
                            </div>
                            <span className="text-muted small">
                {c.ultima_data
                    ? new Date(c.ultima_data).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })
                    : ""}
              </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ChatsList;
