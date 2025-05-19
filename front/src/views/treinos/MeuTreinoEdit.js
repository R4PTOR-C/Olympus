import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MeuTreinoEdit = () => {
    const { treinoId } = useParams();
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [exercicios, setExercicios] = useState([]);
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExercicios, setFilteredExercicios] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    useEffect(() => {
        const fetchTreino = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
            const data = await res.json();
            setNomeTreino(data.nome_treino);
            setDescricao(data.descricao);
            setDiaSemana(data.dia_semana);
        };

        const fetchExerciciosSelecionados = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`);
            const data = await res.json();
            const ids = data.map(ex => ex.exercicio_id);
            setExerciciosSelecionados(ids);
        };

        fetchTreino();
        fetchExerciciosSelecionados();
    }, [treinoId]);

    useEffect(() => {
        const fetchExercicios = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`);
            const data = await res.json();
            setExercicios(data);
            setFilteredExercicios(data);
        };

        fetchExercicios();
    }, []);

    useEffect(() => {
        const filtered = exercicios.filter(
            (ex) =>
                (ex.nome_exercicio && ex.nome_exercicio.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ex.grupo_muscular && ex.grupo_muscular.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredExercicios(filtered);
        setCurrentPage(1);
    }, [searchTerm, exercicios]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredExercicios.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredExercicios.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleExercicioChange = (exercicioId) => {
        setExerciciosSelecionados(prev =>
            prev.includes(exercicioId) ? prev.filter(id => id !== exercicioId) : [...prev, exercicioId]
        );
    };

    const handleSave = async () => {
        const treino = { nome_treino: nomeTreino, descricao, dia_semana: diaSemana };

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(treino),
        });

        if (!res.ok) {
            alert('Erro ao atualizar treino.');
            return;
        }

        await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercicios: exerciciosSelecionados }),
        });

        alert('Treino atualizado com sucesso!');
        navigate(-1);
    };

    return (
        <div className="container mt-5">
            <h2>Editar Meu Treino</h2>
            <div className="form-group">
                <label>Nome do Treino</label>
                <input type="text" className="form-control" value={nomeTreino} onChange={(e) => setNomeTreino(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Descrição</label>
                <textarea className="form-control" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </div>
            <div className="form-group">
                <label>Dia da Semana</label>
                <select className="form-control" value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)}>
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

            <h4 className="mt-4">Exercícios</h4>
            <input type="text" className="form-control mb-3" placeholder="Buscar por nome ou grupo muscular..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />

            <table className="table table-hover">
                <thead>
                <tr>
                    <th>Selecionar</th>
                    <th>Nome</th>
                    <th>Grupo Muscular</th>
                    <th>Nível</th>
                </tr>
                </thead>
                <tbody>
                {currentItems.map((ex) => (
                    <tr key={ex.id} className={exerciciosSelecionados.includes(ex.id) ? 'table-secondary' : ''}>
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

            <nav className="mt-3">
                <ul className="pagination justify-content-center">
                    {[...Array(totalPages)].map((_, index) => (
                        <li
                            key={index}
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                            <button className="page-link" onClick={() => paginate(index + 1)}>
                                {index + 1}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>

            <button className="btn btn-success mt-3" onClick={handleSave}>Salvar Alterações</button>
        </div>
    );
};

export default MeuTreinoEdit;
