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
                setUsuarios(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados dos usuários:", error);
                setError(error.toString());
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
                    setError(error.toString());
                });
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Usuários</h1>
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead className="bg-gray-200">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Email</th>
                        <th scope="col" className="px-6 py-3">Gênero</th>
                        <th scope="col" className="px-6 py-3">Idade</th>
                        <th scope="col" className="px-6 py-3">Função</th>
                        <th scope="col" className="px-6 py-3"></th>
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
                            <td className="px-6 py-4">{usuario.funcao}</td>
                            <td className="px-6 py-4">
                                <Link to={`/usuarios/view/${usuario.id}`} className="btn btn-info mr-2">Ver</Link>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(usuario.id)}>
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
}

export default Usuarios_index;