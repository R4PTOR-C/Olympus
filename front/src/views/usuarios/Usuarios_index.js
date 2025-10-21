import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Usuarios_index = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

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
                const alunos = data.filter(usuario => usuario.funcao === "Aluno");
                setUsuarios(alunos);
                setFilteredUsuarios(alunos);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados dos usuários:", error);
                setError("Erro ao carregar dados dos usuários. Tente novamente mais tarde.");
                setLoading(false);
            });
    }, [apiUrl]);

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term) {
            const filtered = usuarios.filter(usuario =>
                usuario.nome.toLowerCase().includes(term.toLowerCase()) ||
                usuario.email.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredUsuarios(filtered);
        } else {
            setFilteredUsuarios(usuarios);
        }
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="text-danger">Erro: {error}</div>;

    return (
        <div className="container mt-5">
            <h1 className="text-2xl font-bold mb-4">Alunos</h1>

            {/* Tabela para telas maiores */}
            <div className="table-responsive d-none d-lg-block">
                {/* Campo de pesquisa */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        className="form-control"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                <table className="table table-hover">
                    <thead className="bg-gray-200">
                    <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Nome</th>
                        <th scope="col">Email</th>
                        <th scope="col">Gênero</th>
                        <th scope="col">Idade</th>
                        <th scope="col">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredUsuarios.map(usuario => (
                        <tr key={usuario.id}>
                            <th scope="row">{usuario.id}</th>
                            <td>{usuario.nome}</td>
                            <td>{usuario.email}</td>
                            <td>{usuario.genero}</td>
                            <td>{usuario.idade}</td>
                            <td>
                                <Link to={`/usuarios/${usuario.id}/treinos`} className="btn btn-success me-2">Criar Treino</Link>
                                <Link to={`/usuarios/view/${usuario.id}`} className="btn btn-info">Ver</Link>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Cards para telas menores */}
            <div className="d-lg-none">
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        className="form-control"
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                </div>
                {filteredUsuarios.map(usuario => (
                    <div key={usuario.id} className="card mb-3">
                        <div className="card-body">
                            <h5 className="card-title">{usuario.nome}</h5>
                            <p className="card-text"><strong>ID:</strong> {usuario.id}</p>
                            <p className="card-text"><strong>Email:</strong> {usuario.email}</p>
                            <p className="card-text"><strong>Gênero:</strong> {usuario.genero}</p>
                            <p className="card-text"><strong>Idade:</strong> {usuario.idade}</p>
                            <div className="card-actions">
                                <Link to={`/usuarios/${usuario.id}/treinos`} className="btn btn-success me-2">Criar Treino</Link>
                                <Link to={`/usuarios/view/${usuario.id}`} className="btn btn-info">Ver</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Usuarios_index;
