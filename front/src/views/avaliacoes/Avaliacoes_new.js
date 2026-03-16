import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../../styles/Avaliacoes.css';

const API = process.env.REACT_APP_API_BASE_URL;

// ── Fórmula Marinha dos EUA (U.S. Navy Method) ──────────────────────────────
// Versão adaptada para centímetros (Hodgdon & Beckett)
function calcNavyBF(sexo, altura, cintura, pescoco, quadril) {
    if (!altura || !cintura || !pescoco) return null;
    if (sexo === 'F' && !quadril) return null;
    if (cintura <= pescoco) return null;
    if (sexo === 'F' && cintura + quadril <= pescoco) return null;

    let bf;
    if (sexo === 'M') {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(cintura - pescoco) + 0.15456 * Math.log10(altura)) - 450;
    } else {
        bf = 495 / (1.29579 - 0.35004 * Math.log10(cintura + quadril - pescoco) + 0.22100 * Math.log10(altura)) - 450;
    }
    return Math.max(2, Math.min(60, parseFloat(bf.toFixed(1))));
}

// ── Classificação ────────────────────────────────────────────────────────────
const CLASSES_M = [
    { label: 'Muito Baixo',     max: 6,   color: '#4A90D9' },
    { label: 'Atlético',        max: 14,  color: '#2ECC71' },
    { label: 'Ótimo',           max: 18,  color: '#27ae60' },
    { label: 'Bom',             max: 25,  color: '#F1C40F' },
    { label: 'Acima da Média',  max: 30,  color: '#E67E22' },
    { label: 'Alto',            max: 100, color: '#E84040' },
];

const CLASSES_F = [
    { label: 'Muito Baixo',     max: 14,  color: '#4A90D9' },
    { label: 'Atlética',        max: 21,  color: '#2ECC71' },
    { label: 'Ótimo',           max: 25,  color: '#27ae60' },
    { label: 'Bom',             max: 32,  color: '#F1C40F' },
    { label: 'Acima da Média',  max: 37,  color: '#E67E22' },
    { label: 'Alto',            max: 100, color: '#E84040' },
];

function getClass(bf, sexo) {
    const classes = sexo === 'M' ? CLASSES_M : CLASSES_F;
    return classes.find(c => bf < c.max) || classes[classes.length - 1];
}

// Percentual relativo à barra (escala: homens 0-35%, mulheres 0-45%)
function barPercent(bf, sexo) {
    const max = sexo === 'M' ? 35 : 45;
    return Math.min(100, (bf / max) * 100);
}

