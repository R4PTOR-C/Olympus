import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../AuthContext';

// Rotas principais da navbar em ordem
const ROTAS_PROFESSOR = [
    '/usuarios',
    '/treinos',
    '/hercules',
    '/chat',
    '/professores/edit',
];

const ROTAS_ALUNO = (userId) => [
    `/home/${userId}`,
    `/usuarios/view/${userId}`,
    '/hercules',
    '/historico-exercicios',
    '/procurar-professor',
];

// Verifica se o pathname pertence a uma das rotas principais
function encontrarIndice(rotas, pathname) {
    return rotas.findIndex(rota => pathname === rota || pathname.startsWith(rota + '/') || pathname.startsWith(rota));
}

// Verifica se o elemento tocado está dentro de um container com scroll horizontal
function temScrollHorizontal(el) {
    while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const overflow = style.overflowX;
        if ((overflow === 'auto' || overflow === 'scroll') && el.scrollWidth > el.clientWidth) {
            return true;
        }
        el = el.parentElement;
    }
    return false;
}

export function useSwipeNavigation() {
    const navigate   = useNavigate();
    const location   = useLocation();
    const { funcao, userId } = useContext(AuthContext);

    const touchStart = useRef(null);

    useEffect(() => {
        const rotas = funcao === 'Professor'
            ? ROTAS_PROFESSOR
            : ROTAS_ALUNO(userId);

        const indiceAtual = encontrarIndice(rotas, location.pathname);

        // Se não estamos em uma rota da navbar, não faz nada
        if (indiceAtual === -1) return;

        const onTouchStart = (e) => {
            const t = e.touches[0];
            touchStart.current = { x: t.clientX, y: t.clientY, target: e.target };
        };

        const onTouchEnd = (e) => {
            if (!touchStart.current) return;
            const t = e.changedTouches[0];
            const dx = t.clientX - touchStart.current.x;
            const dy = t.clientY - touchStart.current.y;
            touchStart.current = null;

            // Só ativa se for predominantemente horizontal e com distância suficiente
            if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

            // Não ativa se o toque começou em área com scroll horizontal
            if (temScrollHorizontal(e.target)) return;

            if (dx < 0 && indiceAtual < rotas.length - 1) {
                // Swipe para esquerda → próxima tela
                navigate(rotas[indiceAtual + 1]);
            } else if (dx > 0 && indiceAtual > 0) {
                // Swipe para direita → tela anterior
                navigate(rotas[indiceAtual - 1]);
            }
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchend',   onTouchEnd,   { passive: true });

        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchend',   onTouchEnd);
        };
    }, [location.pathname, funcao, userId, navigate]);
}
