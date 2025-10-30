import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import {
    DragDropContext,
    Droppable,
    Draggable
} from "@hello-pangea/dnd";
import '../../styles/Board.css';
import ModalCarregando from '../components/ModalCarregando'; // 👈 importa a modal de loading


const diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const mapDiasBack = {
    'Segunda': 'Segunda-feira',
    'Terça': 'Terça-feira',
    'Quarta': 'Quarta-feira',
    'Quinta': 'Quinta-feira',
    'Sexta': 'Sexta-feira',
    'Sábado': 'Sábado',
    'Domingo': 'Domingo'
};
const mapDias = Object.fromEntries(
    Object.entries(mapDiasBack).map(([curto, longo]) => [longo, curto])
);

const UsuariosView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState(null);
    const [treinos, setTreinos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userId, funcao } = useContext(AuthContext);

    // 🔹 Carregar dados
    useEffect(() => {
        const carregarDados = async () => {
            if (funcao !== 'Professor' && parseInt(id) !== parseInt(userId)) {
                navigate(`/usuarios/view/${userId}`);
                return;
            }

            try {
                const [usuarioRes, treinosRes] = await Promise.all([
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`),
                    fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${id}/treinos`)
                ]);

                if (!usuarioRes.ok || !treinosRes.ok) throw new Error('Erro ao carregar dados');

                const usuarioData = await usuarioRes.json();
                const treinosData = await treinosRes.json();

                setUsuario(usuarioData);
                setTreinos(treinosData);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        carregarDados();
    }, [id, userId, funcao, navigate]);

    // 🔹 Lida com arrastar e soltar
    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;
        if (!destination) return;

        if (source.droppableId === destination.droppableId) return;

        const treinoId = draggableId.replace("treino-", "");
        const novoDiaCurto = destination.droppableId;
        const novoDia = mapDiasBack[novoDiaCurto] || novoDiaCurto;

        // 🚫 verifica se já existe treino nesse dia
        const jaExiste = treinos.some(
            (t) => mapDias[t.dia_semana] === novoDiaCurto
        );
        if (jaExiste) {
            alert("⚠️ Já existe um treino neste dia. Só é permitido um treino por dia.");
            return;
        }

        setTreinos(prev =>
            prev.map(t =>
                t.id === parseInt(treinoId) ? { ...t, dia_semana: novoDia } : t
            )
        );

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/${treinoId}/dia`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dia_semana: novoDia })
            });

            if (!res.ok) {
                console.error(`❌ Erro ao atualizar treino ${treinoId}`);
                // rollback se deu erro no backend
                setTreinos(prev =>
                    prev.map(t =>
                        t.id === parseInt(treinoId)
                            ? { ...t, dia_semana: mapDiasBack[source.droppableId] }
                            : t
                    )
                );
            }
        } catch (err) {
            console.error("⚠️ Erro na requisição:", err);
            // rollback em caso de falha na requisição
            setTreinos(prev =>
                prev.map(t =>
                    t.id === parseInt(treinoId)
                        ? { ...t, dia_semana: mapDiasBack[source.droppableId] }
                        : t
                )
            );
        }
    };



    const handleDeleteTreino = async (treinoId) => {
        if (!window.confirm("Tem certeza que deseja excluir este treino?")) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setTreinos(treinos.filter(t => t.id !== treinoId));
            }
        } catch {
            alert("Erro ao excluir treino.");
        }
    };

    if (loading) return <ModalCarregando show={true} />; // 👈 agora usa o overlay padronizado
    if (error) return <div className="alert alert-danger text-center mt-5">Erro: {error}</div>;
    if (!usuario) return <div className="text-center mt-5">Usuário não encontrado.</div>;

    const avatarUrl = usuario.avatar || null;

    return (
        <div className="container mt-5 mb-5">
            <h2 className="text-center mb-4">Perfil do Aluno</h2>

            <div className="d-flex flex-column align-items-center mb-4">
                {avatarUrl && (
                    <img src={avatarUrl} alt="Avatar"
                         className="rounded-circle mb-3"
                         style={{ width: 140, height: 140, objectFit: 'cover' }}
                    />
                )}
                <h4 className="mb-1">{usuario.nome}</h4>
                <p className="text-muted">Peso: {usuario.peso ? `${usuario.peso} kg` : '—'} |
                    Altura: {usuario.altura ? `${usuario.altura} cm` : '—'}</p>                <p className="text-muted">Gênero: {usuario.genero}</p>
            </div>

            <div className="mb-3 text-end">
                <button className="btn btn-success" onClick={() => navigate(`/usuarios/${id}/treinos`)}>
                    + Criar Novo Treino
                </button>
            </div>

            {/* 🔹 Board vertical (dias empilhados) */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <div className="d-flex flex-column gap-4">
                    {diasSemana.map((dia) => (
                        <Droppable key={dia} droppableId={dia}>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="border rounded p-3 droppable-day"
                                    style={{ minHeight: 100 }}
                                >

                                <h5 className="mb-3">{dia}</h5>
                                    {treinos
                                        .filter(t => mapDias[t.dia_semana] === dia)
                                        .map((t, index) => (
                                            <Draggable key={t.id} draggableId={`treino-${t.id}`} index={index}>
                                                {(provided, snapshot) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`card mb-2 shadow-sm ${snapshot.isDragging ? "dragging" : ""}`}
                                                        style={{
                                                            cursor: 'grab',
                                                            ...provided.draggableProps.style
                                                        }}
                                                    >
                                                        <div className="card-body p-2 d-flex flex-column">
                                                            <h6 className="card-title mb-1">{t.nome_treino}</h6>
                                                            <small className="text-muted mb-2">{t.descricao}</small>
                                                            <div className="mt-auto d-flex justify-content-end gap-2">
                                                                <button
                                                                    className="btn btn-success"
                                                                    onClick={() => navigate(`/treinos/edit/${id}/${t.id}`)}
                                                                >
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    className="btn btn-danger"
                                                                    onClick={() => handleDeleteTreino(t.id)}
                                                                >
                                                                    Excluir
                                                                </button>
                                                            </div>

                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>

                                        ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>
        </div>
    );
};

export default UsuariosView;
