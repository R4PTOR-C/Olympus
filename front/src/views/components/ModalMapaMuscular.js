import React, { useEffect, useState } from 'react';
import GraficoMuscular from './GraficoMuscular';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function ModalMapaMuscular({ userId, onClose }) {
    const [dados, setDados] = useState(null);
    const [loading, setLoading] = useState(true);

    const mesAtual = MONTHS[new Date().getMonth()];

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch(
            `${process.env.REACT_APP_API_BASE_URL}/treinos/usuarios/${userId}/musculos-mes`,
            { headers: { Authorization: `Bearer ${token}` } }
        )
            .then(r => r.json())
            .then(data => { setDados(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [userId]);

    const temDados = dados && Object.keys(dados).length > 0;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={styles.sheet} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div style={styles.header}>
                    <div>
                        <div style={styles.title}>Mapa Muscular</div>
                        <div style={styles.subtitle}>{mesAtual}</div>
                    </div>
                    <button style={styles.closeBtn} onClick={onClose}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth="2.5"
                            strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Conteúdo */}
                <div style={styles.body}>
                    {loading ? (
                        <div style={styles.center}>
                            <div style={styles.spinner} />
                        </div>
                    ) : !temDados ? (
                        <div style={styles.center}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
                                stroke="#3a3a58" strokeWidth="1.5"
                                strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            <p style={{ color: '#3a3a58', fontSize: 13, marginTop: 12, textAlign: 'center' }}>
                                Nenhum treino registrado em {mesAtual}.
                            </p>
                        </div>
                    ) : (
                        <GraficoMuscular dados={dados} />
                    )}
                </div>

                {/* Legenda de escala */}
                {temDados && (
                    <div style={styles.legend}>
                        <span style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, opacity: 0.3 }} />
                            Baixo &lt;20
                        </span>
                        <span style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, opacity: 0.6 }} />
                            Bom 40–80
                        </span>
                        <span style={styles.legendItem}>
                            <span style={{ ...styles.legendDot, opacity: 1 }} />
                            Alto 80+
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed', inset: 0, zIndex: 1200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
    },
    sheet: {
        width: '100%', maxWidth: 480,
        background: '#0e0e1a',
        borderRadius: '20px 20px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        maxHeight: '92vh',
        overflowY: 'auto',
    },
    header: {
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '20px 20px 8px',
        borderBottom: '1px solid #1e1e30',
    },
    title: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.3rem', letterSpacing: '0.06em',
        color: '#e8edf5',
    },
    subtitle: {
        fontSize: 12, color: '#4A90D9',
        fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', marginTop: 2,
    },
    closeBtn: {
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#4a4a6a', padding: 4, lineHeight: 0,
    },
    body: {
        padding: '12px 8px 0',
    },
    center: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        minHeight: 200, padding: 24,
    },
    spinner: {
        width: 32, height: 32,
        border: '3px solid #1e1e30',
        borderTop: '3px solid #4A90D9',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
    },
    legend: {
        display: 'flex', justifyContent: 'center', gap: 20,
        padding: '12px 20px 20px',
    },
    legendItem: {
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: '#4a4a6a',
        fontFamily: 'system-ui, sans-serif',
    },
    legendDot: {
        width: 8, height: 8, borderRadius: 2,
        background: '#4A90D9', display: 'inline-block',
    },
};
