import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconSprout = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V12" />
        <path d="M12 12C12 7 7 4 3 5c0 4 3 8 9 7z" />
        <path d="M12 12C12 7 17 4 21 5c0 4-3 8-9 7z" />
        <path d="M9 20c1-1 2-1.5 3-1.5s2 .5 3 1.5" />
    </svg>
);

const IconDumbbell = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5v14M18 5v14" />
        <path d="M3 7v10M21 7v10" />
        <path d="M6 12h12" />
        <rect x="4" y="6" width="2" height="12" rx="1" />
        <rect x="18" y="6" width="2" height="12" rx="1" />
        <rect x="1" y="8" width="3" height="8" rx="1" />
        <rect x="20" y="8" width="3" height="8" rx="1" />
        <line x1="7" y1="12" x2="17" y2="12" />
    </svg>
);

const IconTrophy = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H3V5h3M18 9h3V5h-3" />
        <path d="M6 5h12v8a6 6 0 0 1-12 0V5z" />
        <path d="M9 21h6M12 17v4" />
        <path d="M8 21h8" />
    </svg>
);

const IconLightning = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
);

const IconClock = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const IconCheckCircle = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const IconFire = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 0 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
);

const IconBuilding = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9M15 21V9" />
        <rect x="6" y="13" width="2" height="2" />
        <rect x="11" y="13" width="2" height="2" />
        <rect x="16" y="13" width="2" height="2" />
        <rect x="6" y="6" width="2" height="2" />
        <rect x="16" y="6" width="2" height="2" />
    </svg>
);

const IconHome = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const IconTree = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22v-7" />
        <path d="M8 15l4-8 4 8H8z" />
        <path d="M6 19l6-12 6 12H6z" />
    </svg>
);

const IconMale = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="14" r="5" />
        <line x1="19" y1="5" x2="14.14" y2="9.86" />
        <polyline points="15 5 19 5 19 9" />
    </svg>
);

const IconFemale = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="5" />
        <line x1="12" y1="13" x2="12" y2="21" />
        <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
);

const IconNeutral = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
);

