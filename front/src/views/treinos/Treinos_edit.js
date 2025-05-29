import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

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
    const { userId, funcao } = useContext(AuthContext);

    useEffect(() => {
        const bloquearSeNaoAutorizado = () => {
            if (funcao !== 'Professor' && parseInt(id) !== parseInt(userId)) {
                navigate(`/usuarios/view/${userId}`);
                return true; // bloqueado
            }
            return false; // autorizado
        };

        if (bloquearSeNaoAutorizado()) return;

        const fetchTreino = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
            const data = await res.json();

            // Bloquear se o treino não pertencer ao usuário logado (caso não seja professor)
            if (funcao !== 'Professor' && parseInt(data.usuario_id) !== parseInt(userId)) {
                navigate(`/treinos/view/${userId}`);
                return;
            }

            setNomeTreino(data.nome_treino);
            setDescricao(data.descricao);
            setDiaSemana(data.dia_semana);
            setGrupoMuscular(data.grupo_muscular);
        };


        const fetchExerciciosSalvos = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`);
            const data = await res.json();
            setExerciciosSalvos(data);
        };

        fetchTreino();
        fetchExerciciosSalvos();
    }, [treinoId, id, userId, funcao, navigate]);


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

        const treino = { nome_treino: nomeTreino, descricao, dia_semana: diaSemana, grupo_muscular: grupoMuscular };

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
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4">Editar Treino</h2>

            <form onSubmit={(e) => { e.preventDefault(); handleSaveChanges(); }}>
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
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    style={{ height: '100px' }}
                    required
                />
                    <label htmlFor="descricaoTreino">Descrição</label>
                </div>

                <div className="form-floating mb-4">
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


                <h4 className="mt-4">Exercícios Salvos</h4>
                <div className="table-responsive">
                    <table className="table table-bordered align-middle">
                        <thead className="table-dark">
                        <tr>
                            <th>Nome</th>
                            <th>Grupo Muscular</th>
                            <th>Ações</th>
                        </tr>
                        </thead>
                        <tbody>
                        {exerciciosSalvos.map((ex) => (
                            <tr key={ex.exercicio_id}>
                                <td>{ex.nome_exercicio}</td>
                                <td>{ex.grupo_muscular || ex.exercicio?.grupo_muscular || '—'}</td>
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

                </div>

                <h4 className="mt-5">Adicionar Exercícios</h4>
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
                        {currentItems.map((ex) => {
                            const jaAdicionado = exerciciosSalvos.some((s) => s.exercicio_id === ex.id);
                            return (
                                <tr
                                    key={ex.id}
                                    className={jaAdicionado ? 'table-secondary' : ''}
                                >
                                    <td>
                                        <input
                                            type="checkbox"
                                            disabled={jaAdicionado}
                                            checked={exerciciosSelecionados.includes(ex.id)}
                                            onChange={() => handleExercicioChange(ex.id)}
                                        />
                                    </td>
                                    <td>{ex.nome_exercicio}</td>
                                    <td>{ex.grupo_muscular}</td>
                                    <td>{ex.nivel}</td>
                                </tr>
                            );
                        })}
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
                                    onClick={() => paginate(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
                    <button type="submit" className="btn btn-primary btn-lg w-100 w-md-auto">Salvar Alterações</button>
                    <button type="button" className="btn btn-success btn-lg w-100 w-md-auto" onClick={handleAddExercicios}>
                        Adicionar Exercícios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TreinosEdit;
