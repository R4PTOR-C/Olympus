import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ModalHistorico from '../components/ModalHistorico';
import ModalSucesso from '../components/ModalSucesso';
import PageStateHandler from '../components/PageStateHandler';
import TimerDescanso from '../components/TimerDescanso';
import '../../styles/ExerciciosIndex.css';

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
    const [treinoRealizadoId, setTreinoRealizadoId] = useState(null);  // sessão ativa (não finalizada)
    const [ultimoFinalizadoId, setUltimoFinalizadoId] = useState(null); // último treino finalizado (para "Editar Hoje")
    const [mostrarModalHistorico, setMostrarModalHistorico] = useState(false);
    const [modalFinalizado, setModalFinalizado] = useState(false);

    const lastBlurRef   = useRef(null);   // fix 6: dedup blur
    const pendingSaveRef = useRef(null);  // fix 4: aguarda save antes de finalizar

    const dataFormatada = (() => {
        if (!dataUltimoTreino) return '';
        const [data] = dataUltimoTreino.split('T');
        return new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR');
    })();

    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const isToday = dataUltimoTreino?.split('T')[0] === hojeStr;

    // ── FETCH ──────────────────────────────────────────────────────────────

    const fetchExercicios = async (sessionId = null) => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios`,
                { credentials: 'include' }
            );
            if (!response.ok) throw new Error('Erro ao buscar os exercícios');

            const data = await response.json();

            const exerciciosComSeries = await Promise.all(
                data.map(async (exercicio) => {
                    try {
                        const seriesUrl = sessionId
                            ? `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series?treino_realizado_id=${sessionId}`
                            : `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicio.exercicio_id}/series`;
                        const res = await fetch(seriesUrl, { credentials: 'include' });
                        let series = res.ok ? await res.json() : [];
                        const countExistente = series.length;
                        if (countExistente < 3) {
                            const faltantes = Array.from({ length: 3 - countExistente }, (_, i) => ({
                                numero_serie: countExistente + i + 1,
                                carga: '',
                                repeticoes: ''
                            }));
                            series = [...series, ...faltantes];
                        }
                        return { ...exercicio, series };
                    } catch {
                        return { ...exercicio, series: [] };
                    }
                })
            );

            setExercicios(exerciciosComSeries);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && editingField) {
                handleBlur(editingField.exercicioId);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [editingField, formData]);

    useEffect(() => {
        const verificarTreinoAtivo = async () => {
            try {
                const res = await fetch(
                    `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/ativo`,
                    { credentials: 'include' }
                );
                if (!res.ok) throw new Error();
                const data = await res.json();
                if (data.ativo) {
                    setTreinoRealizadoId(data.treinoRealizadoId);
                    setModoEdicao(true);
                    return data.treinoRealizadoId;
                }
            } catch {
                console.error('Erro ao verificar treino ativo');
            }
            return null;
        };

        const fetchTreinoInfo = async () => {
            try {
                const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}`);
                if (!res.ok) throw new Error();
                const data = await res.json();
                setNomeTreino(data.nome_treino);
                setDiaSemana(data.dia_semana);
            } catch {
                console.error('Erro ao buscar treino');
            }
        };

        (async () => {
            const sessionId = await verificarTreinoAtivo();
            buscarUltimoTreinoFinalizado(userId, treinoId);
            fetchTreinoInfo();
            fetchExercicios(sessionId);
        })();
    }, [treinoId, userId]);

    // ── HANDLERS ──────────────────────────────────────────────────────────

    const handleAddSerie = (exercicioId) => {
        const listaAtual = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const maxNumero = listaAtual.reduce((max, s) => Math.max(max, s.numero_serie), 0);
        const novaSerie = { numero_serie: maxNumero + 1, carga: '', repeticoes: '' };
        const novaLista = [...listaAtual, novaSerie];
        setFormData(prev => ({ ...prev, [exercicioId]: novaLista }));
        setEditingField({ exercicioId, numero_serie: novaSerie.numero_serie, campo: 'carga' });
    };

    const handleRemoverSerie = async (numero_serie, exercicioId) => {
        const listaAtual = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const reorganizado = listaAtual
            .filter(s => Number(s.numero_serie) !== Number(numero_serie))
            .map((s, i) => ({ ...s, numero_serie: i + 1 }));

        setFormData(prev => ({ ...prev, [exercicioId]: reorganizado }));
        setExercicios(prev => prev.map(ex =>
            ex.exercicio_id === exercicioId ? { ...ex, series: reorganizado } : ex
        ));
        if (editingField?.exercicioId === exercicioId && editingField?.numero_serie === numero_serie) {
            setEditingField(null);
        }

        try {
            await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ series: reorganizado, treino_realizado_id: treinoRealizadoId }),
                }
            );
        } catch {
            console.error('Erro ao salvar exclusão de série');
        }
    };

    const handleNovoTreino = async () => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/iniciar`,
                { method: 'POST', credentials: 'include' }
            );
            const data = await res.json();
            if (!res.ok) throw new Error();

            setTreinoRealizadoId(data.treinoRealizado.id);
            setModoEdicao(true);

            const novoFormData = {};
            const exerciciosComSeriesVazias = exercicios.map(ex => {
                const seriesIniciais = Array.from({ length: 3 }, (_, i) => ({
                    numero_serie: i + 1, carga: '', repeticoes: ''
                }));
                novoFormData[ex.exercicio_id] = seriesIniciais;
                return { ...ex, series: seriesIniciais };
            });

            setFormData(novoFormData);
            setExercicios(exerciciosComSeriesVazias);
        } catch {
            console.error('Erro ao iniciar novo treino');
        }
    };

    const handleFinalizarTreino = async () => {
        if (!treinoRealizadoId) return;
        if (editingField) await handleBlur(editingField.exercicioId); // fix 4: fecha campo aberto
        if (pendingSaveRef.current) await pendingSaveRef.current;     // fix 4: aguarda save em flight
        try {
            await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos_realizados/${treinoRealizadoId}/finalizar`,
                { method: 'POST', credentials: 'include' }
            );
            setModoEdicao(false);
            setTreinoRealizadoId(null);
            await Promise.all([fetchExercicios(), buscarUltimoTreinoFinalizado(userId, treinoId)]);
            setFormData({});
            setModalFinalizado(true);
            setTimeout(() => setModalFinalizado(false), 3000);
        } catch {
            console.error('Erro ao finalizar treino');
        }
    };

    const salvarSerie = async (exercicioId, series) => {
        if (!treinoRealizadoId) return; // fix 1: nunca salva sem sessão vinculada
        const promise = fetch(
            `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/exercicios/${exercicioId}/series`,
            {
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
            }
        );
        pendingSaveRef.current = promise; // fix 4: rastreia save em flight
        try {
            await promise;
        } catch {
            console.error('Erro ao salvar série');
        } finally {
            if (pendingSaveRef.current === promise) pendingSaveRef.current = null;
        }
    };

    const buscarUltimoTreinoFinalizado = async (userId, treinoId) => {
        try {
            const res = await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/treinos/${treinoId}/finalizados`,
                { credentials: 'include' }
            );
            if (!res.ok) throw new Error();
            const treinos = await res.json();
            if (treinos.length > 0) {
                const maisRecente = treinos.reduce((a, t) =>
                    new Date(t.data) > new Date(a.data) ? t : a
                );
                setDataUltimoTreino(maisRecente.data);
                setUltimoFinalizadoId(maisRecente.id);
            }
        } catch {
            console.error('Erro ao buscar último treino finalizado');
        }
    };

    // ── DRAG AND DROP ─────────────────────────────────────────────────────

    const handleReorder = async (result) => {
        if (!result.destination) return;
        const from = result.source.index;
        const to = result.destination.index;
        if (from === to) return;

        const novaOrdem = [...exercicios];
        const [moved] = novaOrdem.splice(from, 1);
        novaOrdem.splice(to, 0, moved);
        setExercicios(novaOrdem);

        try {
            await fetch(
                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos/${treinoId}/exercicios/ordem`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ ordem: novaOrdem.map(ex => ex.exercicio_id) }),
                }
            );
        } catch {
            console.error('Erro ao salvar ordem');
        }
    };

    // ── HELPERS ───────────────────────────────────────────────────────────

    const isVideo = (url) => url && (url.includes('/video/') || /\.(mp4|mov|webm)(\?|$)/i.test(url));

    const handleBlur = async (exercicioId) => {
        // fix 6: ignora blur duplicado dentro de 300ms
        if (lastBlurRef.current === exercicioId) return;
        lastBlurRef.current = exercicioId;
        setTimeout(() => { if (lastBlurRef.current === exercicioId) lastBlurRef.current = null; }, 300);

        setEditingField(null);

        if (!formData[exercicioId]) return;

        const series = formData[exercicioId].map(s => ({
            ...s,
            // fix 5: rejeita NaN; carga 0 é válida, reps 0 não
            carga:      (s.carga === '' || isNaN(Number(s.carga)) || Number(s.carga) < 0) ? '' : s.carga,
            repeticoes: (Number(s.repeticoes) > 0 && !isNaN(Number(s.repeticoes)))        ? s.repeticoes : '',
        }));
        setFormData(prev => ({ ...prev, [exercicioId]: series }));
        await salvarSerie(exercicioId, series);
    };

    const isEditing = (exercicioId, numero_serie, campo) =>
        editingField?.exercicioId === exercicioId &&
        editingField?.numero_serie === numero_serie &&
        editingField?.campo === campo;

    const handleValChange = (exercicioId, serie, campo, valor) => {
        const currentSeries = formData[exercicioId] || exercicios.find(ex => ex.exercicio_id === exercicioId)?.series || [];
        const novaLista = currentSeries.map(s =>
            s.numero_serie === serie.numero_serie ? { ...s, [campo]: valor } : s
        );
        setFormData(prev => ({ ...prev, [exercicioId]: novaLista }));
    };

    // ── RENDER ────────────────────────────────────────────────────────────

    return (
        <PageStateHandler loading={loading} error={error}>
            <div className="ex-page">

                {/* ── HEADER ── */}
                <div className="ex-header">
                    <div className="ex-header-row">
                        <div>
                            <div className="ex-day-badge">
                                <span className="ex-badge-dot" />
                                {diaSemana}
                            </div>
                            <h1 className="ex-workout-title">{nomeTreino}</h1>
                            {dataFormatada && (
                                <p className="ex-last-info">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    Último treino: {dataFormatada}
                                </p>
                            )}
                        </div>
                        <button
                            className="ex-history-btn"
                            onClick={() => setMostrarModalHistorico(true)}
                            title="Ver histórico"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="1 4 1 10 7 10"/>
                                <path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
                            </svg>
                        </button>
                    </div>
                </div>

                {/* ── BOTÃO PRINCIPAL ── */}
                <div className="ex-cta-wrap">
                    {modoEdicao ? (
                        <button className="ex-btn-finish" onClick={handleFinalizarTreino}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Finalizar Treino
                        </button>
                    ) : ultimoFinalizadoId && isToday ? (
                        <button className="ex-btn-edit-today" onClick={async () => {
                            await fetch(
                                `${process.env.REACT_APP_API_BASE_URL}/treinos/treinos_realizados/${ultimoFinalizadoId}/reabrir`,
                                { method: 'POST', credentials: 'include' }
                            );
                            setModoEdicao(true);
                            setTreinoRealizadoId(ultimoFinalizadoId);
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar Treino de Hoje
                        </button>
                    ) : (
                        <button className="ex-btn-start" onClick={handleNovoTreino}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5,3 19,12 5,21"/>
                            </svg>
                            Iniciar Novo Treino
                        </button>
                    )}
                </div>

                {/* Barra de status modo edição */}
                {modoEdicao && (
                    <div className="ex-editing-bar">
                        <span className="ex-editing-pulse" />
                        Treino em andamento — toque nos valores para editar
                    </div>
                )}

                {/* ── LISTA DE EXERCÍCIOS ── */}
                <DragDropContext onDragEnd={handleReorder}>
                <Droppable droppableId="ex-list">
                    {(droppableProvided, droppableSnapshot) => (
                    <div
                        className={`ex-list${droppableSnapshot.isDraggingOver ? ' ex-list-dropping' : ''}`}
                        ref={droppableProvided.innerRef}
                        {...droppableProvided.droppableProps}
                    >
                    {exercicios.map((exercicio, index) => {
                        const series = formData[exercicio.exercicio_id] || exercicio.series || [];

                        return (
                            <Draggable
                                key={String(exercicio.exercicio_id)}
                                draggableId={String(exercicio.exercicio_id)}
                                index={index}
                            >
                            {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`ex-card${snapshot.isDragging ? ' ex-dragging' : ''}`}
                            >

                                {/* Drag handle */}
                                <div className="ex-drag-handle" {...provided.dragHandleProps}>
                                    <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
                                        <rect y="0" width="16" height="2" rx="1"/>
                                        <rect y="4" width="16" height="2" rx="1"/>
                                        <rect y="8" width="16" height="2" rx="1"/>
                                    </svg>
                                </div>

                                {/* GIF / Vídeo */}
                                <div className="ex-gif-wrap">
                                    {isVideo(exercicio.gif_url) ? (
                                        <video src={exercicio.gif_url} autoPlay loop muted playsInline />
                                    ) : (
                                        <img src={exercicio.gif_url} alt={exercicio.nome_exercicio} />
                                    )}
                                </div>

                                {/* Body */}
                                <div className="ex-card-body">
                                    <h2 className="ex-ex-name">{exercicio.nome_exercicio}</h2>

                                    {/* Meta de séries/reps */}
                                    {(exercicio.series_alvo || exercicio.reps_alvo) && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            padding: '4px 10px',
                                            borderRadius: 20,
                                            background: 'var(--ex-accent-dim)',
                                            border: '1px solid var(--ex-accent-border)',
                                            marginBottom: 10,
                                            fontSize: '0.75rem',
                                            color: 'var(--ex-accent)',
                                            fontWeight: 700,
                                            letterSpacing: '0.04em',
                                        }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                            </svg>
                                            Meta:{exercicio.series_alvo ? ` ${exercicio.series_alvo} séries` : ''}
                                            {exercicio.series_alvo && exercicio.reps_alvo ? ' × ' : ''}
                                            {exercicio.reps_alvo ? `${exercicio.reps_alvo} reps` : ''}
                                        </div>
                                    )}

                                {/* Tabela de séries */}
                                    <div className="ex-series-wrap">
                                    <table className="ex-series-table">
                                        <thead>
                                            <tr>
                                                <th>Série</th>
                                                <th>Carga</th>
                                                <th></th>
                                                <th>Reps</th>
                                                {modoEdicao && <th></th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {series.map((serie, index) => (
                                                <tr key={index}>

                                                    {/* Número */}
                                                    <td className="ex-serie-num">{serie.numero_serie}ª</td>

                                                    {/* Carga */}
                                                    <td>
                                                        {modoEdicao && isEditing(exercicio.exercicio_id, serie.numero_serie, 'carga') ? (
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                className="ex-inline-input"
                                                                value={serie.carga || ''}
                                                                onChange={e => handleValChange(exercicio.exercicio_id, serie, 'carga', e.target.value)}
                                                                onBlur={() => handleBlur(exercicio.exercicio_id)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                className={`ex-val${!serie.carga ? ' empty' : ''}${modoEdicao ? ' editable' : ''}`}
                                                                onClick={() => modoEdicao && setEditingField({ exercicioId: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'carga' })}
                                                            >
                                                                {serie.carga || '—'}<small>{serie.carga ? ' kg' : ''}</small>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Separador */}
                                                    <td className="ex-sep">×</td>

                                                    {/* Reps */}
                                                    <td>
                                                        {modoEdicao && isEditing(exercicio.exercicio_id, serie.numero_serie, 'repeticoes') ? (
                                                            <input
                                                                type="text"
                                                                inputMode="decimal"
                                                                className="ex-inline-input"
                                                                value={serie.repeticoes || ''}
                                                                onChange={e => handleValChange(exercicio.exercicio_id, serie, 'repeticoes', e.target.value)}
                                                                onBlur={() => handleBlur(exercicio.exercicio_id)}
                                                                autoFocus
                                                            />
                                                        ) : (
                                                            <span
                                                                className={`ex-val${!serie.repeticoes ? ' empty' : ''}${modoEdicao ? ' editable' : ''}`}
                                                                onClick={() => modoEdicao && setEditingField({ exercicioId: exercicio.exercicio_id, numero_serie: serie.numero_serie, campo: 'repeticoes' })}
                                                            >
                                                                {serie.repeticoes || '—'}<small>{serie.repeticoes ? ' reps' : ''}</small>
                                                            </span>
                                                        )}
                                                    </td>

                                                    {/* Remover */}
                                                    {modoEdicao && (
                                                        <td>
                                                            <button
                                                                className="ex-rm-btn"
                                                                onClick={() => handleRemoverSerie(serie.numero_serie, exercicio.exercicio_id)}
                                                                title="Remover série"
                                                            >
                                                                −
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    </div>

                                    {/* Adicionar série */}
                                    {modoEdicao && (
                                        <button
                                            className="ex-add-serie-btn"
                                            onClick={() => handleAddSerie(exercicio.exercicio_id)}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                            </svg>
                                            Adicionar Série
                                        </button>
                                    )}
                                </div>
                            </div>
                            )}
                            </Draggable>
                        );
                    })}
                    {droppableProvided.placeholder}
                    </div>
                    )}
                </Droppable>
                </DragDropContext>

                {/* ── TIMER DE DESCANSO ── */}
                {modoEdicao && <TimerDescanso />}

                {/* ── MODAIS ── */}
                {mostrarModalHistorico && (
                    <ModalHistorico
                        usuarioId={userId}
                        treinoId={treinoId}
                        onClose={() => setMostrarModalHistorico(false)}
                    />
                )}
                <ModalSucesso show={modalFinalizado} mensagem="Treino finalizado com sucesso!" />
            </div>
        </PageStateHandler>
    );
}

export default Exercicios_index;
