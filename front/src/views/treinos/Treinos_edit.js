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
                return true;
            }
            return false;
        };

        if (bloquearSeNaoAutorizado()) return;

        const fetchTreino = async () => {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
            const data = await res.json();

            if (funcao !== 'Professor' && parseInt(data.usuario_id) !== parseInt(userId)) {
                navigate(`/usuarios/view/${userId}`);
                return;
            }

            setNomeTreino(data.nome_treino);
            setDescricao(data.descricao);
            setDiaSemana(data.dia_semana || '');
            setGrupoMuscular(data.grupo_muscular || '');
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
        setExerciciosSelecionados((prev) =>
            prev.includes(exercicioId) ? prev.filter((id) => id !== exercicioId) : [...prev, exercicioId]
        );
    };

    const handleRemoveExercicio = async (exercicioId) => {
        if (!window.confirm('Tem certeza que deseja remover este exercício do treino?')) return;

        const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`,
            { method: 'DELETE' }
        );

        if (res.ok) {
            setExerciciosSalvos((prev) => prev.filter((ex) => ex.exercicio_id !== exercicioId));
            setExerciciosSelecionados((prev) => prev.filter((id) => id !== exercicioId));
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

        const novos = exerciciosSelecionados.filter((id) => !exerciciosSalvos.some((ex) => ex.exercicio_id === id));

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
        const novos = exerciciosSelecionados.filter((id) => !exerciciosSalvos.some((ex) => ex.exercicio_id === id));

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
            <div className="card shadow-lg border-0">
                <div className="card-header text-white text-center py-3 rounded-top">
                    <h3 className="mb-0">
                        <i className="bi bi-pencil-square me-2"></i> Editar Treino
                    </h3>
                </div>

                <div className="card-body p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveChanges();
                        }}
                    >
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
                                placeholder="Digite a descrição"
                                style={{ height: '100px' }}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                required
                            />
                        </div>

                        {/* Dia da Semana */}
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

                        {/* Exercícios Salvos */}
                        <h4 className="mt-4">Exercícios Salvos</h4>
                        <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <table className="table table-bordered align-middle">
                                <thead className="table-light sticky-top">
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

                        {/* Adicionar Exercícios */}
                        <h4 className="mt-5">Adicionar Exercícios</h4>
                        <div className="input-group mb-3">
                            <span className="input-group-text">
                                <i className="bi bi-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nome ou grupo muscular..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

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
                                {currentItems.map((ex) => {
                                    const jaAdicionado = exerciciosSalvos.some((s) => s.exercicio_id === ex.id);
                                    return (
                                        <tr key={ex.id} className={jaAdicionado ? 'table-secondary' : ''}>
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
                                            <td data-label="">
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
                                    );
                                })}
                                </tbody>


                            </table>
                        </div>

                        {/* Paginação */}
                        <nav className="mt-3">
                            <ul className="pagination pagination-sm justify-content-center">
                                {[...Array(totalPages)].map((_, index) => (
                                    <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                        <button type="button" className="page-link" onClick={() => paginate(index + 1)}>
                                            {index + 1}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>

                        {/* Botões */}
                        <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
                            <button type="submit" className="btn btn-edit btn-lg w-100 w-md-auto">
                                <i className="bi bi-check-circle me-2"></i> Salvar Alterações
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-lg w-100 w-md-auto"
                                onClick={handleAddExercicios}
                            >
                                <i className="bi bi-plus-circle me-2"></i> Adicionar Exercícios
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger btn-lg w-100 w-md-auto"
                                onClick={() => navigate(-1)}
                            >
                                <i className="bi bi-x-circle me-2"></i> Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TreinosEdit;
