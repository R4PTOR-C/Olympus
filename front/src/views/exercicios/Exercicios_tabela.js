import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Exercicios_tabela = () => {
    const [exercicios, setExercicios] = useState([]);
    const [filteredExercicios, setFilteredExercicios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const apiUrl = process.env.REACT_APP_API_BASE_URL;

    useEffect(() => {
        setLoading(true);
        fetch(`${apiUrl}/exercicios`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor');
                }
                return response.json();
            })
            .then(data => {
                setExercicios(data);
                setFilteredExercicios(data); // Inicia a lista filtrada com todos os exercícios
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados dos exercícios:", error);
                setError("Erro ao carregar dados dos exercícios. Tente novamente mais tarde.");
                setLoading(false);
            });
    }, [apiUrl]);

    const handleDelete = (id) => {
        if (window.confirm("Tem certeza que deseja deletar este exercício?")) {
            fetch(`${apiUrl}/exercicios/${id}`, {
                method: 'DELETE',
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao deletar o exercício');
                    }
                    setExercicios(exercicios.filter(exercicio => exercicio.id !== id));
                    setFilteredExercicios(filteredExercicios.filter(exercicio => exercicio.id !== id));
                })
                .catch(error => {
                    console.error("Erro ao deletar o exercício:", error);
                    setError("Erro ao tentar deletar o exercício. Tente novamente.");
                });
        }
    };

    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        if (term) {
            const filtered = exercicios.filter(exercicio =>
                (exercicio.nome_exercicio && exercicio.nome_exercicio.toLowerCase().includes(term.toLowerCase())) ||
                (exercicio.grupo_muscular && exercicio.grupo_muscular.toLowerCase().includes(term.toLowerCase()))
            );
            setFilteredExercicios(filtered);
        } else {
            setFilteredExercicios(exercicios); // Mostra todos se o termo de busca estiver vazio
        }
    };


    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="text-danger">Erro: {error}</div>;

    return (
        <div className="container mt-5">
            <h1 className="text-2xl font-bold mb-4">Exercícios</h1>

            {/* Campo de pesquisa */}
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar por nome ou grupo muscular..."
                    className="form-control"
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            {/* Tabela para telas maiores */}
            <div className="table-responsive d-none d-lg-block">
                <table className="table table-hover">
                    <thead className="bg-gray-200">
                    <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Nome</th>
                        <th scope="col">Grupo Muscular</th>
                        <th scope="col">Nível</th>
                        <th scope="col">gif</th>
                        <th scope="col">Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredExercicios.map(exercicio => (
                        <tr key={exercicio.id}>
                            <th scope="row">{exercicio.id}</th>
                            <td>{exercicio.nome_exercicio}</td>
                            <td>{exercicio.grupo_muscular}</td>
                            <td>{exercicio.nivel}</td>
                            <td>{exercicio.gif_url}</td>

                            <td>
                                <Link to={`/exercicios/edit/${exercicio.id}`}
                                      className="btn btn-warning me-2">Editar</Link>
                                <Link to={`/exercicios/view/${exercicio.id}`} className="btn btn-info me-2">Ver</Link>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(exercicio.id)}
                                >
                                    Deletar
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* Cards para telas menores */}
            <div className="d-lg-none">
                {filteredExercicios.map(exercicio => (
                    <div key={exercicio.id} className="card mb-3">
                        <div className="card-body">
                            <h5 className="card-title">{exercicio.nome_exercicio}</h5>
                            <p className="card-text"><strong>ID:</strong> {exercicio.id}</p>
                            <p className="card-text"><strong>Grupo Muscular:</strong> {exercicio.grupo_muscular}</p>
                            <p className="card-text"><strong>Nível:</strong> {exercicio.nivel}</p>
                            <div className="card-actions">
                                <Link to={`/exercicios/edit/${exercicio.id}`} className="btn btn-warning me-2">Editar</Link>
                                <Link to={`/exercicios/view/${exercicio.id}`} className="btn btn-info me-2">Ver</Link>
                                <button
                                    className="btn btn-danger"
                                    onClick={() => handleDelete(exercicio.id)}
                                >
                                    Deletar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Exercicios_tabela;