const Avaliacoes_new = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [sexo,     setSexo]     = useState('M');
    const [altura,   setAltura]   = useState('');  // cm
    const [peso,     setPeso]     = useState('');  // kg
    const [cintura,  setCintura]  = useState('');  // cm
    const [pescoco,  setPescoco]  = useState('');  // cm
    const [quadril,  setQuadril]  = useState('');  // cm (feminino)
    const [submitting, setSubmitting] = useState(false);
    const [sucesso,    setSucesso]    = useState(false);

    const bf = useMemo(() =>
        calcNavyBF(
            sexo,
            parseFloat(altura),
            parseFloat(cintura),
            parseFloat(pescoco),
            parseFloat(quadril),
        ),
        [sexo, altura, cintura, pescoco, quadril]
    );

    const classe  = bf !== null ? getClass(bf, sexo) : null;
    const pesoNum = parseFloat(peso);
    const massaGorda  = bf !== null && pesoNum ? ((bf / 100) * pesoNum).toFixed(1) : null;
    const massaMagra  = massaGorda !== null     ? (pesoNum - parseFloat(massaGorda)).toFixed(1) : null;

    const canSubmit = bf !== null && pesoNum > 0 && parseFloat(altura) > 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setSubmitting(true);
        try {
            const alturaM = (parseFloat(altura) / 100).toFixed(2);
            const medicoes = { cintura: parseFloat(cintura), pescoco: parseFloat(pescoco) };
            if (sexo === 'F') medicoes.quadril = parseFloat(quadril);

            const res = await fetch(`${API}/avaliacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: id,
                    altura: alturaM,
                    peso: pesoNum,
                    gordura_corporal: bf,
                    medicoes,
                }),
            });
            if (!res.ok) throw new Error();
            setSucesso(true);
        } catch {
            console.error('Erro ao registrar avaliação.');
        } finally {
            setSubmitting(false);
        }
    };

    if (sucesso) {
        return (
            <div className="av-page">
                <div className="av-header">
                    <div className="av-header-top">
                        <button className="av-back-btn" onClick={() => navigate(-1)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <div>
                            <p className="av-header-eyebrow">Avaliação Física</p>
                            <h1 className="av-header-title">Composição Corporal</h1>
                        </div>
                    </div>
                </div>
                <div className="av-body">
                    <div className="av-section">
                        <div className="av-sucesso">
                            <div className="av-sucesso-icon">
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <p className="av-sucesso-title">Avaliação Salva</p>
                            <p className="av-sucesso-sub">Gordura corporal: {bf}%</p>
                        </div>
                    </div>
                    <div className="av-actions">
                        <button className="av-btn-submit" onClick={() => navigate(-1)}>
                            Voltar ao Perfil
                        </button>
                        <button className="av-btn-cancel" onClick={() => { setSucesso(false); setCintura(''); setPescoco(''); setQuadril(''); setPeso(''); setAltura(''); }}>
                            Nova Avaliação
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="av-page">

            {/* ── HEADER ── */}
            <div className="av-header">
                <div className="av-header-top">
                    <button className="av-back-btn" onClick={() => navigate(-1)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>
                    <div>
                        <p className="av-header-eyebrow">Avaliação Física</p>
                        <h1 className="av-header-title">Composição Corporal</h1>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="av-body">

                    {/* ── DADOS BÁSICOS ── */}
                    <div className="av-section">
                        <div className="av-section-header">
                            <svg className="av-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span className="av-section-title">Dados Básicos</span>
                        </div>
                        <div className="av-section-body">

                            {/* Sexo */}
                            <div className="av-field">
                                <label className="av-label">Sexo Biológico</label>
                                <div className="av-sexo-chips">
                                    <button type="button" className={`av-sexo-chip${sexo === 'M' ? ' active' : ''}`} onClick={() => { setSexo('M'); setQuadril(''); }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="11" r="6"/><path d="M20 4l-6 6"/><path d="M15 4h5v5"/>
                                        </svg>
                                        Masculino
                                    </button>
                                    <button type="button" className={`av-sexo-chip${sexo === 'F' ? ' active' : ''}`} onClick={() => setSexo('F')}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="9" r="6"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="9" y1="18" x2="15" y2="18"/>
                                        </svg>
                                        Feminino
                                    </button>
                                </div>
                            </div>

                            {/* Altura + Peso */}
                            <div className="av-inputs-row">
                                <div className="av-field">
                                    <label className="av-label">Altura (cm)</label>
                                    <input className="av-input" type="number" placeholder="175" value={altura} onChange={e => setAltura(e.target.value)} min="100" max="250" step="1" />
                                </div>
                                <div className="av-field">
                                    <label className="av-label">Peso (kg)</label>
                                    <input className="av-input" type="number" placeholder="80" value={peso} onChange={e => setPeso(e.target.value)} min="30" max="300" step="0.1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── MEDIDAS ── */}
                    <div className="av-section">
                        <div className="av-section-header">
                            <svg className="av-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M2 12h20M2 12l4-4M2 12l4 4M22 12l-4-4M22 12l-4 4"/>
                            </svg>
                            <span className="av-section-title">Medidas Corporais</span>
                        </div>
                        <div className="av-section-body">
                            <div className="av-inputs-row">
                                <div className="av-field">
                                    <label className="av-label">Cintura (cm)</label>
                                    <input className="av-input" type="number" placeholder="80" value={cintura} onChange={e => setCintura(e.target.value)} min="40" max="200" step="0.5" />
                                </div>
                                <div className="av-field">
                                    <label className="av-label">Pescoço (cm)</label>
                                    <input className="av-input" type="number" placeholder="38" value={pescoco} onChange={e => setPescoco(e.target.value)} min="20" max="80" step="0.5" />
                                </div>
                            </div>
                            {sexo === 'F' && (
                                <div className="av-field">
                                    <label className="av-label">Quadril (cm)</label>
                                    <input className="av-input" type="number" placeholder="96" value={quadril} onChange={e => setQuadril(e.target.value)} min="50" max="200" step="0.5" />
                                </div>
                            )}
                            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--av-text-dim)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.04em' }}>
                                Meça a cintura na parte mais estreita, o pescoço logo abaixo da laringe.{sexo === 'F' ? ' Quadril na parte mais larga.' : ''}
                            </p>
                        </div>
                    </div>

                    {/* ── RESULTADO ── */}
                    <div className="av-resultado">
                        <div className="av-resultado-header">
                            <svg className="av-section-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                            <span className="av-section-title">Resultado — Método Navy</span>
                        </div>
                        <div className="av-resultado-body">
                            {bf !== null ? (
                                <>
                                    {/* Número grande */}
                                    <div className="av-bf-display">
                                        <span className="av-bf-number" style={{ color: classe.color }}>{bf}</span>
                                        <span className="av-bf-unit">%</span>
                                    </div>

                                    {/* Badge classificação */}
                                    <div className="av-bf-class-wrap">
                                        <span className="av-bf-class" style={{ background: `${classe.color}20`, color: classe.color, border: `1px solid ${classe.color}40` }}>
                                            {classe.label}
                                        </span>
                                    </div>

                                    {/* Barra */}
                                    <div className="av-bar-wrap">
                                        <div className="av-bar-track">
                                            <div className="av-bar-fill" style={{ width: `${barPercent(bf, sexo)}%`, background: classe.color }} />
                                        </div>
                                        <div className="av-bar-labels">
                                            <span>Atlético</span>
                                            <span>Médio</span>
                                            <span>Alto</span>
                                        </div>
                                    </div>

                                    {/* Massa magra / gorda */}
                                    {massaMagra && (
                                        <div className="av-stats">
                                            <div className="av-stat">
                                                <span className="av-stat-val" style={{ color: '#4A90D9' }}>{massaMagra} kg</span>
                                                <span className="av-stat-label">Massa Magra</span>
                                            </div>
                                            <div className="av-stat">
                                                <span className="av-stat-val" style={{ color: classe.color }}>{massaGorda} kg</span>
                                                <span className="av-stat-label">Massa Gorda</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="av-empty-result">Preencha as medidas para calcular</p>
                            )}
                        </div>
                    </div>

                    {/* ── AÇÕES ── */}
                    <div className="av-actions">
                        <button type="submit" className="av-btn-submit" disabled={!canSubmit || submitting}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            {submitting ? 'Salvando...' : 'Salvar Avaliação'}
                        </button>
                        <button type="button" className="av-btn-cancel" onClick={() => navigate(-1)}>
                            Cancelar
                        </button>
                    </div>

                </div>
            </form>
        </div>
    );
};

export default Avaliacoes_new;
