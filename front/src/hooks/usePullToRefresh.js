import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 80; // px para disparar o refresh

export default function usePullToRefresh(onRefresh) {
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startYRef = useRef(null);
    const pullingRef = useRef(false);

    useEffect(() => {
        const onTouchStart = (e) => {
            // Só ativa se estiver no topo da página
            if (window.scrollY === 0) {
                startYRef.current = e.touches[0].clientY;
                pullingRef.current = true;
            }
        };

        const onTouchMove = (e) => {
            if (!pullingRef.current || startYRef.current === null) return;
            const delta = e.touches[0].clientY - startYRef.current;
            if (delta <= 0) {
                setPullDistance(0);
                return;
            }
            // Resistência progressiva
            const resistance = Math.min(delta * 0.45, THRESHOLD + 20);
            setPullDistance(resistance);
        };

        const onTouchEnd = async () => {
            if (!pullingRef.current) return;
            pullingRef.current = false;
            startYRef.current = null;

            if (pullDistance >= THRESHOLD) {
                setRefreshing(true);
                setPullDistance(0);
                try {
                    await onRefresh();
                } finally {
                    setTimeout(() => setRefreshing(false), 600);
                }
            } else {
                setPullDistance(0);
            }
        };

        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd);

        return () => {
            window.removeEventListener('touchstart', onTouchStart);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchend', onTouchEnd);
        };
    }, [onRefresh, pullDistance]);

    return { pullDistance, refreshing };
}
