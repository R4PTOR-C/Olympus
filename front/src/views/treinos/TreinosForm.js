import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import "../../styles/TreinosForm.css"

const TreinosForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [grupoMuscular, setGrupoMuscular] = useState('');
    const [exercicios, setExercicios] = useState([]);
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExercicios, setFilteredExercicios] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`)
            .then(res => res.json())
            .then(data => {
                setExercicios(data);
                setFilteredExercicios(data);
            });
    }, []);

    useEffect(() => {
        const filtered = exercicios.filter(ex =>
            (ex.nome_exercicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ex.grupo_muscular?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredExercicios(filtered);
        setCurrentPage(1);
    }, [searchTerm, exercicios]);

    const handleExercicioChange = (id) => {
        setExerciciosSelecionados(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!nomeTreino || !descricao || !diaSemana || !grupoMuscular || exerciciosSelecionados.length === 0) {
            alert('Preencha todos os campos e selecione ao menos um exercício.');
            return;
        }

        const treino = { nome_treino: nomeTreino, descricao, dia_semana: diaSemana, grupo_muscular: grupoMuscular };

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(treino)
        });

        if (!res.ok) return alert('Erro ao criar treino.');

        const novoTreino = await res.json();

        await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${novoTreino.id}/exercicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercicios: exerciciosSelecionados })
        });

        alert('Treino criado com sucesso!');
        navigate(`/usuarios/view/${id}`);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredExercicios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExercicios.length / itemsPerPage);

    return (
        <div className="container mt-5 mb-5">
            <div className="card shadow-lg border-0">
                <div className="card-header text-white text-center py-3 rounded-top">
                    <h3 className="mb-0"><i className="bi bi-clipboard-plus me-2"></i>Criar Novo Treino</h3>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        {/* Nome */}
                        <div className="mb-3">
                            <label htmlFor="nomeTreino" className="form-label">Nome do Treino</label>
                            <input
                                type="text"
                                className="form-control"
                                id="nomeTreino"
                                placeholder="Digite o nome do treino"
                                value={nomeTreino}
                                onChange={(e) => setNomeTreino(e.target.value)}
                                required
                            />
                        </div>

                        {/* Descrição */}
                        <div className="mb-3">
                            <label htmlFor="descricaoTreino" className="form-label">Descrição</label>
                            <textarea
                                className="form-control"
                                id="descricaoTreino"
                                placeholder="Digite a descrição do treino"
                                style={{ height: '100px' }}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                required
                            />
                        </div>

                        {/* Dia da semana */}
                        <div className="mb-3">
                            <label htmlFor="diaSemana" className="form-label">Dia da Semana</label>
                            <select
                                className="form-select"
                                id="diaSemana"
                                value={diaSemana}
                                onChange={(e) => setDiaSemana(e.target.value)}
                                required
                            >
                                <option value="">Selecione o Dia</option>
                                <option value="Segunda-feira">Segunda-feira</option>
                                <option value="Terça-feira">Terça-feira</option>
                                <option value="Quarta-feira">Quarta-feira</option>
                                <option value="Quinta-feira">Quinta-feira</option>
                                <option value="Sexta-feira">Sexta-feira</option>
                                <option value="Sábado">Sábado</option>
                                <option value="Domingo">Domingo</option>
                            </select>
                        </div>

                        {/* Grupo Muscular */}
                        <div className="mb-4">
                            <label htmlFor="grupoMuscular" className="form-label">Grupo Muscular Principal</label>
                            <select
                                className="form-select"
                                id="grupoMuscular"
                                value={grupoMuscular}
                                onChange={(e) => setGrupoMuscular(e.target.value)}
                                required
                            >
                                <option value="">Selecione o Grupo Muscular</option>
                                <option value="Peitoral">Peitoral</option>
                                <option value="Costas">Costas</option>
                                <option value="Ombros">Ombros</option>
                                <option value="Bíceps">Bíceps</option>
                                <option value="Tríceps">Tríceps</option>
                                <option value="Posterior">Posterior</option>
                                <option value="Frontal">Frontal</option>
                                <option value="Panturrilha">Panturrilha</option>
                                <option value="Abdômen">Abdômen</option>
                            </select>
                        </div>

                        {/* Busca */}
                        <div className="input-group mb-3">
                            <span className="input-group-text"><i className="bi bi-search"></i></span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nome ou grupo muscular..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Tabela */}
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="table table-hover align-middle">
                                <thead className="table-light sticky-top">
                                <tr>
                                    <th>Selecionar</th>
                                    <th>Nome</th>
                                    <th>Grupo Muscular</th>
                                    <th>Exemplo</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentItems.map((ex) => (
                                    <tr key={ex.id}>
                                        <td data-label="Selecionar">
                                            <div className="form-check d-flex justify-content-center">
                                                <input
                                                    className="form-check-input custom-checkbox"
                                                    type="checkbox"
                                                    checked={exerciciosSelecionados.includes(ex.id)}
                                                    onChange={() => handleExercicioChange(ex.id)}
                                                    id={`check-${ex.id}`}
                                                />
                                            </div>

                                        </td>
                                        <td data-label="Nome">{ex.nome_exercicio}</td>
                                        <td data-label="Grupo Muscular">{ex.grupo_muscular}</td>
                                        <td>
                                            {ex.gif_url ? (
                                                <img
                                                    src={ex.gif_url}
                                                    alt={`GIF do exercício ${ex.nome_exercicio}`}
                                                    className="gif-thumb"
                                                />
                                            ) : (
                                                <span className="text-muted">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginação */}
                        <nav className="mt-3">
                            <ul className="pagination pagination-sm justify-content-center">
                                {[...Array(totalPages)].map((_, index) => (
                                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                        <button
                                            type="button"
                                            className="page-link"
                                            onClick={() => setCurrentPage(index + 1)}
                                        >
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {/* Botões */}
                        <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
                            <button type="submit" className="btn btn-success btn-lg w-100 w-md-auto">
                                <i className="bi bi-check-circle me-2"></i> Adicionar Treino
                            </button>
                            <button type="button" className="btn btn-danger btn-lg w-100 w-md-auto" onClick={() => navigate(-1)}>
                                <i className="bi bi-x-circle me-2"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TreinosForm;
