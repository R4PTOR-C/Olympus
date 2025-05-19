import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

const Usuarios_view = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId, funcao } = useContext(AuthContext);


    useEffect(() => {
        const carregarDados = async () => {
            // Impede usuários comuns de acessar a view de outro usuário
            if (funcao !== 'Professor' && parseInt(id) !== parseInt(userId)) {
                navigate(`/usuarios/view/${userId}`);
                return; // evita continuar carregando dados indevidamente
            }

            try {
                const [usuarioRes, treinosRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`)
                ]);

                if (!usuarioRes.ok) throw new Error('Erro ao buscar os dados do usuário');
                if (!treinosRes.ok) throw new Error('Erro ao buscar os treinos do usuário');

                const usuarioData = await usuarioRes.json();
                const treinosData = await treinosRes.json();

                // Carregar exercícios de cada treino
                const treinosComExercicios = await Promise.all(
                    treinosData.map(async (treino) => {
                        const exerciciosRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treino.id}/exercicios`);
                        const exerciciosData = await exerciciosRes.json();
                        return { ...treino, exercicios: exerciciosData || [] };
                    })
                );

                setUsuario(usuarioData);
                setTreinos(treinosComExercicios);
                setLoading(false);
            } catch (err) {
                console.error('Erro ao carregar dados:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        carregarDados();
    }, [id, userId, funcao, navigate]);


    const handleDeleteTreino = async (treinoId) => {
        const confirmDelete = window.confirm("Tem certeza que deseja excluir este treino?");
        if (!confirmDelete) return;

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setTreinos(treinos.filter(treino => treino.id !== treinoId));
                alert("Treino excluído com sucesso.");
            } else {
                alert("Erro ao excluir o treino.");
            }
        } catch (error) {
            console.error('Erro ao excluir treino:', error);
            alert("Erro ao excluir o treino.");
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    // Construir a URL da imagem do avatar se existir
    const avatarUrl = usuario && usuario.avatar ? `${process.env.REACT_APP_API_BASE_URL}/uploads/${usuario.avatar}` : null;

    return (
        <div className="container mt-5">
            <h2>Detalhes do Aluno</h2>
            {usuario ? (
                <div>
                    <div className="d-flex align-items-start mb-4">
                        {/* Imagem do avatar */}
                        {avatarUrl && (
                            <img
                                src={avatarUrl}
                                alt="Avatar do usuário"
                                className="img-thumbnail me-4"
                                style={{ width: '200px', height: '200px', objectFit: 'cover', backgroundColor: '#E8E8E9' }}
                            />
                        )}

                        {/* Informações do usuário */}
                        <div>
                            <p><strong>Nome:</strong> {usuario.nome}</p>
                            <p><strong>Email:</strong> {usuario.email}</p>
                            <p><strong>Gênero:</strong> {usuario.genero}</p>
                            <p><strong>Idade:</strong> {usuario.idade}</p>
                        </div>
                    </div>

                    <h3>Treinos</h3>
                    <div className="row">
                        {treinos.length > 0 ? (
                            treinos.map(treino => (
                                <div className="col-md-4" key={treino.id}>
                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <h5 className="card-title">{treino.nome_treino}</h5>
                                            <p className="card-text"><strong>Descrição:</strong> {treino.descricao}</p>
                                            <p className="card-text"><strong>Dia da Semana:</strong> {treino.dia_semana}</p>
                                            <h6>Exercícios:</h6>
                                            {Array.isArray(treino.exercicios) && treino.exercicios.length > 0 ? (
                                                <ul>
                                                    {treino.exercicios.map(exercicio => (
                                                        <li key={exercicio.id}>{exercicio.nome_exercicio}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>Sem exercícios cadastrados.</p>
                                            )}
                                            <div className="d-flex justify-content-between">
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => handleDeleteTreino(treino.id)}
                                                >
                                                    Excluir
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => navigate(`/treinos/edit/${id}/${treino.id}`)}
                                                >
                                                    Editar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>Esse usuário não tem treinos cadastrados.</p>
                        )}
                    </div>
                </div>
            ) : (
                <p>Usuário não encontrado</p>
            )}
        </div>
    );
};

export default Usuarios_view;
