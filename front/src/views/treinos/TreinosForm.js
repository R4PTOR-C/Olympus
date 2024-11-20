import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TreinosForm = () => {
    const { id } = useParams(); // ID do aluno
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [grupoPrincipal, setGrupoPrincipal] = useState(''); // Grupo principal do treino
    const [exercicios, setExercicios] = useState([]);
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredExercicios, setFilteredExercicios] = useState([]);

    // Mapeamento de grupos musculares para imagens
    const [grupoMuscular, setGrupoMuscular] = useState('');



    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`);
                const data = await response.json();
                setExercicios(data);
                setFilteredExercicios(data);
            } catch (error) {
                console.error('Erro ao carregar exercícios:', error);
            }
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
    }, [searchTerm, exercicios]);

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


        const treino = {
            nome_treino: nomeTreino,
            descricao,
            dia_semana: diaSemana,
            grupo_muscular: grupoMuscular, // Apenas para determinar a imagem
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(treino),
            });

            if (response.ok) {
                const novoTreino = await response.json();

                await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${novoTreino.id}/exercicios`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ exercicios: exerciciosSelecionados }),
                });

                alert('Treino e exercícios adicionados com sucesso!');
                navigate(`/usuarios/view/${id}`);
            } else {
                alert('Erro ao criar o treino.');
            }
        } catch (error) {
            console.error('Erro ao criar treino:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Criar Treino para Aluno</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nome do Treino</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nomeTreino}
                        onChange={(e) => setNomeTreino(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Descrição</label>
                    <textarea
                        className="form-control"
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Dia da Semana</label>
                    <select
                        className="form-control"
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

                <div className="form-group">
                    <label>Grupo Muscular Principal</label>
                    <select
                        className="form-control"
                        value={grupoMuscular}
                        onChange={(e) => setGrupoMuscular(e.target.value)}
                        required
                    >
                        <option value="">Selecione o Grupo</option>
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

                <div className="form-group mt-4">
                    <label>Buscar Exercícios</label>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nome ou grupo muscular..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <h3 className="mt-4">Exercícios Disponíveis</h3>
                <div className="table-responsive">
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
                </div>

                <button type="submit" className="btn btn-primary mt-3">
                    Adicionar Treino
                </button>
            </form>
        </div>
    );
};

export default TreinosForm;
