import React, { useState } from 'react';
import BadgeNivel from '../components/BadgeNivel';
import { NOMES_NIVEL, TOTAL_NIVEIS } from '../components/rankInfo';

// Tela temporária só para visualizar o design do badge de nível.
export default function BadgePreview() {
    const [dark, setDark] = useState(document.body.classList.contains('dark-mode'));

    const toggleTema = () => {
        const novo = !dark;
        setDark(novo);
        document.body.classList.toggle('dark-mode', novo);
        document.body.classList.toggle('light-mode', !novo);
    };

    const niveis = Array.from({ length: TOTAL_NIVEIS }, (_, i) => i + 1); // 21 ranks

    return (
        <div style={{ minHeight: '100vh', background: 'var(--h-bg, #0B0F14)', padding: '24px 16px 80px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h1 style={{ color: 'var(--h-text)', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em', margin: 0 }}>
                        Badge de Nível — Preview
                    </h1>
                    <button
                        onClick={toggleTema}
                        style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--h-border)', background: 'var(--h-surface)', color: 'var(--h-text)', cursor: 'pointer', fontWeight: 700 }}
                    >
                        {dark ? '☀️ Claro' : '🌙 Escuro'}
                    </button>
                </div>

                {/* ── FULL ── */}
                <h2 style={S.sec}>Completo (sugestões / perfil)</h2>
                <div style={S.gridFull}>
                    {niveis.map(n => (
                        <div key={n} style={S.cardFull}>
                            <BadgeNivel nivel={n} variant="full" expansivel />
                        </div>
                    ))}
                </div>

                {/* ── COMPACT ── */}
                <h2 style={{ ...S.sec, marginTop: 36 }}>Compacto (listas / ranking)</h2>
                <div style={S.listCompact}>
                    {niveis.map(n => (
                        <div key={n} style={S.rowCompact}>
                            <div style={S.fakeAvatar} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: 'var(--h-text)', fontWeight: 700, fontSize: 14 }}>Usuário {NOMES_NIVEL[n - 1]}</div>
                                <div style={{ marginTop: 4 }}><BadgeNivel nivel={n} variant="compact" /></div>
                            </div>
                            <span style={{ color: 'var(--h-accent)', fontWeight: 700, fontSize: 13 }}>{n * 800} XP</span>
                        </div>
                    ))}
                </div>

                <p style={{ color: 'var(--h-text-muted)', fontSize: 12, marginTop: 24 }}>
                    Obs: sub-ranks sem arte própria caem na arte do sub-rank I do mesmo tier.
                </p>
            </div>
        </div>
    );
}

const S = {
    sec: { color: 'var(--h-text)', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7, marginBottom: 12 },
    gridFull: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 },
    cardFull: { display: 'flex', justifyContent: 'center' },
    listCompact: { display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 520 },
    rowCompact: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--h-bg)', border: '1px solid var(--h-border)', borderRadius: 12 },
    fakeAvatar: { width: 44, height: 44, borderRadius: '50%', background: 'var(--h-surface)', border: '1px solid var(--h-border)', flexShrink: 0 },
};
