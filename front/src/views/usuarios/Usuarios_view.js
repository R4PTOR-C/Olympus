import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

const UsuariosView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId, funcao } = useContext(AuthContext);

    useEffect(() => {
        const carregarDados = async () => {
            if (funcao !== 'Professor' && parseInt(id) !== parseInt(userId)) {
                navigate(`/usuarios/view/${userId}`);
                return;
            }

            try {
                const [usuarioRes, treinosRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`)
                ]);

                if (!usuarioRes.ok || !treinosRes.ok) throw new Error('Erro ao carregar dados');

                const usuarioData = await usuarioRes.json();
                const treinosData = await treinosRes.json();

                const treinosComExercicios = await Promise.all(
                    treinosData.map(async (treino) => {
                        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treino.id}/exercicios`);
                        const dados = await res.json();
                        return { ...treino, exercicios: dados || [] };
                    })
                );

                setUsuario(usuarioData);
                setTreinos(treinosComExercicios);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        carregarDados();
    }, [id, userId, funcao, navigate]);

    const handleDeleteTreino = async (treinoId) => {
        if (!window.confirm("Tem certeza que deseja excluir este treino?")) return;

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error();
            setTreinos(treinos.filter(t => t.id !== treinoId));
            alert("Treino excluído com sucesso.");
        } catch {
            alert("Erro ao excluir treino.");
        }
    };

    if (loading) return <div className="text-center mt-5">Carregando...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">Erro: {error}</div>;
    if (!usuario) return <div className="text-center mt-5">Usuário não encontrado.</div>;

    const avatarUrl = usuario.avatar || null;


    return (
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4">Perfil do Aluno</h2>

            <div className="d-flex flex-column align-items-center mb-4">
                {avatarUrl && (
                    <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="rounded-circle mb-3"
                        style={{ width: 140, height: 140, objectFit: 'cover' }}
                    />
                )}
                <h4 className="mb-1">{usuario.nome}</h4>
                <p className="text-muted mb-0">{usuario.email}</p>
                <p className="text-muted">Idade: {usuario.idade} | Gênero: {usuario.genero}</p>
            </div>

            <h3 className="mb-3">Treinos</h3>
            <div className="mb-3 text-end">
                <button
                    className="btn btn-success"
                    onClick={() => navigate(`/usuarios/${id}/treinos`)}
                >
                    + Criar Novo Treino
                </button>
            </div>
            <div className="row">
                {treinos.length > 0 ? (
                    treinos.map(treino => (
                        <div className="col-md-6 col-lg-4 mb-4" key={treino.id}>
                            <div className="card h-100 shadow-sm">
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{treino.nome_treino}</h5>
                                    <p className="mb-1"><strong>Descrição:</strong> {treino.descricao}</p>
                                    <p><strong>Dia da Semana:</strong> {treino.dia_semana}</p>
                                    <h6>Exercícios:</h6>
                                    {treino.exercicios.length > 0 ? (
                                        <ul className="mb-3">
                                            {treino.exercicios.map((e, i) => (
                                                <li key={e.exercicio_id || e.id || `${treino.id}-ex-${i}`}>
                                                    {e.nome_exercicio}
                                                </li>
                                            ))}

                                        </ul>
                                    ) : (
                                        <p className="text-muted">Sem exercícios cadastrados.</p>
                                    )}
                                    <div className="mt-auto d-flex justify-content-between">
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDeleteTreino(treino.id)}
                                        >
                                            Excluir
                                        </button>
                                        <button
                                            className="btn btn-sm btn-primary"
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
                    <p className="text-muted">Este aluno ainda não possui treinos.</p>
                )}
            </div>
        </div>
    );
};

export default UsuariosView;
