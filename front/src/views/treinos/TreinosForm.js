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
    const [exercicioAtivo, setExercicioAtivo] = useState(null);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`)
            .then(res => res.json())
            .then(data => setExercicios(data));
    }, []);

    const handleAdicionarExercicio = (ex) => {
        if (!exerciciosSelecionados.some((s) => s.id === ex.id)) {
            setExerciciosSelecionados([...exerciciosSelecionados, ex]);
        }
        setExercicioAtivo(null);
    };

    const handleRemoveExercicio = (id) => {
        setExerciciosSelecionados((prev) => prev.filter((ex) => ex.id !== id));
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
            body: JSON.stringify({ exercicios: exerciciosSelecionados.map((ex) => ex.id) })
        });

        alert('Treino criado com sucesso!');
        navigate(`/usuarios/view/${id}`);
    };

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
                            <label className="form-label">Nome do Treino</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Digite o nome do treino"
                                value={nomeTreino}
                                onChange={(e) => setNomeTreino(e.target.value)}
                                required
                            />
                        </div>

                        {/* Descrição */}
                        <div className="mb-3">
                            <label className="form-label">Descrição</label>
                            <textarea
                                className="form-control"
                                placeholder="Digite a descrição do treino"
                                style={{ height: '100px' }}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                required
                            />
                        </div>

                        {/* Dia da semana */}
                        <div className="mb-3">
                            <label className="form-label">Dia da Semana</label>
                            <select
                                className="form-select"
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
                            <label className="form-label">Grupo Muscular Principal</label>
                            <select
                                className="form-select"
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

                        {/* Exercícios Selecionados */}
                        <h4 className="mt-4">Exercícios Selecionados</h4>
                        <div className="row g-2 mb-4">
                            {exerciciosSelecionados.length > 0 ? (
                                exerciciosSelecionados.map((ex) => (
                                    <div key={ex.id} className="col-6 col-md-3">
                                        <div className="card h-100 text-center shadow-sm p-2">
                                            <img
                                                src={ex.gif_url}
                                                alt={ex.nome_exercicio}
                                                className="card-img-top"
                                                style={{ height: '80px', objectFit: 'contain' }}
                                            />
                                            <h6 className="mt-1" style={{ fontSize: '0.8rem' }}>{ex.nome_exercicio}</h6>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger mt-1"
                                                onClick={() => handleRemoveExercicio(ex.id)}
                                            >
                                                Remover
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted">Nenhum exercício selecionado ainda.</p>
                            )}
                        </div>

                        {/* Exercícios Disponíveis */}
                        <h4 className="mt-4">Exercícios Disponíveis</h4>
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

                        <div className="accordion" id="accordionExercicios">
                            {["Peitoral", "Bíceps", "Tríceps", "Costas", "Ombros", "Pernas", "Abdômen", "Panturrilha"].map((grupo, idx) => {
                                const exerciciosGrupo = exercicios.filter(
                                    (ex) =>
                                        (ex.nome_exercicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            ex.grupo_muscular?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                        ex.grupo_muscular === grupo &&
                                        !exerciciosSelecionados.some((s) => s.id === ex.id)
                                );

                                if (!exerciciosGrupo.length) return null;

                                return (
                                    <div className="accordion-item" key={grupo}>
                                        <h2 className="accordion-header" id={`heading-${idx}`}>
                                            <button
                                                className="accordion-button collapsed"
                                                type="button"
                                                data-bs-toggle="collapse"
                                                data-bs-target={`#collapse-${idx}`}
                                                aria-expanded="false"
                                                aria-controls={`collapse-${idx}`}
                                            >
                                                {grupo}
                                            </button>
                                        </h2>
                                        <div
                                            id={`collapse-${idx}`}
                                            className="accordion-collapse collapse"
                                            aria-labelledby={`heading-${idx}`}
                                            data-bs-parent="#accordionExercicios"
                                        >
                                            <div className="accordion-body">
                                                <div className="row g-2">
                                                    {exerciciosGrupo.map((ex) => (
                                                        <div key={ex.id} className="col-6 col-md-3 position-relative">
                                                            <div
                                                                className={`card shadow-sm p-2 d-flex flex-column ${exercicioAtivo === ex.id ? "ativo" : ""}`}
                                                                onClick={() => setExercicioAtivo(ex.id)}
                                                                style={exercicioAtivo === ex.id ? { position: 'absolute', top: '-10px', left: '-10px', right: '-10px', zIndex: 20 } : {}}
                                                            >
                                                                <img
                                                                    src={ex.gif_url}
                                                                    alt={ex.nome_exercicio}
                                                                    className="card-img-top mx-auto"
                                                                    style={{ height: '80px', objectFit: 'contain' }}
                                                                />
                                                                <h6 className="mt-1" style={{ fontSize: '0.8rem' }}>{ex.nome_exercicio}</h6>

                                                                {exercicioAtivo === ex.id && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-success mt-auto"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleAdicionarExercicio(ex);
                                                                        }}
                                                                    >
                                                                        Usar
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        {/* Botões fixos */}
                        <div className="botao-flutuante">
                            <button type="submit" className="btn-olympus success sm">
                                <i className="bi bi-check-circle me-2"></i> Adicionar
                            </button>
                            <button type="button" className="btn-olympus danger sm" onClick={() => navigate(-1)}>
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
