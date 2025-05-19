import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TreinosEdit = () => {
    const { id, treinoId } = useParams();
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [grupoMuscular, setGrupoMuscular] = useState('');
    const [exercicios, setExercicios] = useState([]);
    const [exerciciosSalvos, setExerciciosSalvos] = useState([]);
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

        const fetchExerciciosSalvos = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`);
            const data = await res.json();
            setExerciciosSalvos(data);
        };

        fetchTreino();
        fetchExerciciosSalvos();
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

    const handleRemoveExercicio = async (exercicioId) => {
        if (!window.confirm("Tem certeza que deseja remover este exercício do treino?")) return;

        const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`,
            { method: 'DELETE' }
        );

        if (res.ok) {
            setExerciciosSalvos(prev => prev.filter(ex => ex.exercicio_id !== exercicioId));
            setExerciciosSelecionados(prev => prev.filter(id => id !== exercicioId));
            alert('Exercício removido com sucesso.');
        } else {
            alert('Erro ao remover o exercício.');
        }
    };

    const handleSaveChanges = async () => {
        if (!nomeTreino.trim() || !diaSemana) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

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

        const novos = exerciciosSelecionados.filter(
            id => !exerciciosSalvos.some(ex => ex.exercicio_id === id)
        );

        if (novos.length > 0) {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercicios: novos }),
            });
        }

        alert('Treino atualizado com sucesso!');
        navigate(`/usuarios/view/${id}`);



    };

    const handleAddExercicios = async () => {
        const novos = exerciciosSelecionados.filter(
            (id) => !exerciciosSalvos.some((ex) => ex.exercicio_id === id)
        );

        if (novos.length === 0) {
            alert('Nenhum exercício novo selecionado.');
            return;
        }

        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ exercicios: novos }),
        });

        if (res.ok) {
            // ✅ Recarrega os exercícios salvos
            const atualizados = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`);
            const dados = await atualizados.json();
            setExerciciosSalvos(dados);
            setExerciciosSelecionados([]);
            alert('Exercícios adicionados com sucesso!');
        } else {
            alert('Erro ao adicionar exercícios.');
        }
    };



    return (
        <div className="container mt-5">
            <h2>Editar Treino</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
                <div className="form-group">
                    <label>Nome do Treino</label>
                    <input type="text" className="form-control" value={nomeTreino} onChange={(e) => setNomeTreino(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Descrição</label>
                    <textarea className="form-control" value={descricao} onChange={(e) => setDescricao(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Dia da Semana</label>
                    <select className="form-control" value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} required>
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

                <h3 className="mt-4">Exercícios Salvos</h3>
                <table className="table">
                    <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Grupo Muscular</th>
                        <th>Nível</th>
                        <th>Ações</th>
                    </tr>
                    </thead>
                    <tbody>
                    {exerciciosSalvos.map((ex) => (
                        <tr key={ex.exercicio_id}>
                            <td>{ex.nome_exercicio}</td>
                            <td>{ex.grupo_muscular}</td>
                            <td>{ex.nivel}</td>
                            <td>
                                <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleRemoveExercicio(ex.exercicio_id)}
                                >
                                    Remover
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <h3 className="mt-4">Adicionar Exercícios</h3>
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

                <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-dark btn-sm">Salvar Alterações</button>
                    <button type="button" className="btn btn-success btn-sm" onClick={handleAddExercicios}>
                        Adicionar Exercícios
                    </button>
                </div>

            </form>
        </div>
    );
};

export default TreinosEdit;
