import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TreinosForm = () => {
    const { id } = useParams(); // Pega o ID do aluno da URL
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [exercicios, setExercicios] = useState([]); // Estado para armazenar exercícios disponíveis
    const [exerciciosSelecionados, setExerciciosSelecionados] = useState([]); // Estado para armazenar os IDs dos exercícios selecionados

    // Carregar os exercícios quando o componente é montado
    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`);
                const data = await response.json();
                setExercicios(data); // Armazena os exercícios no estado
            } catch (error) {
                console.error('Erro ao carregar exercícios:', error);
            }
        };

        fetchExercicios();
    }, []);

    // Função para adicionar um exercício selecionado à lista
    const handleAddExercicio = () => {
        setExerciciosSelecionados([...exerciciosSelecionados, '']); // Adiciona um campo vazio para seleção de exercício
    };

    // Função para atualizar um exercício selecionado na lista
    const handleExercicioChange = (index, value) => {
        const novosExerciciosSelecionados = [...exerciciosSelecionados];
        novosExerciciosSelecionados[index] = value;
        setExerciciosSelecionados(novosExerciciosSelecionados);
    };

    // Função para enviar o treino e associar exercícios
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Primeiro passo: Criar o treino
        const treino = {
            nome_treino: nomeTreino,
            descricao,
            dia_semana: diaSemana,
        };

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(treino),
            });

            if (response.ok) {
                const novoTreino = await response.json(); // Obtenha os dados do treino recém-criado, incluindo o ID

                // Segundo passo: Enviar os exercícios para serem vinculados ao treino
                await adicionarExerciciosAoTreino(novoTreino.id);  // Chame a função que adiciona os exercícios

                alert('Treino e exercícios adicionados com sucesso!');
                navigate(`/usuarios/view/${id}`);
            } else {
                alert('Erro ao adicionar o treino');
            }
        } catch (error) {
            console.error('Erro ao conectar ao servidor:', error);
        }
    };

    // Função para adicionar exercícios ao treino recém-criado
    const adicionarExerciciosAoTreino = async (treinoId) => {
        if (exerciciosSelecionados.filter(exercicio => exercicio !== '').length === 0) {
            alert('Nenhum exercício selecionado!');
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    exercicios: exerciciosSelecionados.filter(exercicio => exercicio !== '') // Somente enviar IDs de exercícios válidos
                }),
            });

            if (!response.ok) {
                alert('Erro ao adicionar os exercícios ao treino');
            }
        } catch (error) {
            console.error('Erro ao adicionar exercícios ao treino:', error);
        }
    };

    return (
        <div className="container mt-5" >
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

                <h3>Exercícios</h3>
                {exerciciosSelecionados.map((exercicio, index) => (
                    <div key={index} className="form-group">
                        <label>Selecionar Exercício</label>
                        <select
                            className="form-control"
                            value={exercicio}
                            onChange={(e) => handleExercicioChange(index, e.target.value)}
                            required
                        >
                            <option value="">Selecione um Exercício</option>
                            {exercicios.map((ex) => (
                                <option key={ex.id} value={ex.id}>
                                    {ex.nome_exercicio}
                                </option>
                            ))}
                        </select>
                    </div>
                ))}
                <div>
                    <button type="button" className="btn btn-secondary" onClick={handleAddExercicio}>
                        Adicionar Outro Exercício
                    </button>
                </div>
                <div>
                    <button type="submit" className="btn btn-primary mt-3">Adicionar Treino</button>
                </div>
            </form>
        </div>
    );
};

export default TreinosForm;
