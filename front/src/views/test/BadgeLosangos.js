import React, { useState } from 'react';
import BadgeGrego from '../components/BadgeGrego';

// Página isolada (só front) para comparar o badge grego com diferentes
// quantidades de losangos. Rota: /badge-losangos
export default function BadgeLosangos() {
    const [cor, setCor] = useState('#D87838');
    const [tamanho, setTamanho] = useState(280);

    const variantes = [
        { gemas: 1, titulo: '1 losango', desc: 'topo (centro)' },
        { gemas: 2, titulo: '2 losangos', desc: 'topo + base' },
        { gemas: '2-lados', titulo: '2 losangos', desc: 'esquerda + direita' },
        { gemas: 3, titulo: '3 losangos', desc: 'topo + laterais (original)' },
    ];

    return (
        <div style={S.page}>
            <div style={S.wrap}>
                <h1 style={S.h1}>Badge grego — variações de losango</h1>
                <p style={S.sub}>
                    Aro, grega e losangos desenhados em SVG. A figura central é o recorte do
                    <code style={S.code}>badge-nivel-1-1.png</code> (branco + alpha), tingida pela cor escolhida.
                </p>

                <div style={S.controles}>
                    <label style={S.label}>
                        Cor
                        <input type="color" value={cor} onChange={(e) => setCor(e.target.value)} style={S.color} />
                    </label>
                    <label style={S.label}>
                        Tamanho: {tamanho}px
                        <input
                            type="range" min="120" max="440" value={tamanho}
                            onChange={(e) => setTamanho(Number(e.target.value))}
                            style={{ width: 180 }}
                        />
                    </label>
                    <div style={S.swatches}>
                        {['#D87838', '#C3CAD3', '#22C58A', '#4A90D9', '#A77DF7', '#F1564B', '#FFD24D'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setCor(c)}
                                title={c}
                                style={{ ...S.swatch, background: c, outline: c === cor ? '2px solid #fff' : 'none' }}
                            />
                        ))}
                    </div>
                </div>

                <div style={S.grid}>
                    {variantes.map((v) => (
                        <div key={`${v.gemas}`} style={S.card}>
                            <BadgeGrego gemas={v.gemas} cor={cor} tamanho={tamanho} />
                            <div style={S.cardTitulo}>{v.titulo}</div>
                            <div style={S.cardDesc}>{v.desc}</div>
                        </div>
                    ))}
                </div>

                <h2 style={S.h2}>Comparação com o PNG original</h2>
                <div style={S.grid}>
                    <div style={S.card}>
                        <img src="/badge-nivel-1-1.png" alt="original" style={{ width: tamanho, height: tamanho }} />
                        <div style={S.cardTitulo}>PNG original</div>
                        <div style={S.cardDesc}>badge-nivel-1-1.png</div>
                    </div>
                    <div style={S.card}>
                        <BadgeGrego gemas={3} cor={cor} tamanho={tamanho} />
                        <div style={S.cardTitulo}>Recriação SVG</div>
                        <div style={S.cardDesc}>mesma geometria, vetorial</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: { minHeight: '100vh', background: '#07070A', padding: '28px 16px 80px' },
    wrap: { maxWidth: 1200, margin: '0 auto' },
    h1: { color: '#F2E9DD', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em', margin: '0 0 8px', fontSize: '2rem' },
    h2: { color: '#F2E9DD', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.65, margin: '48px 0 16px' },
    sub: { color: '#9A9490', fontSize: 13, margin: '0 0 20px', lineHeight: 1.6 },
    code: { background: '#17171C', padding: '2px 6px', borderRadius: 4, margin: '0 4px', color: '#D87838' },
    controles: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 24, padding: '14px 16px', background: '#101014', border: '1px solid #22222A', borderRadius: 12, marginBottom: 28 },
    label: { display: 'flex', alignItems: 'center', gap: 10, color: '#C9C3BD', fontSize: 13 },
    color: { width: 44, height: 30, border: 'none', background: 'none', cursor: 'pointer', padding: 0 },
    swatches: { display: 'flex', gap: 8 },
    swatch: { width: 24, height: 24, borderRadius: '50%', border: '1px solid #33333C', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20, justifyItems: 'center' },
    card: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 16, background: '#0B0B0F', border: '1px solid #1D1D24', borderRadius: 16 },
    cardTitulo: { color: '#F2E9DD', fontWeight: 700, fontSize: 15, marginTop: 8 },
    cardDesc: { color: '#8A847F', fontSize: 12 },
};
