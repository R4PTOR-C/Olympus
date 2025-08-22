import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import dragula from 'dragula';
import 'dragula/dist/dragula.css';
import '../../styles/Board.css'; // CSS que citei acima

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
    const containersRef = useRef([]);

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

    // 🔹 Inicializa Dragula
    useEffect(() => {
        const validContainers = containersRef.current.filter(Boolean);

        if (validContainers.length === 0) {
            console.log("⚠️ Nenhum container válido encontrado para dragula");
            return;
        }

        console.log("✅ Inicializando Dragula em:", validContainers);

        const drake = dragula(validContainers, {
            direction: 'vertical',
            mirrorContainer: document.body
        });

        drake.on('drop', async (el, target) => {
            if (!target) return;

            const treinoId = el.getAttribute('data-id');
            const diaCurto = target.getAttribute('data-dia');
            const novoDia = mapDiasBack[diaCurto] || diaCurto; // garante formato certo

            console.log(`📌 Treino ${treinoId} solto em ${novoDia}`);

            drake.cancel(true); // cancela manipulação do DOM, deixa React atualizar

            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/${treinoId}/dia`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ dia_semana: novoDia })
                });

                if (res.ok) {
                    console.log(`✅ Treino ${treinoId} atualizado no banco para ${novoDia}`);
                    setTreinos(prev =>
                        prev.map(t =>
                            t.id === parseInt(treinoId) ? { ...t, dia_semana: novoDia } : t
                        )
                    );
                } else {
                    console.error(`❌ Erro ao atualizar treino ${treinoId}`);
                }
            } catch (err) {
                console.error("⚠️ Erro na requisição:", err);
            }
        });



        return () => drake.destroy();
    }, [treinos]);



    const handleDeleteTreino = async (treinoId) => {
        if (!window.confirm("Tem certeza que deseja excluir este treino?")) return;
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/${treinoId}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                setTreinos(treinos.filter(t => t.id !== treinoId));
            }
        } catch {
            alert("Erro ao excluir treino.");
        }
    };

    if (loading) return <div className="text-center mt-5">Carregando...</div>;
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
                <p className="text-muted mb-0">{usuario.email}</p>
                <p className="text-muted">Idade: {usuario.idade} | Gênero: {usuario.genero}</p>
            </div>

            <div className="mb-3 text-end">
                <button className="btn btn-success" onClick={() => navigate(`/usuarios/${id}/treinos`)}>
                    + Criar Novo Treino
                </button>
            </div>

            {/* 🔹 Board de treinos estilo Trello */}
            <div className="board-scroll">
                {diasSemana.map((dia, i) => (
                    <div
                        key={dia}
                        ref={el => (containersRef.current[i] = el)}
                        data-dia={dia}
                        className="board-column border rounded p-2"
                        style={{ background: '#f8f9fa' }}
                    >
                        <h5 className="text-center">{dia}</h5>
                        {treinos
                            .filter(t => mapDias[t.dia_semana] === dia)
                            .map(t => (
                                <div
                                    key={t.id}
                                    data-id={t.id}
                                    className="card mb-2 shadow-sm"
                                    style={{ cursor: 'grab' }}
                                >
                                    <div className="card-body p-2 d-flex flex-column">
                                        <h6 className="card-title mb-1">{t.nome_treino}</h6>
                                        <small className="text-muted mb-2">{t.descricao}</small>
                                        <div className="mt-auto d-flex justify-content-between">
                                            <button
                                                className="btn btn-sm btn-danger"
                                                onClick={() => handleDeleteTreino(t.id)}
                                            >
                                                Excluir
                                            </button>
                                            <button
                                                className="btn btn-sm btn-primary"
                                                onClick={() => navigate(`/treinos/edit/${id}/${t.id}`)}
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UsuariosView;
