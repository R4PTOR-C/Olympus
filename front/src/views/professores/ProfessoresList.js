import React, { useEffect, useState,useContext } from "react";
import { AuthContext } from "../../AuthContext";
import { useNavigate } from "react-router-dom";


function ProfessoresList() {
    const [professores, setProfessores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const API_URL = process.env.REACT_APP_API_BASE_URL;
    const { userId } = useContext(AuthContext); // pega ID do aluno logado
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfessores = async () => {
            try {
                const res = await fetch(`${API_URL}/professores`);
                if (!res.ok) throw new Error("Erro ao buscar professores.");
                const data = await res.json();
                setProfessores(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProfessores();
    }, [API_URL]);

    const iniciarChat = async (professorId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/chat/iniciar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    usuario1_id: userId,
                    usuario2_id: professorId,
                }),
            });

            const chat = await res.json();
            navigate(`/chat/${chat.id}`);
        } catch (err) {
            console.error("Erro ao iniciar chat:", err);
        }
    };

    if (loading) return <div className="text-center mt-5">Carregando professores...</div>;
    if (error) return <div className="alert alert-danger mt-5 text-center">{error}</div>;

    return (
        <div className="container mt-4">
            <h2 className="text-center mb-4">Professores Disponíveis</h2>

            {professores.length === 0 ? (
                <p className="text-center">Nenhum professor cadastrado ainda.</p>
            ) : (
                <div className="row">
                    {professores.map((p) => (
                        <div className="col-md-4 mb-4" key={p.usuario_id}>
                            <div className="card shadow-sm h-100">
                                <div className="card-body text-center">
                                    <img
                                        src={
                                            p.avatar
                                                ? p.avatar.startsWith("http")
                                                    ? p.avatar
                                                    : `${API_URL}/${p.avatar}`
                                                : "/user.png"
                                        }
                                        alt={p.nome}
                                        className="rounded-circle mb-3"
                                        style={{
                                            width: "100px",
                                            height: "100px",
                                            objectFit: "cover",
                                            border: "2px solid #dee2e6",
                                        }}
                                    />

                                    <h5 className="card-title">{p.nome}</h5>
                                    <p className="text-muted mb-1">{p.especialidade || "Sem especialidade"}</p>
                                    <p className="mb-1">
                                        <strong>{p.cidade}</strong> - {p.estado}
                                    </p>
                                    {p.preco_hora && (
                                        <p className="mb-1">
                                            💰 <strong>R$ {Number(p.preco_hora).toFixed(2)}</strong> / hora
                                        </p>
                                    )}
                                    {p.contato && (
                                        <button
                                            onClick={() => iniciarChat(p.usuario_id)}
                                            className="btn btn-primary mt-2"
                                        >
                                            Conversar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProfessoresList;
