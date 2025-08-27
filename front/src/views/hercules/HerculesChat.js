import { useState, useContext } from "react";
import { AuthContext } from "../../AuthContext";

function HerculesChat() {
    const [msg, setMsg] = useState("");
    const [chat, setChat] = useState([]);
    const [loading, setLoading] = useState(false);
    const { userId } = useContext(AuthContext);

    // 🔹 Guardar última meta completa do Hércules (acao/dia/tipo/plano/exercicios_ids)
    const [ultimaMeta, setUltimaMeta] = useState(null);

    const enviar = async (extra = {}) => {
        if (!msg.trim() && !extra.confirmado) return;

        const novaMsg = extra.confirmado ? null : { autor: "Você", texto: msg };
        if (novaMsg) setChat([...chat, novaMsg]);

        setLoading(true);
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/hercules/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mensagem: msg,
                    usuarioId: userId,
                    ...ultimaMeta,   // 👈 reenvia meta original (inclui plano e exercicios_ids)
                    ...extra
                })
            });

            const data = await res.json();

            // 🔹 Salvar última meta recebida do Hércules (vai incluir plano/exercicios_ids quando houver)
            setUltimaMeta(data);

            setChat(prev => [...prev, { autor: "Hércules", texto: data.texto, meta: data }]);
            setMsg("");
        } catch (err) {
            console.error(err);
            setChat(prev => [...prev, { autor: "Hércules", texto: "⚠️ Erro ao falar com Hércules." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">🤖 Hércules (Chat)</h2>

            {/* Caixa de mensagens */}
            <div className="border rounded p-3 mb-3" style={{ minHeight: "300px", background: "#f8f9fa" }}>
                {chat.length === 0 && <p className="text-muted text-center">Converse com o Hércules digitando abaixo...</p>}
                {chat.map((c, i) => (
                    <div key={i} className={`mb-3 ${c.autor === "Você" ? "text-end" : "text-start"}`}>
                        <div
                            className={`d-inline-block px-3 py-2 rounded shadow-sm ${c.autor === "Você" ? "bg-primary text-white" : "bg-light border"}`}
                            style={{ maxWidth: "75%" }}
                        >
                            <strong>{c.autor}:</strong> {c.texto}
                        </div>

                        {/* Se Hércules pediu confirmação, renderiza botões */}
                        {c.autor === "Hércules" && c.meta?.confirmado === false && (
                            <div className="mt-2">
                                <button
                                    className="btn btn-success btn-sm me-2"
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
                {loading && <p className="text-muted"><i>Hércules está pensando...</i></p>}
            </div>

            {/* Campo de input + botão */}
            <div className="input-group">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Fale com o Hércules..."
                    value={msg}
                    onChange={(e) => setMsg(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && enviar()}
                />
                <button className="btn btn-primary" type="button" onClick={() => enviar()} disabled={loading}>
                    {loading ? "Enviando..." : "Enviar"}
                </button>
            </div>
        </div>
    );
}

export default HerculesChat;
