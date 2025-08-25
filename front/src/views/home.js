// Home.js
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import PageStateHandler from "./components/PageStateHandler";
import { AuthContext } from "../AuthContext"; // importa o contexto
import '../styles/home.css';
import ModalCarregando from './components/ModalCarregando'; // 👈 importa a modal de loading

function Home() {
    const { darkMode } = useContext(AuthContext); // pega o darkMode global
    const [user, setUser] = useState({ loggedIn: false, userName: '', userId: null });
    const [treinos, setTreinos] = useState([]);
    const [exerciciosTreinoDoDia, setExerciciosTreinoDoDia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/');
            return;
        }

        // aplica a classe do tema sempre que darkMode mudar
        if (darkMode) {
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.remove("dark-mode");
        }

        fetch(`${process.env.REACT_APP_API_BASE_URL}/session`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(response => response.json())
            .then(data => {
                if (data.loggedIn) {
                    setUser({ loggedIn: true, userName: data.userName, userId: data.userId });
                    fetchTreinos(data.userId, token);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Erro ao verificar sessão:', err);
                setError('Erro ao verificar sessão');
                setLoading(false);
            });
    }, [navigate, darkMode]); // agora darkMode vem do AuthContext

    const fetchTreinos = async (userId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao buscar os treinos');

            const data = await response.json();
            setTreinos(data);

            const today = getToday();
            const treinoDoDia = data.find(treino => treino.dia_semana === today);
            if (treinoDoDia) {
                fetchExerciciosTreino(treinoDoDia.id, token);
            }
        } catch (err) {
            console.error('Erro ao buscar treinos:', err);
            setError('Erro ao buscar os treinos');
        }
    };

    const fetchExerciciosTreino = async (treinoId, token) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao buscar os exercícios do treino');

            const data = await response.json();
            setExerciciosTreinoDoDia(data.slice(0, 4));
        } catch (err) {
            console.error('Erro ao buscar exercícios do treino:', err);
            setError('Erro ao buscar os exercícios do treino');
        }
    };

    const getToday = () => {
        const days = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        return days[new Date().getDay()];
    };

    const treinoImagemUrl = (imagem) => `${process.env.REACT_APP_API_BASE_URL}/uploads/${imagem}`;

    const today = getToday();
    const treinoDoDia = treinos.find(treino => treino.dia_semana === today);
    const proximosTreinos = treinos.filter(treino => treino.dia_semana !== today);

    if (loading) return <ModalCarregando show={true} />; // 👈 agora usa o overlay padronizado
    if (error) return <div>Erro: {error}</div>;

    return (
        <PageStateHandler>
            <div className="container mt-4">
                {user.loggedIn ? (
                    <div
                        className="d-flex flex-column flex-md-row gap-4"
                        style={{ alignItems: "stretch" }}
                    >
                        {/* Treino do Dia */}
                        <div className="flex-fill">
                            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Treino do Dia</h2>
                            {treinoDoDia ? (
                                <div
                                    className="card mb-4 home-card-clickable shadow-sm"
                                    onClick={() => navigate(`/treinos/${treinoDoDia.id}/exercicios`)}
                                    style={{
                                        cursor: "pointer",
                                        borderRadius: "12px",
                                        overflow: "hidden"
                                    }}
                                >
                                    <div className="d-flex align-items-center flex-column flex-sm-row">
                                        <img
                                            src={treinoImagemUrl(treinoDoDia.imagem)}
                                            alt={`Imagem do treino ${treinoDoDia.nome_treino}`}
                                            className="home-card-image-lg"
                                            style={{
                                                marginRight: "1rem",
                                                marginBottom: "1rem",
                                                maxWidth: "200px",
                                                objectFit: "contain"
                                            }}
                                        />
                                        <div className="card-body p-0">
                                            <h5 style={{ fontSize: "1.2rem", fontWeight: "600" }}>
                                                {treinoDoDia.nome_treino}
                                            </h5>
                                            <p style={{ marginBottom: "0.5rem" }}>
                                                <strong>Descrição:</strong> {treinoDoDia.descricao}
                                            </p>
                                            <p style={{ marginBottom: "0.5rem" }}>
                                                <strong>Dia da Semana:</strong> {treinoDoDia.dia_semana}
                                            </p>

                                            <div className="mt-2">
                                                <h6 style={{ fontSize: "1rem", fontWeight: "500" }}>Exercícios:</h6>
                                                <ul style={{ paddingLeft: "1.2rem" }}>
                                                    {exerciciosTreinoDoDia.map((exercicio) => (
                                                        <li
                                                            key={exercicio.exercicio_id}
                                                            style={{ fontSize: "0.95rem" }}
                                                        >
                                                            {exercicio.nome_exercicio}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p>Não há treino para hoje.</p>
                            )}
                        </div>

                        {/* Próximos Treinos */}
                        <div className="flex-fill">
                            <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Próximos Treinos</h2>
                            {proximosTreinos.length > 0 ? (
                                proximosTreinos.map((treino) => (
                                    <div
                                        className="card mb-3 home-next-card shadow-sm"
                                        key={treino.id}
                                        onClick={() => navigate(`/treinos/${treino.id}/exercicios`)}
                                        style={{
                                            cursor: "pointer",
                                            borderRadius: "12px",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <div className="d-flex align-items-center">
                                            <img
                                                src={treinoImagemUrl(treino.imagem)}
                                                alt={`Imagem do treino ${treino.nome_treino}`}
                                                className="home-next-img"
                                                style={{
                                                    marginRight: "1rem",
                                                    maxWidth: "120px",
                                                    objectFit: "contain"
                                                }}
                                            />
                                            <div className="card-body p-0">
                                                <h5 style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                                                    {treino.nome_treino}
                                                </h5>
                                                <p style={{ marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                                                    <strong>Dia:</strong> {treino.dia_semana}
                                                </p>
                                                <p style={{ marginBottom: "0.4rem", fontSize: "0.95rem" }}>
                                                    <strong>Descrição:</strong> {treino.descricao}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>Não há próximos treinos cadastrados.</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p>Você não está logado.</p>
                )}
            </div>
        </PageStateHandler>
    );


}

export default Home;
