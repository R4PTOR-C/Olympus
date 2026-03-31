import { useEffect, useRef } from 'react';

function formatarData(dataStr) {
    const data = new Date(dataStr);
    const hoje = new Date();
    const diff = Math.floor((hoje - data) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Ontem';
    if (diff < 7) return `${diff} dias atrás`;
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function HerculesSidebar({ aberta, conversas, conversaAtiva, onSelecionar, onNova, onDeletar, onFechar }) {
    const sidebarRef = useRef(null);

    // Fechar ao pressionar ESC
    useEffect(() => {
        if (!aberta) return;
        const handler = (e) => { if (e.key === 'Escape') onFechar(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [aberta, onFechar]);

    const s = {
        overlay: {
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.55)',
            opacity: aberta ? 1 : 0,
            pointerEvents: aberta ? 'all' : 'none',
            transition: 'opacity 0.25s ease',
        },
        drawer: {
            position: 'fixed', top: 0, left: 0, bottom: 0,
            width: 280, zIndex: 201,
            background: '#111720',
            borderRight: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', flexDirection: 'column',
            transform: aberta ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: aberta ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
        },
        header: {
            padding: '16px 14px 12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
        },
        titulo: {
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.1rem', letterSpacing: '0.1em',
            color: '#E8EDF5', margin: 0,
        },
        btnFechar: {
            background: 'none', border: 'none', color: 'rgba(200,209,208,0.4)',
            cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
            borderRadius: 6, transition: 'color 0.15s',
        },
        btnNova: {
            margin: '10px 12px',
            background: 'rgba(74,144,217,0.12)',
            border: '1px solid rgba(74,144,217,0.3)',
            borderRadius: 10, padding: '9px 14px',
            color: '#4A90D9',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 7,
            transition: 'all 0.15s', flexShrink: 0,
        },
        lista: {
            flex: 1, overflowY: 'auto', padding: '4px 8px 16px',
        },
        item: (ativo) => ({
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 10px', borderRadius: 10, marginBottom: 2,
            cursor: 'pointer',
            background: ativo ? 'rgba(74,144,217,0.14)' : 'transparent',
            border: ativo ? '1px solid rgba(74,144,217,0.25)' : '1px solid transparent',
            transition: 'all 0.15s', gap: 6,
        }),
        itemTexto: {
            flex: 1, minWidth: 0,
        },
        itemTitulo: {
            fontSize: '0.82rem', color: '#E8EDF5',
            fontFamily: "'Barlow', sans-serif",
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            lineHeight: 1.3,
        },
        itemData: {
            fontSize: '0.62rem', color: 'rgba(200,209,208,0.35)',
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: '0.06em', marginTop: 2,
        },
        btnDel: {
            background: 'none', border: 'none',
            color: 'rgba(232,64,64,0.4)', cursor: 'pointer',
            padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center',
            transition: 'color 0.15s', flexShrink: 0,
        },
        vazio: {
            padding: '24px 16px', textAlign: 'center',
            color: 'rgba(200,209,208,0.25)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase',
        },
    };

    return (
        <>
            <div style={s.overlay} className="hc-sidebar-overlay" onClick={onFechar} />
            <div style={s.drawer} className="hc-sidebar-drawer" ref={sidebarRef}>
                <div style={s.header}>
                    <p style={s.titulo}>Conversas</p>
                    <button style={s.btnFechar} onClick={onFechar}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <button style={s.btnNova} onClick={onNova}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Nova conversa
                </button>

                <div style={s.lista}>
                    {conversas.length === 0 && (
                        <p style={s.vazio}>Nenhuma conversa ainda</p>
                    )}
                    {conversas.map(c => (
                        <div key={c.id} style={s.item(c.id === conversaAtiva)} onClick={() => onSelecionar(c)}>
                            <div style={s.itemTexto}>
                                <div style={s.itemTitulo}>{c.titulo}</div>
                                <div style={s.itemData}>{formatarData(c.criado_em)}</div>
                            </div>
                            <button
                                style={s.btnDel}
                                onClick={e => { e.stopPropagation(); onDeletar(c.id); }}
                                title="Deletar conversa"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default HerculesSidebar;
