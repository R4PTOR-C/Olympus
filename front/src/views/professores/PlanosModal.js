import React, { useEffect, useState, useCallback } from 'react';
import {
    billingDisponivel,
    iniciarBilling,
    ouvirBilling,
    precoDaLoja,
    assinar,
    restaurarCompras,
    gerenciarAssinatura,
} from '../../services/billing';

// Só recursos que existem de verdade: a política de assinaturas da Play exige
// descrever com exatidão o que o assinante recebe. Hoje os planos diferem
// apenas no limite de alunos (ver LIMITES_PLANO em back/vinculos.js).
const RECURSOS_BASE = [
    'Montagem de treinos para os alunos',
    'Histórico de treinos e avaliações físicas',
    'Chat com os alunos',
];

const PLANOS = [
    {
        key: 'gratuito',
        nome: 'Gratuito',
        preco: null,
        destaque: false,
        limite: '10 alunos',
        recursos: ['Até 10 alunos ativos', ...RECURSOS_BASE],
    },
    {
        key: 'pro',
        nome: 'Pro',
        preco: 'R$ 29,90',
        periodo: '/mês',
        destaque: true,
        limite: '50 alunos',
        recursos: ['Até 50 alunos ativos', 'Tudo do plano Gratuito'],
    },
    {
        key: 'elite',
        nome: 'Elite',
        preco: 'R$ 79,90',
        periodo: '/mês',
        destaque: false,
        limite: 'Ilimitado',
        recursos: ['Alunos ilimitados', 'Tudo do plano Gratuito'],
    },
];

const API = process.env.REACT_APP_API_BASE_URL;
const ORDEM = { gratuito: 0, pro: 1, elite: 2 };

