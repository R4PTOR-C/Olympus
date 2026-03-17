import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import CropAvatar from '../components/CropAvatar';
import ModalEdicaoCampo from '../components/ModalEdicaoCampo';
import ModalApagarConta from '../components/ModalApagarConta';
import PageStateHandler from '../components/PageStateHandler';
import '../../styles/UsuariosEdit.css';
import '../../styles/ModalApagarConta.css';

const API = process.env.REACT_APP_API_BASE_URL;

const dadosPessoais = [
    { name: 'nome',            label: 'Nome',               tipo: 'text'   },
    { name: 'email',           label: 'Email',              tipo: 'email'  },
    { name: 'genero',          label: 'Gênero',             tipo: 'select', options: ['Masculino', 'Feminino', 'Outro'] },
    { name: 'data_nascimento', label: 'Data de nascimento', tipo: 'date'   },
    { name: 'telefone',        label: 'Telefone',           tipo: 'tel'    },
];

const dadosProfissionais = [
    { name: 'cref',          label: 'CREF',                tipo: 'text'   },
    { name: 'especialidade', label: 'Especialidade',       tipo: 'text'   },
    { name: 'experiencia',   label: 'Experiência (anos)',  tipo: 'number' },
    { name: 'descricao',     label: 'Descrição',           tipo: 'text'   },
    { name: 'preco_hora',    label: 'Preço/hora (R$)',     tipo: 'number' },
    { name: 'contato',       label: 'Contato',             tipo: 'text'   },
];

// ── Modal de Localização (UF → Cidade cascata) ──
function ModalLocalizacao({ estadoAtual, cidadeAtual, onClose, onSave }) {
    const [estados,  setEstados]  = useState([]);
    const [cidades,  setCidades]  = useState([]);
    const [uf,       setUf]       = useState(estadoAtual || '');
    const [cidade,   setCidade]   = useState(cidadeAtual || '');
    const [loadingC, setLoadingC] = useState(false);

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(r => r.json()).then(setEstados).catch(() => {});
    }, []);

    useEffect(() => {
        if (!uf) { setCidades([]); setCidade(''); return; }
        setLoadingC(true);
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
            .then(r => r.json())
            .then(data => { setCidades(data); setLoadingC(false); })
            .catch(() => setLoadingC(false));
    }, [uf]);

    const handleUfChange = (e) => { setUf(e.target.value); setCidade(''); };

    const selectStyle = {
        width: '100%', background: 'var(--h-surface-2)',
        border: '1.5px solid var(--h-border)', borderRadius: 'var(--h-radius-md)',
        padding: '13px 16px', fontFamily: "'Barlow', sans-serif",
        fontSize: '1rem', color: 'var(--h-text)', outline: 'none',
        appearance: 'none', WebkitAppearance: 'none',
    };

    return (
        <div className="mec-overlay" onClick={onClose}>
            <div className="mec-sheet" onClick={e => e.stopPropagation()}>
                <div className="mec-header">
                    <div className="mec-header-info">
                        <div className="mec-label">Editando</div>
                        <div className="mec-title">Localização</div>
                    </div>
                    <button className="mec-close-btn" onClick={onClose} aria-label="Fechar">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <div className="mec-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--h-text-dim)', marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Estado</p>
                        <div style={{ position: 'relative' }}>
                            <select style={selectStyle} value={uf} onChange={handleUfChange}>
                                <option value="">Selecione o estado</option>
                                {estados.map(e => <option key={e.id} value={e.sigla}>{e.sigla} — {e.nome}</option>)}
                            </select>
                            <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-dim)" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                        </div>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.72rem', color: 'var(--h-text-dim)', marginBottom: 6, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Cidade</p>
                        <div style={{ position: 'relative' }}>
                            <select style={{ ...selectStyle, opacity: !uf ? 0.5 : 1 }} value={cidade} onChange={e => setCidade(e.target.value)} disabled={!uf || loadingC}>
                                <option value="">{loadingC ? 'Carregando...' : uf ? 'Selecione a cidade' : 'Escolha o estado primeiro'}</option>
                                {cidades.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>
                            <svg style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--h-text-dim)" strokeWidth="2.5" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
                        </div>
                    </div>
                </div>
                <div className="mec-footer">
                    <button className="mec-btn-cancel" onClick={onClose}>Cancelar</button>
                    <button className="mec-btn-save" onClick={() => onSave(uf, cidade)} disabled={!uf || !cidade}>Salvar</button>
                </div>
            </div>
        </div>
    );
}

