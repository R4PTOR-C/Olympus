// api.js — cliente central da API.
//
// Instala um wrapper no window.fetch que, para chamadas à nossa API:
//   • adiciona `Authorization: Bearer <token>` automaticamente (as telas não
//     precisam mais lembrar de mandar o header);
//   • quando uma requisição AUTENTICADA volta 401 (token expirado/inválido),
//     limpa o token e volta para o login.
// Chamadas para outros domínios (ViaCEP, IBGE, Cloudinary…) passam intactas.

export const API = process.env.REACT_APP_API_BASE_URL || '';
export const TOKEN_KEY = 'token';

export const getToken = () => {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

const ehChamadaDaApi = (url) => Boolean(API) && typeof url === 'string' && url.startsWith(API);

let instalado = false;

export function instalarInterceptorApi() {
    if (instalado || typeof window === 'undefined' || !window.fetch) return;
    instalado = true;

    const fetchOriginal = window.fetch.bind(window);

    window.fetch = async (input, init = {}) => {
        const url = typeof input === 'string' ? input : input?.url;
        if (!ehChamadaDaApi(url)) return fetchOriginal(input, init);

        const token = getToken();
        const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
        if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);

        const resposta = await fetchOriginal(input, { ...init, headers });

        // Sessão expirada: só reage se a requisição levou token (o 401 do
        // login com senha errada não deve deslogar ninguém)
        if (resposta.status === 401 && headers.has('Authorization')) {
            try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage indisponível */ }
            if (window.location.pathname !== '/') window.location.assign('/');
        }
        return resposta;
    };
}

// Lê o payload do JWT sem validar (só para uso offline; quem valida é o backend)
export function lerTokenLocal() {
    const token = getToken();
    if (!token) return null;
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
        if (payload.exp && payload.exp * 1000 < Date.now()) return null;
        return payload;
    } catch {
        return null;
    }
}
