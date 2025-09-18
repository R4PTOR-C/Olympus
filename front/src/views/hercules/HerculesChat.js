import { useState, useContext } from "react";
import { AuthContext } from "../../AuthContext";
import "../../styles/HerculesChat.css"; // 👈 importa o CSS novo

function HerculesChat() {
    const [msg, setMsg] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userId } = useContext(AuthContext);

    const [ultimaMeta, setUltimaMeta] = useState(null);



    const enviar = async (extra = {}) => {
        if (!msg.trim() && !extra.confirmado) return;

        const novaMsg = extra.confirmado ? null : { autor: "Você", texto: msg };
        if (novaMsg) setChat([...chat, novaMsg]);

        setMsg(""); // ✅ limpa imediatamente


        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/hercules/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensagem: msg,
                    usuarioId: userId,
                    ...ultimaMeta,
                    ...extra,
                }),
            });

            const data = await res.json();
            setUltimaMeta(data);

            setChat((prev) => [...prev, { autor: "Hércules", texto: data.texto, meta: data }]);
            setMsg("");
        } catch (err) {
            console.error(err);
            setChat((prev) => [...prev, { autor: "Hércules", texto: "⚠️ Erro ao falar com Hércules." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            {/* Cabeçalho */}
            <div className="chat-header">
                <img src="/hercules2.png" alt="Hércules" className="header-icon" />
                HÉRCULES
            </div>

            {/* Área de mensagens */}
            <div className="chat-body">
                {chat.length === 0 && (
                    <p className="text-muted text-center mt-3">
                        Converse com o Hércules digitando abaixo...
                    </p>
                )}
                {chat.map((c, i) => (
                    <div
                        key={i}
                        className={`chat-message ${c.autor === "Você" ? "me" : "hercules"}`}
                    >
                        <div className="bubble">
                            <strong>{c.autor}:</strong> {c.texto}
                        </div>

                        {c.autor === "Hércules" && c.meta?.confirmado === false && (
                            <div className="mt-2 d-flex gap-2">
                                <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => enviar({ confirmado: true })}
                                >
                                    Confirmar
                                </button>
                                <button
                                    className="btn btn-outline-secondary btn-sm"
                                    onClick={() => setMsg("")}
                                >
                                    Alterar
                                </button>
                            </div>
                        )}
                    </div>
                ))}
                {loading && (
                    <div className="chat-message hercules">
                        <div className="bubble typing">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input fixo */}
            <div className="chat-input">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Fale com o Hércules..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && enviar()}
                />
                <button
                    className="btn btn-primary send-btn"
                    onClick={() => enviar()}
                    disabled={loading}
                >
                    ➤
                </button>
            </div>
        </div>
    );
}

export default HerculesChat;