export default function PlanosModal({ planoAtual, usuarioId, onPlanoAtualizado, onClose }) {
    const [pronto, setPronto]           = useState(false);
    const [precos, setPrecos]           = useState({});
    const [ativa, setAtiva]             = useState(null);   // assinatura vigente na loja
    const [processando, setProcessando] = useState(null);   // key do plano em compra
    const [restaurando, setRestaurando] = useState(false);
    const [erro, setErro]               = useState('');
    const [aviso, setAviso]             = useState('');

    const noApp = billingDisponivel();

    // Fecha com Esc
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // Assinatura vigente: necessária para TROCAR de plano sem criar uma segunda
    useEffect(() => {
        let vivo = true;
        fetch(`${API}/assinaturas/minha`)
            .then(r => (r.ok ? r.json() : null))
            .then(d => { if (vivo) setAtiva(d?.ativa || null); })
            .catch(() => {});
        return () => { vivo = false; };
    }, [planoAtual]);

    // Eventos do billing enquanto o modal está aberto
    useEffect(() => ouvirBilling({
        onPlanoAtualizado: (plano) => {
            setProcessando(null);
            setAviso('');
            onPlanoAtualizado?.(plano);
        },
        onPendente: () => {
            setProcessando(null);
            setAviso('Pagamento pendente. O plano é liberado assim que a Google Play confirmar o pagamento.');
        },
        onErro: (mensagem) => {
            setProcessando(null);
            setErro(mensagem);
        },
    }), [onPlanoAtualizado]);

    // Liga o billing (normalmente já ligado pela tela de alunos) e puxa os preços
    useEffect(() => {
        let vivo = true;
        if (!noApp) return undefined;
        iniciarBilling({ usuarioId }).then((ok) => {
            if (!vivo || !ok) return;
            setPronto(true);
            setPrecos({ pro: precoDaLoja('pro'), elite: precoDaLoja('elite') });
        });
        return () => { vivo = false; };
    }, [noApp, usuarioId]);

    const comprar = useCallback(async (key) => {
        setErro('');
        setAviso('');
        setProcessando(key);
        try {
            const seguiu = await assinar(key, ativa);
            // Cancelou na folha da Google: só volta ao normal
            if (!seguiu) setProcessando(null);
            // Se seguiu, o plano muda quando o backend validar (onPlanoAtualizado)
            // ou fica pendente (onPendente).
        } catch (err) {
            setErro(err.message);
            setProcessando(null);
        }
    }, [ativa]);

    const restaurar = useCallback(async () => {
        setErro('');
        setAviso('');
        setRestaurando(true);
        try {
            const plano = await restaurarCompras();
            onPlanoAtualizado?.(plano);
            if (plano === 'gratuito') setErro('Nenhuma assinatura ativa encontrada nesta conta Google.');
        } catch (err) {
            setErro(err.message);
        } finally {
            setRestaurando(false);
        }
    }, [onPlanoAtualizado]);

    const ocupado = Boolean(processando) || restaurando;
    const temPago = planoAtual !== 'gratuito';

    // Texto do botão de cada plano pago
    const rotulo = (plano) => {
        if (processando === plano.key) return 'Abrindo a Play Store...';
        if (!noApp) return 'Disponível no app';
        if (!pronto) return 'Carregando...';
        if (!temPago) return `Assinar ${plano.nome}`;
        return ORDEM[plano.key] > ORDEM[planoAtual]
            ? `Fazer upgrade para ${plano.nome}`
            : `Mudar para ${plano.nome}`;
    };

    return (
        <div style={S.overlay} onClick={ocupado ? undefined : onClose}>
            <div style={S.sheet} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="planos-titulo">

                {/* Handle + close */}
                <div style={S.handle} />
                <button style={S.btnClose} onClick={onClose} aria-label="Fechar" disabled={ocupado}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>

                {/* Header */}
                <div style={S.header}>
                    <h2 id="planos-titulo" style={S.titulo}>Planos</h2>
                    <p style={S.subtitulo}>Escolha o plano ideal para o tamanho da sua carteira de alunos</p>
                </div>

                {erro  && <div style={S.erro} role="alert">{erro}</div>}
                {aviso && <div style={S.aviso} role="status">{aviso}</div>}

                {!noApp && (
                    <div style={S.aviso}>
                        Assinaturas estão disponíveis no aplicativo Android. Baixe o Atlanteon
                        na Play Store para assinar.
                    </div>
                )}

                {/* Cards */}
                <div style={S.cards}>
                    {PLANOS.map(plano => {
                        const atual = plano.key === planoAtual;
                        const pago  = plano.preco !== null;
                        // Preço da loja manda: moeda e promoções vêm de lá.
                        const preco = precos[plano.key] || plano.preco;
                        const desabilitado = !noApp || !pronto || ocupado;
                        const downgrade = temPago && pago && ORDEM[plano.key] < ORDEM[planoAtual];

                        return (
                            <div key={plano.key} style={S.card(plano.destaque, atual)}>
                                <div style={S.cardHeader}>
                                    <div style={S.nomeWrap}>
                                        <span style={S.planNome(plano.destaque)}>{plano.nome}</span>
                                        {atual
                                            ? <span style={S.badgeAtual}>Seu plano</span>
                                            : plano.destaque && !temPago && <span style={S.badgeMaisPopular}>Mais popular</span>}
                                    </div>
                                    <div style={S.precoWrap}>
                                        {pago
                                            ? <>
                                                <span style={S.preco}>{preco}</span>
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
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={plano.destaque ? 'var(--color-accent)' : 'var(--color-text-dim)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                            {r}
                                        </li>
                                    ))}
                                </ul>

                                {pago && !atual && (
                                    <>
                                        <button
                                            style={S.btnAssinar(plano.destaque, desabilitado)}
                                            onClick={() => comprar(plano.key)}
                                            disabled={desabilitado}
                                        >
                                            {rotulo(plano)}
                                        </button>
                                        {downgrade && noApp && (
                                            <p style={S.notaTroca}>Vale quando o período já pago do plano atual terminar.</p>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Rodapé */}
                {noApp && (
                    <div style={S.rodape}>
                        <button style={S.btnTexto} onClick={restaurar} disabled={ocupado}>
                            {restaurando ? 'Restaurando...' : 'Restaurar compras'}
                        </button>
                        {temPago && (
                            <button style={S.btnTexto} onClick={gerenciarAssinatura} disabled={ocupado}>
                                Gerenciar assinatura
                            </button>
                        )}
                    </div>
                )}

                <p style={S.legal}>
                    A cobrança é feita pelo Google Play e renova automaticamente até
                    você cancelar. Cancele a qualquer momento em Play Store → Assinaturas.
                </p>

            </div>
        </div>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
// Usa as variáveis de tema do app (App.css), então segue o modo claro/escuro.

const S = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
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
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        borderRadius: '20px 20px 0 0',
        padding: '12px 20px calc(28px + env(safe-area-inset-bottom))',
        maxHeight: '92dvh',
        overflowY: 'auto',
        position: 'relative',
        animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
    },
    handle: {
        width: 36,
        height: 4,
        background: 'var(--color-border)',
        borderRadius: 99,
        margin: '0 auto 16px',
    },
    btnClose: {
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '50%',
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-text-muted)',
    },
    header: {
        marginBottom: 20,
        paddingRight: 40,
    },
    titulo: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.8rem',
        color: 'var(--color-text)',
        letterSpacing: '0.05em',
        margin: 0,
    },
    subtitulo: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
        margin: '4px 0 0',
    },
    cards: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    card: (destaque, atual) => ({
        background: destaque ? 'var(--color-accent-dim)' : 'var(--color-surface)',
        border: `1.5px solid ${atual ? 'var(--color-green)' : destaque ? 'var(--color-accent)' : 'var(--color-border)'}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: 'var(--color-shadow)',
    }),
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    nomeWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        minWidth: 0,
    },
    badgeMaisPopular: {
        background: 'var(--color-accent)',
        color: '#fff',
        fontSize: '0.62rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        letterSpacing: '0.04em',
        fontFamily: "'Barlow', sans-serif",
    },
    badgeAtual: {
        background: 'rgba(46,204,113,0.14)',
        color: 'var(--color-green)',
        fontSize: '0.62rem',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 99,
        letterSpacing: '0.04em',
        fontFamily: "'Barlow', sans-serif",
    },
    planNome: (destaque) => ({
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.3rem',
        color: destaque ? 'var(--color-accent)' : 'var(--color-text)',
        letterSpacing: '0.06em',
    }),
    precoWrap: {
        display: 'flex',
        alignItems: 'baseline',
        gap: 2,
        flexShrink: 0,
    },
    preco: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.3rem',
        color: 'var(--color-text)',
        letterSpacing: '0.02em',
    },
    periodo: {
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
    },
    precoGratis: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.85rem',
        color: 'var(--color-text-muted)',
        fontWeight: 600,
    },
    limiteTag: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 99,
        padding: '3px 10px',
        fontSize: '0.72rem',
        color: 'var(--color-text-muted)',
        marginBottom: 12,
    },
    recursos: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
    },
    recursoItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
        fontFamily: "'Barlow', sans-serif",
    },
    btnAssinar: (destaque, desabilitado) => ({
        width: '100%',
        marginTop: 14,
        padding: '12px 0',
        background: destaque ? 'var(--color-accent)' : 'var(--color-accent-dim)',
        border: destaque ? 'none' : '1px solid var(--color-accent)',
        borderRadius: 12,
        color: destaque ? '#fff' : 'var(--color-accent)',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1rem',
        letterSpacing: '0.08em',
        cursor: desabilitado ? 'default' : 'pointer',
        opacity: desabilitado ? 0.5 : 1,
        boxShadow: destaque && !desabilitado ? '0 4px 16px rgba(74,144,217,0.25)' : 'none',
        transition: 'opacity 0.2s ease',
    }),
    notaTroca: {
        margin: '6px 0 0',
        fontSize: '0.7rem',
        color: 'var(--color-text-dim)',
        fontFamily: "'Barlow', sans-serif",
        textAlign: 'center',
    },
    erro: {
        background: 'rgba(232,64,64,0.08)',
        border: '1px solid rgba(232,64,64,0.3)',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 12,
        fontSize: '0.78rem',
        color: 'var(--color-red)',
        fontFamily: "'Barlow', sans-serif",
    },
    aviso: {
        background: 'rgba(246,173,85,0.1)',
        border: '1px solid rgba(221,140,40,0.35)',
        borderRadius: 12,
        padding: '10px 12px',
        marginBottom: 12,
        fontSize: '0.78rem',
        color: '#C77A12',
        fontFamily: "'Barlow', sans-serif",
        lineHeight: 1.45,
    },
    rodape: {
        display: 'flex',
        justifyContent: 'center',
        gap: 18,
        marginTop: 16,
    },
    btnTexto: {
        background: 'none',
        border: 'none',
        padding: 0,
        color: 'var(--color-text-muted)',
        fontSize: '0.78rem',
        fontWeight: 600,
        fontFamily: "'Barlow', sans-serif",
        cursor: 'pointer',
        textDecoration: 'underline',
    },
    legal: {
        margin: '16px 0 0',
        fontSize: '0.68rem',
        lineHeight: 1.5,
        color: 'var(--color-text-dim)',
        fontFamily: "'Barlow', sans-serif",
        textAlign: 'center',
    },
};
