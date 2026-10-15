// moderacao.js — denúncias e bloqueios (rotas /moderacao do backend).
// O token vai automático pelo interceptor de services/api.js.

import { API } from './api';

async function chamar(caminho, opcoes = {}) {
    const res = await fetch(`${API}/moderacao${caminho}`, {
        ...opcoes,
        headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) },
    });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(dados.error || 'Não foi possível concluir. Tente novamente.');
    return dados;
}

// Motivos aceitos pelo backend (MOTIVOS em back/moderacao.js)
export const MOTIVOS_USUARIO = [
    { valor: 'assedio',         rotulo: 'Assédio, ofensa ou discurso de ódio' },
    { valor: 'spam',            rotulo: 'Spam ou propaganda' },
    { valor: 'conteudo_sexual', rotulo: 'Conteúdo sexual' },
    { valor: 'violencia',       rotulo: 'Violência ou ameaça' },
    { valor: 'golpe',           rotulo: 'Golpe ou fraude' },
    { valor: 'outro',           rotulo: 'Outro motivo' },
];

export const MOTIVOS_HERCULES = [
    { valor: 'conselho_perigoso', rotulo: 'Orientação perigosa à saúde' },
    { valor: 'assedio',           rotulo: 'Resposta ofensiva ou preconceituosa' },
    { valor: 'conteudo_sexual',   rotulo: 'Conteúdo sexual' },
    { valor: 'violencia',         rotulo: 'Violência' },
    { valor: 'outro',             rotulo: 'Outro motivo' },
];

/** tipo: 'usuario' | 'mensagem' | 'hercules' — ver POST /moderacao/denuncias */
export const denunciar = (dados) =>
    chamar('/denuncias', { method: 'POST', body: JSON.stringify(dados) });

export const bloquear = (usuarioId) =>
    chamar('/bloqueios', { method: 'POST', body: JSON.stringify({ usuario_id: usuarioId }) });

export const desbloquear = (usuarioId) =>
    chamar(`/bloqueios/${usuarioId}`, { method: 'DELETE' });

/** { voce_bloqueou, bloqueado } — bloqueado = existe bloqueio em qualquer sentido */
export const situacaoBloqueio = (usuarioId) => chamar(`/bloqueios/${usuarioId}`);

export const listarBloqueados = () => chamar('/bloqueios');
