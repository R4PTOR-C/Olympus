// Pede ao backend um novo link de confirmação (cadastro ou troca pendente).
// Devolve { ok, msg } já com o texto pronto para mostrar ao usuário.
import { API } from '../services/api';

export async function reenviarConfirmacao(userId) {
    try {
        const res = await fetch(`${API}/usuarios/${userId}/reenviar-confirmacao`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { ok: false, msg: data.error || 'Não foi possível reenviar.' };
        return { ok: true, msg: `Enviamos um novo link para ${data.email}.` };
    } catch {
        return { ok: false, msg: 'Erro de rede. Verifique sua conexão.' };
    }
}
