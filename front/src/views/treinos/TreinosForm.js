import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const TreinosForm = () => {
    const { id } = useParams(); // Pega o ID do aluno da URL
    const navigate = useNavigate();
    const [nomeTreino, setNomeTreino] = useState('');
    const [descricao, setDescricao] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [exercicios, setExercicios] = useState([]); // Estado para armazenar exercícios
    const [exercicioSelecionado, setExercicioSelecionado] = useState(''); // Estado para o exercício selecionado

    // Carregar os exercícios quando o componente é montado
    useEffect(() => {
        const fetchExercicios = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/exercicios`);
                const data = await response.json();
                setExercicios(data); // Armazena os exercícios no estado
            } catch (error) {
                console.error('Erro ao carregar exercícios:', error);
            }
        };

        fetchExercicios();
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const treino = {
            nome_treino: nomeTreino,
            descricao,
            dia_semana: diaSemana,
            exercicio_id: exercicioSelecionado
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
                alert('Treino adicionado com sucesso!');
                navigate(`/usuarios/view/${id}`);
            } else {
                alert('Erro ao adicionar o treino');
            }
        } catch (error) {
            console.error('Erro ao conectar ao servidor:', error);
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
                    <label>Selecionar Exercício</label>
                    <select
                        className="form-control"
                        value={exercicioSelecionado}
                        onChange={(e) => setExercicioSelecionado(e.target.value)}
                        required
                    >
                        <option value="">Selecione um Exercício</option>
                        {exercicios.map((exercicio) => (
                            <option key={exercicio.id} value={exercicio.id}>
                                {exercicio.nome_exercicio}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit" className="btn btn-primary">Adicionar Treino</button>
            </form>
        </div>
    );
};

export default TreinosForm;