const formatarData = (str) => {
    if (!str) return null;
    return new Date(str).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatarTelefone = (n) => {
    if (!n) return null;
    const d = n.replace(/\D/g, '');
    if (d.length === 10) return d.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    if (d.length === 11) return d.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    return n;
};

const formatarValor = (campo, dados) => {
    const raw = dados[campo.name];
    if (!raw && raw !== 0) return null;
    if (campo.name === 'data_nascimento') return formatarData(raw);
    if (campo.name === 'telefone')        return formatarTelefone(String(raw));
    if (campo.name === 'experiencia')     return `${raw} anos`;
    if (campo.name === 'preco_hora')      return `R$ ${raw}/h`;
    return raw;
};

const CAMPOS_PROFESSOR = new Set(['cref','especialidade','experiencia','descricao','preco_hora','contato','estado','cidade']);

const ProfessoresEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateUser, trocarFuncao, resetFuncaoAtiva } = useContext(AuthContext);
    const [funcaoExtraLoading, setFuncaoExtraLoading] = useState(false);
    const [showApagarConta,   setShowApagarConta]   = useState(false);

    const [usuario,       setUsuario]       = useState(null);
    const [professor,     setProfessor]     = useState(null);
    const [avatar,        setAvatar]        = useState(null);
    const [selectedFile,  setSelectedFile]  = useState(null);
    const [showCropper,   setShowCropper]   = useState(false);
    const [loading,       setLoading]       = useState(true);
    const [error,         setError]         = useState(null);
    const [campoEditando,     setCampoEditando]     = useState(null);
    const [modalLocalizacao,  setModalLocalizacao]  = useState(false);

    useEffect(() => {
        Promise.all([
            fetch(`${API}/usuarios/${id}`).then(r => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json(); }),
            fetch(`${API}/professores/${id}`).then(r => r.json()).catch(() => ({})),
        ])
            .then(([u, p]) => {
                setUsuario(u);
                // Se retornou erro (ex: professor sem row ainda), usa objeto vazio
                setProfessor(p?.error ? {} : p);
                setLoading(false);
            })
            .catch(err => { setError(err.toString()); setLoading(false); });
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { alert('A imagem deve ter no máximo 5MB.'); return; }
        setSelectedFile(file);
        setShowCropper(true);
    };

    const handleCropped = async (croppedBlob) => {
        const file = new File([croppedBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        setAvatar(file);
        setShowCropper(false);
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            const res  = await fetch(`${API}/usuarios/${id}`, { method: 'PUT', body: formData });
            if (!res.ok) throw new Error('Erro ao atualizar avatar');
            const data = await res.json();
            setUsuario(prev => ({ ...prev, avatar: data.usuario.avatar }));
            updateUser?.({ userName: data.usuario.nome, avatar: data.usuario.avatar });
        } catch (err) { setError(err.toString()); }
    };

    const handleSalvarCampo = async (campo, valor) => {
        try {
            if (CAMPOS_PROFESSOR.has(campo)) {
                // Dados de professor → JSON PUT (só envia o campo alterado)
                setProfessor(prev => ({ ...prev, [campo]: valor }));
                const res = await fetch(`${API}/professores/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [campo]: valor }),
                });
                if (!res.ok) throw new Error('Erro ao atualizar perfil');
            } else {
                // Dados de usuário → FormData PUT
                setUsuario(prev => ({ ...prev, [campo]: valor }));
                const formData = new FormData();
                formData.append(campo, valor);
                const res = await fetch(`${API}/usuarios/${id}`, { method: 'PUT', body: formData });
                if (!res.ok) throw new Error('Erro ao atualizar usuário');
                const data = await res.json();
                updateUser?.({ userName: data.usuario.nome, avatar: data.usuario.avatar });
            }
        } catch (err) { setError(err.toString()); }
        finally { setCampoEditando(null); }
    };

    const handleSalvarLocalizacao = async (uf, cidade) => {
        setModalLocalizacao(false);
        setProfessor(prev => ({ ...prev, estado: uf, cidade }));
        try {
            const res = await fetch(`${API}/professores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: uf, cidade }),
            });
            if (!res.ok) throw new Error('Erro ao salvar localização');
        } catch (err) { setError(err.toString()); }
    };

    if (loading) return (
        <PageStateHandler>
            <div className="ue-page">
                {/* Header skeleton */}
                <div className="ue-header">
                    <div className="ue-skel-circle" />
                    <div className="ue-skel-line" style={{ width: 160, height: 28, marginBottom: 14 }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <div className="ue-skel-chip" style={{ width: 90 }} />
                        <div className="ue-skel-chip" style={{ width: 110 }} />
                    </div>
                </div>
                {/* Body skeleton */}
                <div className="ue-body">
                    {[
                        { title: 'Dados Pessoais',      rows: dadosPessoais.length },
                        { title: 'Dados Profissionais', rows: dadosProfissionais.length },
                        { title: 'Localização',         rows: 1 },
                    ].map((sec, si) => (
                        <div key={si} className="ue-section">
                            <div className="ue-skel-section-header" />
                            {[...Array(sec.rows)].map((_, ri) => (
                                <div key={ri} className="ue-skel-field">
                                    <div className="ue-skel-line dark" style={{ width: '35%', height: 9, animationDelay: `${(si * sec.rows + ri) * 0.05}s` }} />
                                    <div className="ue-skel-line dark" style={{ width: `${55 + (ri % 3) * 10}%`, height: 14, animationDelay: `${(si * sec.rows + ri) * 0.05 + 0.1}s` }} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </PageStateHandler>
    );

    if (error)   return <div style={{ color: 'red', padding: '2rem' }}>Erro: {error}</div>;
    if (!usuario || !professor) return null;

    const handleToggleFuncaoExtra = async () => {
        const isAlunoPrimario = usuario.funcao === 'Aluno';

        setFuncaoExtraLoading(true);
        try {
            await fetch(`${API}/usuarios/${id}/funcao-extra`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funcao_extra: null }),
            });
            setUsuario(prev => ({ ...prev, funcao_extra: null }));
            updateUser({ funcao_extra: null });
            resetFuncaoAtiva();

            if (isAlunoPrimario) {
                // Aluno removendo o extra de professor → volta pro perfil de aluno
                navigate(`/usuarios/edit/${id}`);
            }
            // Se era professor primário removendo aluno extra → fica na mesma tela
        } catch { /* silencioso */ }
        finally { setFuncaoExtraLoading(false); }
    };

    const handleAtivarAluno = async () => {
        setFuncaoExtraLoading(true);
        try {
            await fetch(`${API}/usuarios/${id}/funcao-extra`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funcao_extra: 'Aluno' }),
            });
            setUsuario(prev => ({ ...prev, funcao_extra: 'Aluno' }));
            updateUser({ funcao_extra: 'Aluno' });
            trocarFuncao();
            navigate(`/usuarios/edit/${id}`);
        } catch { /* silencioso */ }
        finally { setFuncaoExtraLoading(false); }
    };

    const dados = { ...usuario, ...professor };
    const avatarUrl = avatar ? URL.createObjectURL(avatar) : usuario.avatar || null;

    const renderSection = (titulo, icone, campos) => (
        <div className="ue-section">
            <div className="ue-section-title">
                {icone}
                {titulo}
            </div>
            {campos.map(campo => {
                const val = formatarValor(campo, dados);
                return (
                    <div key={campo.name} className="ue-field" onClick={() => setCampoEditando(campo)}>
                        <div className="ue-field-info">
                            <div className="ue-field-label">{campo.label}</div>
                            <div className={`ue-field-value${val ? '' : ' empty'}`}>
                                {val || 'Não informado'}
                            </div>
                        </div>
                        <svg className="ue-field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </div>
                );
            })}
        </div>
    );

    return (
        <PageStateHandler>
            <div className="ue-page">

                {/* ── HEADER ── */}
                <div className="ue-header">
                    <div className="ue-avatar-wrap">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt="Avatar" className="ue-avatar" />
                        ) : (
                            <div className="ue-avatar-placeholder">
                                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                        )}
                        <button
                            className="ue-avatar-edit-btn"
                            onClick={() => document.getElementById('pe-avatar-input').click()}
                            aria-label="Alterar foto"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <input
                            id="pe-avatar-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <h1 className="ue-name">{usuario.nome}</h1>

                    {(professor.especialidade || professor.cidade) && (
                        <div className="ue-stats-row">
                            {professor.especialidade && (
                                <div className="ue-stat-chip">
                                    <span className="ue-stat-val">{professor.especialidade}</span>
                                </div>
                            )}
                            {professor.cidade && (
                                <div className="ue-stat-chip">
                                    <span className="ue-stat-val">{professor.cidade}</span>
                                    <span className="ue-stat-lbl">{professor.estado}</span>
                                </div>
                            )}
                            {professor.preco_hora && (
                                <div className="ue-stat-chip">
                                    <span className="ue-stat-val">R$ {professor.preco_hora}/h</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── SECTIONS ── */}
                <div className="ue-body">
                    {renderSection('Dados Pessoais', (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    ), dadosPessoais)}

                    {renderSection('Dados Profissionais', (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                        </svg>
                    ), dadosProfissionais)}

                    {/* ── Conta de Aluno ── */}
                    <div className="ue-section">
                        <div className="ue-section-title">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                            Perfil de Aluno
                        </div>
                        <div className="ue-field" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--ue-text-muted)', margin: 0, lineHeight: 1.5 }}>
                                {usuario.funcao === 'Aluno'
                                    ? 'Seu perfil principal é de aluno. Você está navegando como personal trainer.'
                                    : usuario.funcao_extra === 'Aluno'
                                        ? 'Você também tem um perfil de aluno. Pode alternar entre os modos no login ou pelo menu.'
                                        : 'Quer usar o app também como aluno? Ative um perfil de aluno para sua conta.'}
                            </p>
                            <button
                                className={`ue-btn-funcao-extra${(usuario.funcao === 'Aluno' || usuario.funcao_extra === 'Aluno') ? ' ativo' : ''}`}
                                onClick={(usuario.funcao === 'Aluno' || usuario.funcao_extra === 'Aluno') ? handleToggleFuncaoExtra : handleAtivarAluno}
                                disabled={funcaoExtraLoading}
                            >
                                {usuario.funcao === 'Aluno'
                                    ? 'Remover perfil de professor'
                                    : usuario.funcao_extra === 'Aluno'
                                        ? 'Remover perfil de aluno'
                                        : 'Ativar perfil de aluno'}
                            </button>
                        </div>
                    </div>

                    {/* ── Localização ── */}
                    <div className="ue-section">
                        <div className="ue-section-title">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                            Localização
                        </div>
                        <div className="ue-field" onClick={() => setModalLocalizacao(true)}>
                            <div className="ue-field-info">
                                <div className="ue-field-label">Estado / Cidade</div>
                                <div className={`ue-field-value${professor.estado ? '' : ' empty'}`}>
                                    {professor.estado && professor.cidade
                                        ? `${professor.estado} — ${professor.cidade}`
                                        : professor.estado || professor.cidade || 'Não informado'}
                                </div>
                            </div>
                            <svg className="ue-field-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 18l6-6-6-6"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {showCropper && selectedFile && (
                    <CropAvatar
                        file={selectedFile}
                        onCropped={handleCropped}
                        onClose={() => setShowCropper(false)}
                    />
                )}

                {campoEditando && (
                    <ModalEdicaoCampo
                        campo={campoEditando}
                        valorAtual={dados[campoEditando.name]}
                        onClose={() => setCampoEditando(null)}
                        onSave={handleSalvarCampo}
                    />
                )}

                {modalLocalizacao && (
                    <ModalLocalizacao
                        estadoAtual={professor.estado}
                        cidadeAtual={professor.cidade}
                        onClose={() => setModalLocalizacao(false)}
                        onSave={handleSalvarLocalizacao}
                    />
                )}

                {/* ── Apagar conta ── */}
                <div style={{ padding: '0 16px 32px' }}>
                    <button
                        onClick={() => setShowApagarConta(true)}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(224,92,92,0.2)', background: 'transparent', color: 'rgba(224,92,92,0.6)', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                        Apagar conta
                    </button>
                </div>

            </div>

            {showApagarConta && (
                <ModalApagarConta
                    emailCorreto={usuario.email}
                    usuarioId={id}
                    onClose={() => setShowApagarConta(false)}
                />
            )}
        </PageStateHandler>
    );
};

export default ProfessoresEdit;
