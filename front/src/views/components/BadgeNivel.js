import React, { useState } from 'react';
import EstrelasNivel, { NOMES_NIVEL } from './EstrelasNivel';
import '../../styles/Social.css';

// Cor assinatura de cada nível (escala crescente; Olimpiano = dourado).
const COR_NIVEL = {
    1: '#D08A45', // Mortal    — bronze
    2: '#C3CAD3', // Guerreiro — prata
    3: '#22C58A', // Herói     — verde
    4: '#4A90D9', // Campeão   — azul
    5: '#A77DF7', // Semideus  — roxo
    6: '#F1564B', // Titã      — vermelho
    7: '#FFD24D', // Olimpiano — dourado
};

const FUNDO = 'linear-gradient(160deg, #1B1B20 0%, #050506 100%)';

const hexToRgba = (hex, a) => {
    const m = hex.replace('#', '');
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Badge de nível: medalhão (imagem por nível) + estrelas + título.
// variant: 'full' | 'compact' | expansivel: clicar abre versão ampliada no centro
export default function BadgeNivel({ nivel = 1, variant = 'full', expansivel = false, tamanho = 30 }) {
    const n = Math.max(1, Math.min(7, parseInt(nivel) || 1));
    const nome = NOMES_NIVEL[n - 1];
    const cor = COR_NIVEL[n];
    const [erroImg, setErroImg] = useState(false);
    const [aberto, setAberto] = useState(false);
    const compact = variant === 'compact';

    const Medalhao = ({ size, fallbackSize }) => (
        <div
            className="bn-medal"
            style={{
                width: size,
                height: size,
                background: 'transparent',
                border: erroImg ? `1px solid ${hexToRgba(cor, 0.5)}` : 'none',
            }}
        >
            {erroImg ? (
                <span className="bn-medal-fallback" style={{ fontSize: fallbackSize, color: cor }}>{n}</span>
            ) : (
                <img src={`/badge-nivel-${n}.png`} alt={nome} onError={() => setErroImg(true)} />
            )}
        </div>
    );

    if (compact) {
        return (
            <div className="bn bn-compact">
                <Medalhao size={tamanho} fallbackSize={Math.round(tamanho * 0.45)} />
                <EstrelasNivel nivel={n} size={Math.round(tamanho * 0.3)} gap={tamanho > 36 ? 2 : 1.5} cor={cor} corVazia={hexToRgba(cor, 0.3)} />
            </div>
        );
    }

    // Renderiza o card full; `big` = versão ampliada (modal)
    const renderFull = (big, onClick) => {
        const medal = big ? 168 : 112;
        const star = big ? 24 : 16;
        return (
            <div
                className="bn bn-full"
                onClick={onClick}
                style={{
                    background: FUNDO,
                    border: `2px solid ${cor}`,
                    boxShadow: `0 6px 22px ${hexToRgba(cor, big ? 0.5 : 0.3)}`,
                    cursor: onClick ? 'pointer' : 'default',
                    padding: big ? '34px 30px 28px' : undefined,
                    gap: big ? 16 : undefined,
                }}
            >
                <Medalhao size={medal} fallbackSize={big ? 60 : 42} />
                <EstrelasNivel nivel={n} size={star} gap={big ? 6 : 4} cor={cor} corVazia={hexToRgba(cor, 0.32)} />
                <span className="bn-title" style={{ color: cor, textShadow: `0 0 10px ${hexToRgba(cor, 0.5)}`, fontSize: big ? '2.4rem' : undefined }}>{nome}</span>
                {big && <span className="bn-nivel-num" style={{ color: hexToRgba(cor, 0.7) }}>Nível {n}</span>}
            </div>
        );
    };

    return (
        <>
            {renderFull(false, expansivel ? () => setAberto(true) : undefined)}
            {aberto && (
                <div className="bn-modal-overlay" onClick={() => setAberto(false)}>
                    <div className="bn-modal-content" onClick={e => e.stopPropagation()}>
                        {renderFull(true)}
                    </div>
                </div>
            )}
        </>
    );
}
