import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import ModalEdicaoCampo from '../components/ModalEdicaoCampo';
import ModalCarregando from '../components/ModalCarregando';
import '../../styles/UsuariosEdit.css'; // mantém o mesmo padrão visual

const TreinosEdit = () => {
    const { id, treinoId } = useParams();
    const navigate = useNavigate();
    const { userId, funcao } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [treino, setTreino] = useState(null);
    const [exerciciosSalvos, setExerciciosSalvos] = useState([]);
    const [campoEditando, setCampoEditando] = useState(null);

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
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
                if (!res.ok) throw new Error(`Erro ao buscar treino (${res.status})`);
                const data = await res.json();
                if (funcao !== 'Professor' && parseInt(data.usuario_id) !== parseInt(userId)) {
                    navigate(`/usuarios/view/${userId}`);
                    return;
                }
                setTreino(data);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        const fetchExerciciosSalvos = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`);
                const data = await res.json();
                setExerciciosSalvos(data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchTreino();
        fetchExerciciosSalvos();
    }, [treinoId, id, userId, funcao, navigate]);

    const handleSalvarCampo = async (campo, valor) => {
        try {
            // Atualiza localmente
            setTreino(prev => ({ ...prev, [campo]: valor }));

            const body = {};
            body[campo] = valor;

            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [campo]: valor }),
            });


            if (!res.ok) throw new Error('Erro ao atualizar treino');
        } catch (err) {
            console.error(err);
        } finally {
            setCampoEditando(null);
        }
    };

    const handleRemoveExercicio = async (exercicioId) => {
        if (!window.confirm('Remover este exercício do treino?')) return;
        const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios/${exercicioId}`,
            { method: 'DELETE' }
        );

        if (res.ok) {
            setExerciciosSalvos(prev => prev.filter(ex => ex.exercicio_id !== exercicioId));
        } else {
            alert('Erro ao remover exercício.');
        }
    };

    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div className="alert alert-danger mt-4">Erro: {error}</div>;
    if (!treino) return null;

    const camposTreino = [
        { name: 'nome_treino', label: 'Nome do Treino', tipo: 'text' },
        { name: 'descricao', label: 'Descrição', tipo: 'text' },
        {
            name: 'dia_semana',
            label: 'Dia da Semana',
            tipo: 'select',
            options: [
                'Segunda-feira', 'Terça-feira', 'Quarta-feira',
                'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
            ],
        },
        {
            name: 'grupo_muscular',
            label: 'Grupo Muscular Principal',
            tipo: 'select',
            options: [
                'Peitoral', 'Costas', 'Ombros', 'Bíceps',
                'Tríceps', 'Posterior', 'Frontal',
                'Panturrilha', 'Abdômen',
            ],
        },
    ];

    return (
        <div className="container mt-3 mb-5 usuarios-edit">
            <h2 className="text-center mb-4">Editar Treino</h2>

            {/* Card: Dados do Treino */}
            <div className="card card-section">
                <div className="card-header-custom">
                    <i className="bi bi-pencil-square me-2"></i> Dados do Treino
                </div>

                {camposTreino.map(campo => (
                    <div
                        key={campo.name}
                        className="field-row clickable"
                        onClick={() => setCampoEditando(campo)}
                    >
<<<<<<< HEAD
                        <span className="fw-bold">{campo.label}</span>
                        <span>{treino[campo.name] || 'Não informado'}</span>
                    </div>
                ))}
            </div>
=======
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
                                placeholder="Digite a descrição"
                                style={{ height: '100px' }}
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                required
                            />
                        </div>

                        {/* Dia da Semana */}
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

                        {/* Exercícios Salvos */}
                        <h4 className="mt-4">Exercícios Selecionados</h4>
                        <div className="row g-2 mb-4">
                            {exerciciosSalvos.length > 0 ? (
                                exerciciosSalvos.map((ex) => (
                                    <div key={ex.exercicio_id} className="col-6 col-md-3">
                                        <div className="card h-100 text-center shadow-sm p-2 d-flex flex-column">
                                            <img
                                                src={ex.gif_url}
                                                alt={ex.nome_exercicio}
                                                className="card-img-top img-exercicio"
                                                style={{ height: '80px', objectFit: 'contain' }}
                                            />
                                            <h6 className="mt-1 flex-grow-1" style={{ fontSize: '0.8rem' }}>
                                                {ex.nome_exercicio}
                                            </h6>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-danger mt-1 mt-auto"
                                                onClick={() => handleRemoveExercicio(ex.exercicio_id)}
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

                        <div className="accordion" id="accordionExercicios">
                            {["Peitoral", "Bíceps", "Tríceps", "Costas", "Ombros", "Pernas", "Abdômen", "Panturrilha"].map((grupo, idx) => {
                                // filtra só os exercícios desse grupo
                                const exerciciosGrupo = exercicios.filter(
                                    (ex) =>
                                        (ex.nome_exercicio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            ex.grupo_muscular?.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                        ex.grupo_muscular === grupo &&
                                        !exerciciosSalvos.some((s) => s.exercicio_id === ex.id)
                                );

                                if (exerciciosGrupo.length === 0) return null;

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
                                                                style={exercicioAtivo === ex.id ? {
                                                                    position: 'absolute',
                                                                    top: '-10px',
                                                                    left: '-10px',
                                                                    right: '-10px', // garante centralização
                                                                    zIndex: 20,
                                                                } : {}}
                                                            >
                                                                <div className="card-content text-center d-flex flex-column h-100">
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
                                                        </div>



                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>


                        {/* Botões */}
                        <div className="botao-flutuante">
                            <button type="submit" className="btn btn-edit px-4">
                                <i className="bi bi-check-circle me-2"></i> Salvar
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger px-4"
                                onClick={() => navigate(-1)}
                            >
                                <i className="bi bi-x-circle me-2"></i> Cancelar
                            </button>
                        </div>
>>>>>>> e15c88d64773a5dee8c7081fbe3bf08b9ec52020

            {/* Card: Exercícios */}
            <div className="card card-section mt-4">
                <div className="card-header-custom">
                    <i className="bi bi-dumbbell me-2"></i> Exercícios do Treino
                </div>

                {exerciciosSalvos.length > 0 ? (
                    <div className="row g-3 p-3">
                        {exerciciosSalvos.map(ex => (
                            <div key={ex.exercicio_id} className="col-6 col-md-3">
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
                                        onClick={() => handleRemoveExercicio(ex.exercicio_id)}
                                    >
                                        Remover
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted m-3">Nenhum exercício vinculado ainda.</p>
                )}
            </div>

            {/* Modal de edição */}
            {campoEditando && (
                <ModalEdicaoCampo
                    campo={campoEditando}
                    valorAtual={treino[campoEditando.name]}
                    onClose={() => setCampoEditando(null)}
                    onSave={handleSalvarCampo}
                />
            )}
        </div>
    );
};

export default TreinosEdit;
