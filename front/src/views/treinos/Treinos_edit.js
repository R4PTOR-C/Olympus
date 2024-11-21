import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TreinosEdit = () => {
    const { id, treinoId } = useParams(); // ID do aluno e do treino
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [grupoMuscular, setGrupoMuscular] = useState('');
    const [exerciciosSalvos, setExerciciosSalvos] = useState([]);
    const [exerciciosDisponiveis, setExerciciosDisponiveis] = useState([]);
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExercicios, setFilteredExercicios] = useState([]);

    // Carregar os detalhes do treino e exercícios já salvos
    useEffect(() => {
        const fetchTreino = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
                const data = await response.json();
                setNomeTreino(data.nome_treino);
                setDescricao(data.descricao);
                setDiaSemana(data.dia_semana);
                setGrupoMuscular(data.grupo_muscular);
            } catch (error) {
                console.error('Erro ao carregar treino:', error);
            }
        };

        const fetchExerciciosSalvos = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`);
                const data = await response.json();
                setExerciciosSalvos(data);
            } catch (error) {
                console.error('Erro ao carregar exercícios salvos:', error);
            }
        };

        fetchTreino();
        fetchExerciciosSalvos();
    }, [treinoId]);

    // Carregar exercícios disponíveis
    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`);
                const data = await response.json();
                setExerciciosDisponiveis(data);
                setFilteredExercicios(data);
            } catch (error) {
                console.error('Erro ao carregar exercícios disponíveis:', error);
            }
        };

        fetchExercicios();
    }, []);

    // Filtrar exercícios disponíveis
    useEffect(() => {
        const filtered = exerciciosDisponiveis.filter(
            (ex) =>
                (ex.nome_exercicio && ex.nome_exercicio.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (ex.grupo_muscular && ex.grupo_muscular.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        setFilteredExercicios(filtered);
    }, [searchTerm, exerciciosDisponiveis]);

    const handleExercicioChange = (exercicioId) => {
        if (exerciciosSelecionados.includes(exercicioId)) {
            setExerciciosSelecionados(exerciciosSelecionados.filter((id) => id !== exercicioId));
        } else {
            setExerciciosSelecionados([...exerciciosSelecionados, exercicioId]);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (exerciciosSelecionados.length === 0) {
            alert('Selecione pelo menos um exercício!');
            return;
        }

        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exercicios: exerciciosSelecionados }),
            });

            alert('Exercícios adicionados com sucesso!');
            navigate(`/usuarios/view/${id}`);
        } catch (error) {
            console.error('Erro ao adicionar exercícios:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    const handleRemoveExercicio = async (exercicioId) => {
        const confirmRemove = window.confirm("Tem certeza que deseja remover este exercício do treino?");
        if (!confirmRemove) return;

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                setExerciciosSalvos(exerciciosSalvos.filter((ex) => ex.exercicio_id !== exercicioId));
                alert('Exercício removido com sucesso.');
            } else {
                alert('Erro ao remover o exercício.');
            }
        } catch (error) {
            console.error('Erro ao remover exercício:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Editar Treino</h2>
            <form>
                <div className="form-group">
                    <label>Nome do Treino</label>
                    <input type="text" className="form-control" value={nomeTreino} readOnly />
                </div>
                <div className="form-group">
                    <label>Descrição</label>
                    <textarea className="form-control" value={descricao} readOnly />
                </div>
                <div className="form-group">
                    <label>Dia da Semana</label>
                    <input type="text" className="form-control" value={diaSemana} readOnly />
                </div>
                <div className="form-group">
                    <label>Grupo Muscular Principal</label>
                    <input type="text" className="form-control" value={grupoMuscular} readOnly />
                </div>
            </form>

            <h3 className="mt-4">Exercícios Salvos</h3>
            <table className="table table-bordered">
                <thead>
                <tr>
                    <th scope="col">Nome</th>
                    <th scope="col">Grupo Muscular</th>
                    <th scope="col">Nível</th>
                    <th scope="col">Ações</th>
                </tr>
                </thead>
                <tbody>
                {exerciciosSalvos.map((exercicio) => (
                    <tr key={exercicio.exercicio_id}>
                        <td>{exercicio.nome_exercicio}</td>
                        <td>{exercicio.grupo_muscular}</td>
                        <td>{exercicio.nivel}</td>
                        <td>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleRemoveExercicio(exercicio.exercicio_id)}
                            >
                                Remover
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h3 className="mt-4">Adicionar Exercícios</h3>
            <div className="form-group">
                <label>Buscar Exercícios</label>
                <input
                    type="text"
                    className="form-control"
                    placeholder="Buscar por nome ou grupo muscular..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <table className="table table-hover">
                <thead>
                <tr>
                    <th scope="col">Selecionar</th>
                    <th scope="col">Nome</th>
                    <th scope="col">Grupo Muscular</th>
                    <th scope="col">Nível</th>
                </tr>
                </thead>
                <tbody>
                {filteredExercicios.map((exercicio) => (
                    <tr key={exercicio.id}>
                        <td>
                            <input
                                type="checkbox"
                                checked={exerciciosSelecionados.includes(exercicio.id)}
                                onChange={() => handleExercicioChange(exercicio.id)}
                            />
                        </td>
                        <td>{exercicio.nome_exercicio}</td>
                        <td>{exercicio.grupo_muscular}</td>
                        <td>{exercicio.nivel}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <button type="button" className="btn btn-primary mt-3" onClick={handleSubmit}>
                Adicionar Exercícios
            </button>
        </div>
    );
};

export default TreinosEdit;
