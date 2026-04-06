import React, { useEffect } from 'react';

const PLANOS = [
    {
        key: 'gratuito',
        nome: 'Gratuito',
        preco: null,
        destaque: false,
        limite: '10 alunos',
        recursos: [
            'Até 10 alunos ativos',
            'Histórico de treinos',
            'Chat integrado',
            'Acompanhamento básico',
        ],
    },
    {
        key: 'pro',
        nome: 'Pro',
        preco: 'R$ 29,90',
        periodo: '/mês',
        destaque: true,
        limite: '50 alunos',
        recursos: [
            'Até 50 alunos ativos',
            'Tudo do Gratuito',
            'Relatórios de desempenho',
            'Suporte prioritário',
        ],
    },
    {
        key: 'elite',
        nome: 'Elite',
        preco: 'R$ 79,90',
        periodo: '/mês',
        destaque: false,
        limite: 'Ilimitado',
        recursos: [
            'Alunos ilimitados',
            'Tudo do Pro',
            'Dashboard completo',
            'Branding personalizado',
        ],
    },
];

export default function PlanosModal({ planoAtual, onClose }) {
    // Fecha com Esc
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    return (
        <div style={S.overlay} onClick={onClose}>
            <div style={S.sheet} onClick={e => e.stopPropagation()}>

                {/* Handle + close */}
                <div style={S.handle} />
                <button style={S.btnClose} onClick={onClose} aria-label="Fechar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                {/* Header */}
                <div style={S.header}>
                    <h2 style={S.titulo}>Planos</h2>
                    <p style={S.subtitulo}>Escolha o plano ideal para o tamanho da sua carteira de alunos</p>
                </div>

                {/* Cards */}
                <div style={S.cards}>
                    {PLANOS.map(plano => {
                        const atual   = plano.key === planoAtual;
                        const pago    = plano.preco !== null;
                        return (
                            <div key={plano.key} style={S.card(plano.destaque, atual)}>
                                {plano.destaque && <div style={S.badgeMaisPopular}>Mais popular</div>}
                                {atual          && <div style={S.badgeAtual}>Plano atual</div>}

                                <div style={S.cardHeader}>
                                    <span style={S.planNome(plano.destaque)}>{plano.nome}</span>
                                    <div style={S.precoWrap}>
                                        {plano.preco
                                            ? <>
                                                <span style={S.preco}>{plano.preco}</span>
                                                <span style={S.periodo}>{plano.periodo}</span>
                                              </>
                                            : <span style={S.precoGratis}>Grátis</span>
                                        }
                                    </div>
                                </div>

                                <div style={S.limiteTag}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                    {plano.limite}
                                </div>

                                <ul style={S.recursos}>
                                    {plano.recursos.map((r, i) => (
                                        <li key={i} style={S.recursoItem}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={plano.destaque ? '#4A90D9' : 'rgba(232,237,245,0.4)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            {r}
                                        </li>
                                    ))}
                                </ul>

                                {pago && !atual && (
                                    <button style={S.btnAssinar(plano.destaque)}>
                                        Assinar {plano.nome}
                                    </button>
                                )}
                                {atual && (
                                    <div style={S.btnAtual}>Plano atual</div>
                                )}
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease',
    },
    sheet: {
        width: '100%',
        maxWidth: 520,
        background: '#0E1117',
        borderRadius: '20px 20px 0 0',
        padding: '12px 20px 40px',
        maxHeight: '92dvh',
        overflowY: 'auto',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
    },
    handle: {
        width: 36,
        height: 4,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 99,
        margin: '0 auto 16px',
    },
    btnClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(255,255,255,0.06)',
        border: 'none',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'rgba(232,237,245,0.5)',
    },
    header: {
        marginBottom: 20,
    },
    titulo: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.8rem',
        color: '#E8EDF5',
        letterSpacing: '0.05em',
        margin: 0,
    },
    subtitulo: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.8rem',
        color: 'rgba(232,237,245,0.4)',
        margin: '4px 0 0',
    },
    cards: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    card: (destaque, atual) => ({
        background: destaque ? 'rgba(74,144,217,0.06)' : '#151B26',
        border: `1.5px solid ${destaque ? '#4A90D9' : atual ? 'rgba(74,144,217,0.3)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
    }),
    badgeMaisPopular: {
        position: 'absolute',
        top: 12,
        right: 12,
        background: '#4A90D9',
        color: '#fff',
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        letterSpacing: '0.04em',
    },
    badgeAtual: {
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(72,187,120,0.15)',
        color: '#48BB78',
        fontSize: '0.65rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        letterSpacing: '0.04em',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
        paddingRight: 90,
    },
    planNome: (destaque) => ({
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.3rem',
        color: destaque ? '#4A90D9' : '#E8EDF5',
        letterSpacing: '0.06em',
    }),
    precoWrap: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 2,
    },
    preco: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.3rem',
        color: '#E8EDF5',
        letterSpacing: '0.02em',
    },
    periodo: {
        fontSize: '0.7rem',
        color: 'rgba(232,237,245,0.4)',
    },
    precoGratis: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.85rem',
        color: 'rgba(232,237,245,0.4)',
        fontWeight: 600,
    },
    limiteTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 99,
        padding: '3px 10px',
        fontSize: '0.72rem',
        color: 'rgba(232,237,245,0.5)',
        marginBottom: 12,
    },
    recursos: {
        listStyle: 'none',
        padding: 0,
        margin: '0 0 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
    },
    recursoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.8rem',
        color: 'rgba(232,237,245,0.65)',
        fontFamily: "'Barlow', sans-serif",
    },
    btnAssinar: (destaque) => ({
        width: '100%',
        padding: '12px 0',
        background: destaque ? '#4A90D9' : 'rgba(74,144,217,0.1)',
        border: destaque ? 'none' : '1px solid rgba(74,144,217,0.3)',
        borderRadius: 12,
        color: destaque ? '#fff' : '#4A90D9',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1rem',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        boxShadow: destaque ? '0 4px 16px rgba(74,144,217,0.25)' : 'none',
    }),
    btnAtual: {
        width: '100%',
        padding: '12px 0',
        background: 'rgba(72,187,120,0.08)',
        border: '1px solid rgba(72,187,120,0.2)',
        borderRadius: 12,
        color: '#48BB78',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1rem',
        letterSpacing: '0.08em',
        textAlign: 'center',
    },
};
