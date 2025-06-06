import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
            <h2 className="text-center mb-4">Criar Novo Treino</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                    <input
                        type="text"
                        className="form-control"
                        id="nomeTreino"
                        placeholder="Nome do Treino"
                        value={nomeTreino}
                        onChange={(e) => setNomeTreino(e.target.value)}
                        required
                    />
                    <label htmlFor="nomeTreino">Nome do Treino</label>
                </div>

                <div className="form-floating mb-3">
                    <textarea
                        className="form-control"
                        id="descricaoTreino"
                        placeholder="Descrição"
                        style={{ height: '100px' }}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        required
                    />
                    <label htmlFor="descricaoTreino">Descrição</label>
                </div>

                <div className="form-floating mb-3">
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
                    <label htmlFor="diaSemana">Dia da Semana</label>
                </div>

                <div className="form-floating mb-4">
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
                    <label htmlFor="grupoMuscular">Grupo Muscular Principal</label>
                </div>

                <input
                    type="text"
                    className="form-control mb-3"
                    placeholder="Buscar por nome ou grupo muscular..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                        <tr>
                            <th>Selecionar</th>
                            <th>Nome</th>
                            <th>Grupo Muscular</th>
                            <th>Nível</th>
                        </tr>
                        </thead>
                        <tbody>
                        {currentItems.map((ex) => (
                            <tr key={ex.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={exerciciosSelecionados.includes(ex.id)}
                                        onChange={() => handleExercicioChange(ex.id)}
                                    />
                                </td>
                                <td>{ex.nome_exercicio}</td>
                                <td>{ex.grupo_muscular}</td>
                                <td>{ex.nivel}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <nav className="mt-3">
                    <ul className="pagination justify-content-center">
                        {[...Array(totalPages)].map((_, index) => (
                            <li
                                key={index}
                                className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                            >
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

                <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
                    <button type="submit" className="btn btn-primary btn-lg w-100 w-md-auto">
                        Adicionar Treino
                    </button>
                    <button type="button" className="btn btn-secondary btn-lg w-100 w-md-auto" onClick={() => navigate(-1)}>
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TreinosForm;
