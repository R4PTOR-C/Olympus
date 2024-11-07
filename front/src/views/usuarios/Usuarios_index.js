import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Usuarios_index = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        setLoading(true);
        fetch(`${apiUrl}/usuarios`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor');
                }
                return response.json();
            })
            .then(data => {
                // Filtra apenas os usuários com função "Aluno"
                const alunos = data.filter(usuario => usuario.funcao === "Aluno");
                setUsuarios(alunos);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados dos usuários:", error);
                setError("Erro ao carregar dados dos usuários. Tente novamente mais tarde.");
                setLoading(false);
            });
    }, [apiUrl]);

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja deletar este usuário?")) {
            fetch(`${apiUrl}/usuarios/${id}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao deletar o usuário');
                    }
                    setUsuarios(usuarios.filter(usuario => usuario.id !== id));
                })
                .catch(error => {
                    console.error("Erro ao deletar o usuário:", error);
                    setError("Erro ao tentar deletar o usuário. Tente novamente.");
                });
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="text-danger">Erro: {error}</div>;

    return (
        <div className="overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Alunos</h1>
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead className="bg-gray-200">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Email</th>
                        <th scope="col" className="px-6 py-3">Gênero</th>
                        <th scope="col" className="px-6 py-3">Idade</th>
                        <th scope="col" className="px-6 py-3">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map(usuario => (
                        <tr key={usuario.id}>
                            <th scope="row" className="px-6 py-4">{usuario.id}</th>
                            <td className="px-6 py-4">{usuario.nome}</td>
                            <td className="px-6 py-4">{usuario.email}</td>
                            <td className="px-6 py-4">{usuario.genero}</td>
                            <td className="px-6 py-4">{usuario.idade}</td>
                            <td className="px-6 py-4">
                                <Link to={`/usuarios/${usuario.id}/treinos`} className="btn btn-success me-2">Criar Treino</Link>
                                <Link to={`/usuarios/view/${usuario.id}`} className="btn btn-info me-2">Ver</Link>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(usuario.id)}
                                >
                                    Deletar
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Usuarios_index;