const IconHeart = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
);

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
    {
        key: 'experiencia',
        title: 'Qual é seu nível de experiência?',
        subtitle: 'Isso ajuda o Hércules a personalizar seus treinos',
        layout: 'grid2',
        options: [
            { value: 'Iniciante',     label: 'Iniciante',      desc: 'Estou começando agora',       icon: <IconSprout /> },
            { value: 'Intermediário', label: 'Intermediário',  desc: 'Treino há 1–3 anos',          icon: <IconDumbbell /> },
            { value: 'Avançado',      label: 'Avançado',       desc: 'Treino há mais de 3 anos',    icon: <IconTrophy /> },
        ],
    },
    {
        key: 'dias',
        title: 'Quantos dias por semana você treina?',
        subtitle: 'Seja honesto — qualidade > quantidade',
        layout: 'pills',
        options: [
            { value: '2', label: '2', desc: 'dias' },
            { value: '3', label: '3', desc: 'dias' },
            { value: '4', label: '4', desc: 'dias' },
            { value: '5', label: '5', desc: 'dias' },
            { value: '6', label: '6', desc: 'dias' },
        ],
    },
    {
        key: 'tempo',
        title: 'Quanto tempo você tem por sessão?',
        subtitle: 'Inclui aquecimento e alongamento',
        layout: 'grid2',
        options: [
            { value: '30',  label: '30 min',  desc: 'Treino rápido e focado',  icon: <IconLightning /> },
            { value: '45',  label: '45 min',  desc: 'Equilíbrio perfeito',     icon: <IconClock /> },
            { value: '60',  label: '60 min',  desc: 'Sessão completa',         icon: <IconCheckCircle /> },
            { value: '90+', label: '90 min+', desc: 'Treino extenso',          icon: <IconFire /> },
        ],
    },
    {
        key: 'local',
        title: 'Onde você costuma treinar?',
        subtitle: 'Podemos adaptar os exercícios ao seu ambiente',
        layout: 'col1',
        options: [
            { value: 'Academia',    label: 'Academia',     desc: 'Acesso completo a equipamentos', icon: <IconBuilding /> },
            { value: 'Casa',        label: 'Casa',         desc: 'Treino com o que tenho',         icon: <IconHome /> },
            { value: 'Ao ar livre', label: 'Ao ar livre',  desc: 'Treino funcional e livre',       icon: <IconTree /> },
        ],
    },
    {
        key: 'genero',
        title: 'Qual é o seu gênero?',
        subtitle: 'Usado para personalizar métricas e recomendações',
        layout: 'col1',
        options: [
            { value: 'Masculino', label: 'Masculino', desc: '', icon: <IconMale /> },
            { value: 'Feminino',  label: 'Feminino',  desc: '', icon: <IconFemale /> },
            { value: 'Outro',     label: 'Prefiro não informar', desc: '', icon: <IconNeutral /> },
        ],
    },
    {
        key: 'biometria',
        title: 'Altura e peso',
        subtitle: 'Essas informações ajudam a acompanhar sua evolução',
        layout: 'inputs',
        fields: [
            { key: 'altura', label: 'Altura', placeholder: '175', unit: 'cm', min: 100, max: 250 },
            { key: 'peso',   label: 'Peso',   placeholder: '70',  unit: 'kg', min: 30,  max: 300 },
        ],
    },
    {
        key: 'objetivo',
        title: 'Qual é o seu objetivo?',
        subtitle: 'Isso guia as recomendações do Hércules',
        layout: 'col1',
        options: [
            { value: 'Emagrecimento',          label: 'Emagrecimento',     desc: 'Perder gordura e definir o corpo',      icon: <IconFire /> },
            { value: 'Hipertrofia',            label: 'Hipertrofia',       desc: 'Ganhar massa muscular',                 icon: <IconDumbbell /> },
            { value: 'Condicionamento físico', label: 'Condicionamento',   desc: 'Melhorar resistência e saúde geral',   icon: <IconHeart /> },
        ],
    },
];

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
    page: {
        minHeight: '100dvh',
        background: '#0E1117',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 0 40px',
        fontFamily: "'Barlow', sans-serif",
        overflowX: 'hidden',
    },
    topBar: {
        width: '100%',
        maxWidth: 480,
        padding: '24px 24px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
    },
    progressOuter: {
        flex: 1,
        height: 3,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 99,
        overflow: 'hidden',
        marginRight: 12,
    },
    progressInner: (pct) => ({
        height: '100%',
        width: `${pct}%`,
        background: 'linear-gradient(90deg, #4A90D9, #6EB0F5)',
        borderRadius: 99,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
    }),
    stepLabel: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.75rem',
        color: 'rgba(232,237,245,0.4)',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
    },
    content: {
        width: '100%',
        maxWidth: 480,
        padding: '36px 24px 0',
        boxSizing: 'border-box',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    stepTitle: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '2rem',
        color: '#E8EDF5',
        letterSpacing: '0.04em',
        lineHeight: 1.1,
        margin: '0 0 8px',
    },
    stepSubtitle: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.85rem',
        color: 'rgba(232,237,245,0.45)',
        margin: '0 0 32px',
        lineHeight: 1.5,
    },
    optionsGrid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
    },
    optionsCol1: {
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
    },
    optionsPills: {
        display: 'flex',
        gap: 10,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    card: (selected) => ({
        background: selected ? 'rgba(74,144,217,0.1)' : '#151B26',
        border: `1.5px solid ${selected ? '#4A90D9' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '20px 16px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        textAlign: 'center',
        transform: selected ? 'scale(1.02)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
    }),
    cardWide: (selected) => ({
        background: selected ? 'rgba(74,144,217,0.1)' : '#151B26',
        border: `1.5px solid ${selected ? '#4A90D9' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: 16,
        padding: '18px 20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        transform: selected ? 'scale(1.01)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
    }),
    cardLabel: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '1rem',
        color: '#E8EDF5',
        letterSpacing: '0.03em',
    },
    cardDesc: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.75rem',
        color: 'rgba(232,237,245,0.45)',
        lineHeight: 1.4,
    },
    pill: (selected) => ({
        background: selected ? 'rgba(74,144,217,0.15)' : '#151B26',
        border: `1.5px solid ${selected ? '#4A90D9' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '14px 20px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        minWidth: 64,
        transform: selected ? 'scale(1.06)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
    }),
    pillNumber: {
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '2rem',
        color: '#E8EDF5',
        lineHeight: 1,
    },
    pillSub: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.7rem',
        color: 'rgba(232,237,245,0.45)',
        letterSpacing: '0.04em',
    },
    // Inputs layout (biometria)
    inputsRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    inputLabel: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '0.8rem',
        color: 'rgba(232,237,245,0.5)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    inputWrap: (focused) => ({
        display: 'flex',
        alignItems: 'center',
        background: focused ? 'rgba(74,144,217,0.08)' : '#151B26',
        border: `1.5px solid ${focused ? '#4A90D9' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '14px 16px',
        gap: 8,
        transition: 'all 0.2s',
    }),
    inputField: {
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '2rem',
        color: '#E8EDF5',
        lineHeight: 1,
        width: '100%',
        minWidth: 0,
    },
    inputUnit: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.75rem',
        color: 'rgba(232,237,245,0.3)',
        letterSpacing: '0.04em',
        alignSelf: 'flex-end',
        paddingBottom: 2,
    },
    // Account creation form
    accountField: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        marginBottom: 16,
    },
    accountLabel: {
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: '0.8rem',
        color: 'rgba(232,237,245,0.5)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
    },
    accountInput: (focused) => ({
        background: focused ? 'rgba(74,144,217,0.08)' : '#151B26',
        border: `1.5px solid ${focused ? '#4A90D9' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '14px 16px',
        fontFamily: "'Barlow', sans-serif",
        fontSize: '1rem',
        color: '#E8EDF5',
        outline: 'none',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'all 0.2s',
    }),
    accountInputWrap: (focused) => ({
        display: 'flex',
        alignItems: 'center',
        background: focused ? 'rgba(74,144,217,0.08)' : '#151B26',
        border: `1.5px solid ${focused ? '#4A90D9' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 14,
        padding: '0 16px',
        transition: 'all 0.2s',
    }),
    accountInputInner: {
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        fontFamily: "'Barlow', sans-serif",
        fontSize: '1rem',
        color: '#E8EDF5',
        padding: '14px 0',
    },
    eyeBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'rgba(232,237,245,0.3)',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
    },
    errorMsg: {
        background: 'rgba(229,62,62,0.1)',
        border: '1px solid rgba(229,62,62,0.3)',
        borderRadius: 10,
        padding: '10px 14px',
        color: '#FC8181',
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.82rem',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    footer: {
        width: '100%',
        maxWidth: 480,
        padding: '28px 24px 0',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
    },
    btnContinuar: (disabled) => ({
        width: '100%',
        padding: '16px 0',
        background: disabled ? 'rgba(255,255,255,0.06)' : '#4A90D9',
        color: disabled ? 'rgba(255,255,255,0.25)' : '#fff',
        border: 'none',
        borderRadius: 14,
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '1.2rem',
        letterSpacing: '0.1em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 4px 20px rgba(74,144,217,0.3)',
    }),
    btnSkip: {
        background: 'none',
        border: 'none',
        color: 'rgba(232,237,245,0.3)',
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.82rem',
        cursor: 'pointer',
        padding: '4px 8px',
        letterSpacing: '0.02em',
    },
    loginLink: {
        fontFamily: "'Barlow', sans-serif",
        fontSize: '0.82rem',
        color: 'rgba(232,237,245,0.3)',
        textAlign: 'center',
    },
};

