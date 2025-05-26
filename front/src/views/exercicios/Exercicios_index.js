import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import ModalHistorico from '../components/ModalHistorico';
import debounce from 'lodash/debounce';



function Exercicios_index() {
    const { treinoId } = useParams();
    const { userId } = useContext(AuthContext);

    const [exercicios, setExercicios] = useState([]);
    const [formData, setFormData] = useState({});
    const [editingField, setEditingField] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [nomeTreino, setNomeTreino] = useState('');
    const [diaSemana, setDiaSemana] = useState('');
    const [dataUltimoTreino, setDataUltimoTreino] = useState('');
    const [modoEdicao, setModoEdicao] = useState(false);
    const [treinoRealizadoId, setTreinoRealizadoId] = useState(null);
    const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);


    const fetchExercicios = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`, { credentials: 'include' });
            if (!response.ok) throw new Error('Erro ao buscar os exercícios');

            const data = await response.json();

            const exerciciosComSeries = await Promise.all(
                data.map(async (exercicio) => {
                    try {
                        const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series`, { credentials: 'include' });
                        let series = res.ok ? await res.json() : [];
                        const countExistente = series.length;

                        // Se existirem menos de 3 séries, completa com vazias
                        if (countExistente < 3) {
                            const faltantes = Array.from({ length: 3 - countExistente }, (_, i) => ({
                                numero_serie: countExistente + i + 1,
                                carga: '',
                                repeticoes: ''
                            }));
                            series = [...series, ...faltantes];
                        }

                        return { ...exercicio, series };

                    } catch (err) {
                        console.error(`Erro ao buscar séries do exercício ${exercicio.exercicio_id}:`, err);
                        return { ...exercicio, series: [] };
                    }
                })
            );

            setExercicios(exerciciosComSeries);

            const dataMaisRecente = exerciciosComSeries
                .flatMap(ex => ex.series)
                .reduce((maisRecente, serie) => {
                    if (!maisRecente || new Date(serie.data_treino) > new Date(maisRecente)) {
                        return serie.data_treino;
                    }
                    return maisRecente;
                }, null);

            if (dataMaisRecente) {
                setDataUltimoTreino(dataMaisRecente);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {

        const verificarTreinoAtivo = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/ativo`, {
                    credentials: 'include'
                });
                if (!res.ok) throw new Error('Erro ao verificar treino ativo');
                const data = await res.json();
                if (data.ativo) {
                    setModoEdicao(true);
                    setTreinoRealizadoId(data.treinoRealizadoId); // 👈 salva o ID
                }

            } catch (err) {
                console.error('Erro ao verificar treino ativo:', err);
            }
        };







        const fetchTreinoInfo = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
                if (!res.ok) throw new Error('Erro ao buscar informações do treino');
                const data = await res.json();
                setNomeTreino(data.nome_treino);
                setDiaSemana(data.dia_semana);
            } catch (err) {
                console.error('Erro ao buscar treino:', err);
            }
        };

        verificarTreinoAtivo();
        verificarTreinoFinalizadoHoje(userId, treinoId); // 👈 chamada aqui
        fetchTreinoInfo();
        fetchExercicios();
    }, [treinoId, userId]);


    const handleAddSerie = (exercicioId) => {
        const listaAtual = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const maxNumero = listaAtual.reduce((max, s) => Math.max(max, s.numero_serie), 0);
        const novaSerie = { numero_serie: maxNumero + 1, carga: '', repeticoes: '' };
        const novaLista = [...listaAtual, novaSerie];

        setFormData(prev => ({ ...prev, [exercicioId]: novaLista }));
        setEditingField({ exercicioId, numero_serie: novaSerie.numero_serie, campo: 'carga' });
        console.log(`Adicionada série ${novaSerie.numero_serie} ao exercício ${exercicioId}`);
    };

    const handleRemoverSerie = async (numero_serie, exercicioId) => {
        const listaAtual = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const novaLista = listaAtual.filter(s => Number(s.numero_serie) !== Number(numero_serie));

        const reorganizado = novaLista.map((s, index) => ({
            ...s,
            numero_serie: index + 1
        }));

        // Atualiza local
        setFormData(prev => ({ ...prev, [exercicioId]: reorganizado }));
        setExercicios(prev => prev.map(ex =>
            ex.exercicio_id === exercicioId ? { ...ex, series: reorganizado } : ex
        ));

        if (editingField?.exercicioId === exercicioId && editingField?.numero_serie === numero_serie) {
            setEditingField(null);
        }

        console.log(`Removida série ${numero_serie} do exercício ${exercicioId}`);

        // ✅ Persistir no backend
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ series: reorganizado,     treino_realizado_id: treinoRealizadoId
                }),
            });
        } catch (err) {
            console.error('Erro ao salvar exclusão de série:', err);
        }
    };

    const handleNovoTreino = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/iniciar`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Erro ao iniciar treino');

            setModoEdicao(true);
            setTreinoRealizadoId(data.treinoRealizado.id); // 👈 salva o novo ID
            // Cria 3 séries por padrão para cada exercício
            const novoFormData = {};
            const exerciciosComSeriesVazias = exercicios.map(ex => {
                const seriesIniciais = Array.from({ length: 3 }, (_, i) => ({
                    numero_serie: i + 1,
                    carga: '',
                    repeticoes: ''
                }));
                novoFormData[ex.exercicio_id] = seriesIniciais;
                return { ...ex, series: seriesIniciais };
            });

            setFormData(novoFormData);
            setExercicios(exerciciosComSeriesVazias);

        } catch (err) {
            console.error('Erro ao iniciar novo treino:', err);
            alert('Não foi possível iniciar o treino.');
        }
    };

    const verificarTreinoFinalizadoHoje = async (userId, treinoId) => {
        try {
            const hoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            console.log('[DEBUG] Hoje é:', hoje);

            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/finalizados`, {
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Erro ao buscar treinos finalizados');

            const treinos = await res.json();
            console.log('[DEBUG] Treinos finalizados retornados:', treinos);

            const treinoHoje = treinos.find(t => t.data?.split('T')[0] === hoje);
            console.log('[DEBUG] Treino finalizado hoje encontrado:', treinoHoje);

            if (treinoHoje) {
                setTreinoRealizadoId(treinoHoje.id);
                setDataUltimoTreino(treinoHoje.data); // 💡 atualiza corretamente a data usada na renderização do botão
            }
        } catch (err) {
            console.error('Erro ao verificar treino finalizado hoje:', err);
        }
    };

    const handleFinalizarTreino = async () => {
        if (!treinoRealizadoId) return;

        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos_realizados/${treinoRealizadoId}/finalizar`, {
                method: 'POST',
                credentials: 'include'
            });

            setModoEdicao(false);
            setTreinoRealizadoId(null);




            // Atualiza os dados do treino como antes

            await Promise.all([
                fetchExercicios(),
                verificarTreinoFinalizadoHoje(userId, treinoId)
            ]);
            setFormData({});

        } catch (err) {
            console.error('Erro ao finalizar treino:', err);
        } finally {
            setLoading(false);
        }
    };

    const salvarSerieDebounced = debounce(async (exercicioId, series) => {
        try {
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    series: series.map(s => ({
                        ...s,
                        carga: s.carga === '' ? null : Number(s.carga),
                        repeticoes: s.repeticoes === '' ? null : Number(s.repeticoes)
                    })),
                    treino_realizado_id: treinoRealizadoId
                }),
            });

            console.log('💾 Séries salvas com sucesso');
        } catch (err) {
            console.error('Erro ao salvar séries com debounce:', err);
        }
    }, 500); // espera 500ms após o último caractere digitado






    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-0">Treino: {nomeTreino}</h4>
                    <small className="text-muted">Dia da semana: {diaSemana}</small>
                    {dataUltimoTreino && (
                        <div>
                            <small className="text-muted">
                                Treino realizado em: {new Date(dataUltimoTreino).toLocaleDateString('pt-BR')}
                            </small>
                        </div>
                    )}

                </div>
                <div className="d-flex align-items-center gap-2">
                    {console.log('[DEBUG render] modoEdicao:', modoEdicao)}
                    {console.log('[DEBUG render] treinoRealizadoId:', treinoRealizadoId)}
                    {console.log('[DEBUG render] dataUltimoTreino:', dataUltimoTreino)}
                    {console.log('[DEBUG render] hoje:', new Date().toISOString().split('T')[0])}
                    {modoEdicao ? (
                        <button className="btn btn-outline-danger btn-sm" onClick={handleFinalizarTreino}>
                            Finalizar Treino
                        </button>
                    ) : treinoRealizadoId && dataUltimoTreino?.split('T')[0] === new Date().toISOString().split('T')[0] ? (
                        <button
                            className="btn btn-outline-warning btn-sm"
                            onClick={() => {
                                setModoEdicao(true);
                            }}
                        >
                            Editar treino de hoje
                        </button>
                    ) : (
                        <button className="btn btn-outline-success btn-sm" onClick={handleNovoTreino}>
                            Iniciar Novo Treino
                        </button>
                    )}


                    {/* Botão com ícone de histórico */}
                    <button
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setMostrarModalHistorico(true)}
                        title="Ver histórico de treinos"
                    >
                        <i className="bi bi-clock-history"></i>
                    </button>
                </div>


            </div>
            <div className="d-flex flex-wrap justify-content-center gap-3">
                {exercicios.map((exercicio) => {
                    const series = formData[exercicio.exercicio_id] || exercicio.series || [];
                    return (
                        <div className="card shadow-sm p-2" style={{ width: '100%', maxWidth: '400px' }} key={exercicio.exercicio_id}>
                                <img
                                    src={exercicio.gif_url}
                                    alt={`GIF do exercício ${exercicio.nome_exercicio}`}
                                    className="card-img-top"
                                    style={{ maxHeight: '200px', objectFit: 'contain' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{exercicio.nome_exercicio}</h5>

                                    {series.map((serie, index) => (
                                        <div className="d-flex align-items-center justify-content-between mb-2" key={index}>
                                            <div className="d-flex justify-content-between align-items-center mb-2" key={index}>
                                                <strong className="me-2">{serie.numero_serie}ª:</strong>

                                                {/* CARGA */}
                                                {modoEdicao && editingField?.exercicioId === exercicio.exercicio_id && editingField?.numero_serie === serie.numero_serie && editingField?.campo === 'carga' ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm me-2"
                                                        style={{ width: '70px', fontSize: '0.9rem' }}

                                                        value={serie.carga || ''}
                                                        onChange={(e) => {
                                                            const novaLista = series.map(s =>
                                                                s.numero_serie === serie.numero_serie ? { ...s, carga: e.target.value } : s
                                                            );
                                                            setFormData(prev => ({ ...prev, [exercicio.exercicio_id]: novaLista }));
                                                            salvarSerieDebounced(exercicio.exercicio_id, novaLista);
                                                        }}

                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        className="me-2"
                                                        onClick={() => setEditingField({ exercicioId: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'carga' })}
                                                        style={{ cursor: 'pointer' }}
                                                    >
          {serie.carga || '-'} kg
          <img src="/weight.png" alt="Peso" style={{ width: '18px', height: '18px', marginLeft: '4px' }} />
        </span>
                                                )}

                                                <span className="me-1">×</span>

                                                {/* REPETIÇÕES */}
                                                {modoEdicao && editingField?.exercicioId === exercicio.exercicio_id && editingField?.numero_serie === serie.numero_serie && editingField?.campo === 'repeticoes' ? (
                                                    <input
                                                        type="number"
                                                        className="form-control form-control-sm me-2"
                                                        style={{ width: '70px', fontSize: '0.9rem' }}

                                                        value={serie.repeticoes || ''}
                                                        onChange={(e) => {
                                                            const novaLista = series.map(s =>
                                                                s.numero_serie === serie.numero_serie ? { ...s, repeticoes: e.target.value } : s
                                                            );
                                                            setFormData(prev => ({ ...prev, [exercicio.exercicio_id]: novaLista }));
                                                            salvarSerieDebounced(exercicio.exercicio_id, novaLista);
                                                        }}

                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span
                                                        onClick={() => setEditingField({ exercicioId: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'repeticoes' })}
                                                        style={{ cursor: 'pointer' }}
                                                    >
          {serie.repeticoes || '-'} reps
          <img src="/reps.png" alt="Repetições" style={{ width: '18px', height: '18px', marginLeft: '4px' }} />
        </span>
                                                )}
                                            </div>

                                            {/* Botão de Remover */}
                                            {/* Botão de Remover */}
                                            {modoEdicao && (
                                                <button
                                                    className="btn p-0 m-0"
                                                    style={{ color: 'red', fontSize: '1.4rem', lineHeight: '1', border: 'none', background: 'none' }}
                                                    onClick={() => handleRemoverSerie(serie.numero_serie, exercicio.exercicio_id)}
                                                    title="Remover série"
                                                >
                                                    &minus;
                                                </button>
                                            )}


                                        </div>
                                    ))}


                                    {modoEdicao && (
                                        <button
                                            className="btn btn-outline-primary btn-sm mt-2"
                                            onClick={() => handleAddSerie(exercicio.exercicio_id)}
                                            type="button"
                                        >
                                            + Adicionar Série
                                        </button>
                                    )}

                                </div>

                        </div>
                    );
                })}
            </div>
            {mostrarModalHistorico && (
                <ModalHistorico
                    usuarioId={userId}
                    treinoId={treinoId}
                    onClose={() => setMostrarModalHistorico(false)}
                />
            )}

        </div>
    );
}

export default Exercicios_index;