// ── Component ─────────────────────────────────────────────────────────────────

function Onboarding() {
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState({});
    const [animKey, setAnimKey] = useState(0);
    const [finishing, setFinishing] = useState(false);

    // Account creation (final step)
    const [accountData, setAccountData] = useState({ nome: '', email: '', senha: '' });
    const [senhaVis, setSenhaVis] = useState(false);
    const [accountError, setAccountError] = useState(null);

    // Focus state for styled inputs
    const [focusedField, setFocusedField] = useState(null);

    const totalSteps = STEPS.length + 1; // +1 for account creation
    const isAccountStep = currentStep === STEPS.length;
    const step = !isAccountStep ? STEPS[currentStep] : null;
    const progress = (currentStep / totalSteps) * 100;

    const isStepComplete = () => {
        if (isAccountStep) {
            return (
                accountData.nome.trim().length > 0 &&
                accountData.email.trim().length > 0 &&
                accountData.senha.length >= 6
            );
        }
        if (!step) return false;
        if (step.layout === 'inputs') {
            return step.fields.every(f => selections[f.key] && String(selections[f.key]).trim() !== '');
        }
        return !!selections[step.key];
    };

    // Inject keyframes once
    useEffect(() => {
        const id = 'onboarding-keyframes';
        if (document.getElementById(id)) return;
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            @keyframes slideIn {
                from { opacity: 0; transform: translateX(40px); }
                to   { opacity: 1; transform: translateX(0); }
            }
            @keyframes slideOut {
                from { opacity: 1; transform: translateX(0); }
                to   { opacity: 0; transform: translateX(-40px); }
            }
        `;
        document.head.appendChild(style);
    }, []);

    const handleSelect = (value) => {
        setSelections(prev => ({ ...prev, [step.key]: value }));
    };

    const handleInputChange = (fieldKey, value) => {
        setSelections(prev => ({ ...prev, [fieldKey]: value }));
    };

    const advance = () => {
        if (!isStepComplete()) return;
        if (isAccountStep) { createAccount(); return; }
        setAnimKey(k => k + 1);
        setCurrentStep(s => s + 1);
    };

    const skip = () => {
        setAnimKey(k => k + 1);
        setCurrentStep(s => s + 1);
    };

    const createAccount = async () => {
        setFinishing(true);
        setAccountError(null);
        try {
            const formData = new FormData();
            formData.append('nome',    accountData.nome.trim());
            formData.append('email',   accountData.email.trim());
            formData.append('senha',   accountData.senha);
            formData.append('genero',  selections.genero  || '');
            formData.append('altura',  selections.altura  || '');
            formData.append('peso',    selections.peso    || '');
            formData.append('objetivo', selections.objetivo || '');
            formData.append('funcao',  'Aluno');

            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setAccountError(data.error || 'Falha ao criar conta.');
                setFinishing(false);
                return;
            }

            const data = await res.json();
            const userId = data.id;

            // Save fitness preferences
            await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nivel_experiencia:    selections.experiencia,
                    dias_disponiveis:     selections.dias,
                    tempo_sessao:         selections.tempo,
                    local_treino:         selections.local,
                    onboarding_concluido: true,
                }),
            });

            // Login automático
            const loginRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: accountData.email.trim(), senha: accountData.senha }),
            });
            const loginData = await loginRes.json();
            login(
                { userName: loginData.userName, userId: loginData.userId, funcao: loginData.funcao, funcao_extra: loginData.funcao_extra, avatar: loginData.avatar },
                loginData.token
            );
            navigate(`/home/${loginData.userId}`);
        } catch {
            setAccountError('Erro de rede. Verifique sua conexão.');
            setFinishing(false);
        }
    };

    // ── Render options by layout ─────────────────────────────────────────────

    const renderOptions = () => {
        if (!step) return null;

        if (step.layout === 'pills') {
            return (
                <div style={S.optionsPills}>
                    {step.options.map(opt => (
                        <div
                            key={opt.value}
                            style={S.pill(selections[step.key] === opt.value)}
                            onClick={() => handleSelect(opt.value)}
                        >
                            <span style={S.pillNumber}>{opt.label}</span>
                            <span style={S.pillSub}>{opt.desc}</span>
                        </div>
                    ))}
                </div>
            );
        }

        if (step.layout === 'col1') {
            return (
                <div style={S.optionsCol1}>
                    {step.options.map(opt => (
                        <div
                            key={opt.value}
                            style={S.cardWide(selections[step.key] === opt.value)}
                            onClick={() => handleSelect(opt.value)}
                        >
                            <div style={{ flexShrink: 0 }}>{opt.icon}</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, textAlign: 'left' }}>
                                <span style={S.cardLabel}>{opt.label}</span>
                                {opt.desc && <span style={S.cardDesc}>{opt.desc}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        if (step.layout === 'inputs') {
            return (
                <div style={S.inputsRow}>
                    {step.fields.map(field => (
                        <div key={field.key} style={S.inputGroup}>
                            <span style={S.inputLabel}>{field.label}</span>
                            <div style={S.inputWrap(focusedField === field.key)}>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    placeholder={field.placeholder}
                                    min={field.min}
                                    max={field.max}
                                    value={selections[field.key] || ''}
                                    onChange={e => handleInputChange(field.key, e.target.value)}
                                    onFocus={() => setFocusedField(field.key)}
                                    onBlur={() => setFocusedField(null)}
                                    style={S.inputField}
                                />
                                <span style={S.inputUnit}>{field.unit}</span>
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        // grid2
        return (
            <div style={S.optionsGrid2}>
                {step.options.map(opt => (
                    <div
                        key={opt.value}
                        style={S.card(selections[step.key] === opt.value)}
                        onClick={() => handleSelect(opt.value)}
                    >
                        {opt.icon}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                            <span style={S.cardLabel}>{opt.label}</span>
                            <span style={S.cardDesc}>{opt.desc}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderAccountForm = () => (
        <div>
            {accountError && (
                <div style={S.errorMsg}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {accountError}
                </div>
            )}

            <div style={S.accountField}>
                <label style={S.accountLabel}>Nome completo</label>
                <input
                    type="text"
                    placeholder="Seu nome"
                    autoComplete="name"
                    value={accountData.nome}
                    onChange={e => setAccountData(p => ({ ...p, nome: e.target.value }))}
                    onFocus={() => setFocusedField('nome')}
                    onBlur={() => setFocusedField(null)}
                    style={S.accountInput(focusedField === 'nome')}
                />
            </div>

            <div style={S.accountField}>
                <label style={S.accountLabel}>Email</label>
                <input
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    value={accountData.email}
                    onChange={e => setAccountData(p => ({ ...p, email: e.target.value }))}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    style={S.accountInput(focusedField === 'email')}
                />
            </div>

            <div style={S.accountField}>
                <label style={S.accountLabel}>Senha</label>
                <div style={S.accountInputWrap(focusedField === 'senha')}>
                    <input
                        type={senhaVis ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        minLength={6}
                        value={accountData.senha}
                        onChange={e => setAccountData(p => ({ ...p, senha: e.target.value }))}
                        onFocus={() => setFocusedField('senha')}
                        onBlur={() => setFocusedField(null)}
                        style={S.accountInputInner}
                    />
                    <button
                        type="button"
                        style={S.eyeBtn}
                        onClick={() => setSenhaVis(v => !v)}
                        aria-label="Mostrar senha"
                    >
                        {senhaVis
                            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                    </button>
                </div>
            </div>
        </div>
    );

    const canContinue = isStepComplete();
    const isSkippable = !isAccountStep && step?.layout !== 'grid2';

    return (
        <div style={S.page}>
            {/* ── Top bar ── */}
            <div style={S.topBar}>
                <div style={S.progressOuter}>
                    <div style={S.progressInner(progress)} />
                </div>
                <span style={S.stepLabel}>{currentStep + 1} de {totalSteps}</span>
            </div>

            {/* ── Step content ── */}
            <div
                key={animKey}
                style={{
                    ...S.content,
                    animation: 'slideIn 0.35s cubic-bezier(0.4,0,0.2,1) both',
                }}
            >
                <h1 style={S.stepTitle}>
                    {isAccountStep ? 'Criar sua conta' : step.title}
                </h1>
                <p style={S.stepSubtitle}>
                    {isAccountStep ? 'Quase lá — defina seu acesso' : step.subtitle}
                </p>

                {isAccountStep ? renderAccountForm() : renderOptions()}
            </div>

            {/* ── Footer ── */}
            <div style={S.footer}>
                <button
                    style={S.btnContinuar(!canContinue || finishing)}
                    disabled={!canContinue || finishing}
                    onClick={advance}
                >
                    {finishing ? 'CRIANDO...' : isAccountStep ? 'CRIAR CONTA' : 'CONTINUAR'}
                </button>

                {isSkippable && (
                    <button style={S.btnSkip} onClick={skip}>
                        Pular esta etapa
                    </button>
                )}

                {isAccountStep && (
                    <span style={S.loginLink}>
                        Já tem uma conta?{' '}
                        <span
                            style={{ color: '#4A90D9', cursor: 'pointer' }}
                            onClick={() => navigate('/')}
                        >
                            Entrar
                        </span>
                    </span>
                )}
            </div>
        </div>
    );
}

export default Onboarding;
