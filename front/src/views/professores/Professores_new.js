import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CropAvatar from '../components/CropAvatar';
import ModalSucesso from '../components/ModalSucesso';
import CalendarioData, { normalizarData } from '../components/CalendarioData';
import '../../styles/Auth.css';
import '../../styles/ModalEdicaoCampo.css';

const maskCref = (v) => {
    const clean = v.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
    let r = '';
    for (let i = 0; i < clean.length && i < 9; i++) {
        if (i === 6) r += '-';
        if (i === 7) r += '/';
        r += clean[i];
    }
    return r;
};

const formatarDataExibicao = (iso) => {
    if (!iso) return null;
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });
};

function Professor_new() {
    const navigate = useNavigate();

    // Dados de usuário
    const [nome,           setNome]           = useState('');
    const [email,          setEmail]          = useState('');
    const [genero,         setGenero]         = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [senha,          setSenha]          = useState('');
    const [senhaVis,       setSenhaVis]       = useState(false);

    // Dados de professor
    const [cref,         setCref]         = useState('');
    const [especialidade,setEspecialidade] = useState('');
    const [experiencia,  setExperiencia]  = useState('');
    const [descricao,    setDescricao]    = useState('');
    const [precoHora,    setPrecoHora]    = useState('');
    const [contato,      setContato]      = useState('');
    const [estado,       setEstado]       = useState('');
    const [cidade,       setCidade]       = useState('');

    const [avatar,       setAvatar]       = useState(null);
    const [previewUrl,   setPreviewUrl]   = useState(null);
    const [loading,      setLoading]      = useState(false);
    const [erro,         setErro]         = useState(null);
    const [showCropper,  setShowCropper]  = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showModal,    setShowModal]    = useState(false);
    const [calAberto,    setCalAberto]    = useState(false);

    const [estadosIBGE, setEstadosIBGE] = useState([]);
    const [cidadesIBGE, setCidadesIBGE] = useState([]);

    useEffect(() => {
        fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
            .then(r => r.json())
            .then(setEstadosIBGE)
            .catch(() => {});
    }, []);

    const carregarCidades = (uf) => {
        fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
            .then(r => r.json())
            .then(setCidadesIBGE)
            .catch(() => {});
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            setErro('A imagem deve ter no máximo 5MB.');
            return;
        }
        setSelectedFile(file);
        setShowCropper(true);
    };

    const handleCropped = (croppedBlob) => {
        const file = new File([croppedBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        setAvatar(file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowCropper(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(null);

        try {
            // 1️⃣ Cria o usuário
            const formData = new FormData();
            formData.append('nome',            nome);
            formData.append('email',           email);
            formData.append('genero',          genero);
            formData.append('data_nascimento', dataNascimento);
            formData.append('senha',           senha);
            formData.append('funcao',          'Professor');
            if (avatar) formData.append('avatar', avatar);

            const userRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });

            const userText = await userRes.text();
            if (!userRes.ok) {
                try { setErro(JSON.parse(userText).error || 'Erro ao criar conta.'); }
                catch { setErro(userText || 'Erro ao criar conta.'); }
                return;
            }

            const usuario = JSON.parse(userText);

            // 2️⃣ Cria o perfil de professor
            const profRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/professores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id:  usuario.id,
                    cref,
                    especialidade,
                    experiencia,
                    descricao,
                    preco_hora:  precoHora,
                    cidade,
                    estado,
                    contato,
                }),
            });

            if (!profRes.ok) {
                const profText = await profRes.text();
                try { setErro(JSON.parse(profText).error || 'Erro ao criar perfil.'); }
                catch { setErro(profText || 'Erro ao criar perfil.'); }
                return;
            }

            setShowModal(true);
            setTimeout(() => {
                setShowModal(false);
                navigate('/');
            }, 1500);

        } catch {
            setErro('Erro de rede. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page top">
            <div className="auth-card">

                {/* ── HEADER ── */}
                <div className="auth-header">
                    <h1 className="auth-title">Cadastro de Professor</h1>
                    <p className="auth-subtitle">Preencha seus dados profissionais</p>
                </div>

                {/* ── BODY ── */}
                <div className="auth-body">
                    {erro && (
                        <div className="auth-msg error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {erro}
                        </div>
                    )}

                    {/* Avatar picker */}
                    <div className="auth-avatar-wrap">
                        <div className="auth-avatar-inner">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" className="auth-avatar-img" />
                            ) : (
                                <div className="auth-avatar-placeholder">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(74,144,217,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </div>
                            )}
                            <button
                                type="button"
                                className="auth-avatar-edit"
                                onClick={() => document.getElementById('avatar-input-prof').click()}
                                aria-label="Selecionar foto"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                            </button>
                            <input
                                type="file"
                                id="avatar-input-prof"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {showCropper && selectedFile && (
                        <CropAvatar
                            file={selectedFile}
                            onCropped={handleCropped}
                            onClose={() => setShowCropper(false)}
                        />
                    )}

                    <form onSubmit={handleSubmit}>

                        {/* ── Dados de acesso ── */}
                        <p className="auth-section-label">Dados de acesso</p>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="email-prof">Email</label>
                            <input
                                id="email-prof"
                                type="email"
                                className="auth-input"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="seu@email.com"
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="senha-prof">Senha</label>
                            <div className="auth-input-wrap">
                                <input
                                    id="senha-prof"
                                    type={senhaVis ? 'text' : 'password'}
                                    className="auth-input"
                                    value={senha}
                                    onChange={e => setSenha(e.target.value)}
                                    placeholder="Mínimo 6 caracteres"
                                    autoComplete="new-password"
                                    minLength={6}
                                    required
                                />
                                <button type="button" className="auth-eye-btn" onClick={() => setSenhaVis(v => !v)} aria-label="Mostrar senha">
                                    {senhaVis
                                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    }
                                </button>
                            </div>
                        </div>

                        {/* ── Dados pessoais ── */}
                        <p className="auth-section-label">Dados pessoais</p>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="nome-prof">Nome completo</label>
                            <input
                                id="nome-prof"
                                type="text"
                                className="auth-input"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                                placeholder="Seu nome"
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="genero-prof">Gênero</label>
                                <div className="auth-select-wrap">
                                    <select
                                        id="genero-prof"
                                        className="auth-select"
                                        value={genero}
                                        onChange={e => setGenero(e.target.value)}
                                        required
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Feminino">Feminino</option>
                                        <option value="Outro">Outro</option>
                                    </select>
                                </div>
                            </div>

                            <div className="auth-field">
                                <label className="auth-label">Nascimento</label>
                                <button
                                    type="button"
                                    className="auth-input"
                                    style={{ textAlign: 'left', cursor: 'pointer', color: dataNascimento ? 'inherit' : 'rgba(200,209,208,0.2)' }}
                                    onClick={() => setCalAberto(v => !v)}
                                >
                                    {dataNascimento ? formatarDataExibicao(normalizarData(dataNascimento)) : 'Selecionar data'}
                                </button>
                                {calAberto && (
                                    <div style={{ marginTop: 8 }}>
                                        <CalendarioData
                                            value={normalizarData(dataNascimento)}
                                            onChange={v => { setDataNascimento(v); setCalAberto(false); }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Dados profissionais ── */}
                        <p className="auth-section-label">Dados profissionais</p>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="cref-prof">CREF</label>
                                <input
                                    id="cref-prof"
                                    type="text"
                                    className="auth-input"
                                    value={cref}
                                    onChange={e => setCref(maskCref(e.target.value))}
                                    placeholder="000000-G/UF"
                                />
                            </div>

                            <div className="auth-field">
                                <label className="auth-label" htmlFor="experiencia-prof">Experiência (anos)</label>
                                <input
                                    id="experiencia-prof"
                                    type="number"
                                    className="auth-input"
                                    value={experiencia}
                                    onChange={e => setExperiencia(e.target.value)}
                                    placeholder="5"
                                    min="0"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="especialidade-prof">Especialidade</label>
                            <input
                                id="especialidade-prof"
                                type="text"
                                className="auth-input"
                                value={especialidade}
                                onChange={e => setEspecialidade(e.target.value)}
                                placeholder="Ex: Musculação, Funcional..."
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="descricao-prof">Descrição</label>
                            <input
                                id="descricao-prof"
                                type="text"
                                className="auth-input"
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Breve descrição sobre você"
                            />
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="preco-prof">Preço/hora (R$)</label>
                                <input
                                    id="preco-prof"
                                    type="number"
                                    className="auth-input"
                                    value={precoHora}
                                    onChange={e => setPrecoHora(e.target.value)}
                                    placeholder="80"
                                    min="0"
                                />
                            </div>

                            <div className="auth-field">
                                <label className="auth-label" htmlFor="contato-prof">Contato</label>
                                <input
                                    id="contato-prof"
                                    type="text"
                                    className="auth-input"
                                    value={contato}
                                    onChange={e => setContato(e.target.value)}
                                    placeholder="@instagram ou WhatsApp"
                                />
                            </div>
                        </div>

                        {/* ── Localização ── */}
                        <p className="auth-section-label">Localização</p>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="estado-prof">Estado</label>
                                <div className="auth-select-wrap">
                                    <select
                                        id="estado-prof"
                                        className="auth-select"
                                        value={estado}
                                        onChange={e => {
                                            setEstado(e.target.value);
                                            setCidade('');
                                            carregarCidades(e.target.value);
                                        }}
                                        required
                                    >
                                        <option value="">UF</option>
                                        {estadosIBGE.map(uf => (
                                            <option key={uf.id} value={uf.sigla}>{uf.sigla}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="auth-field">
                                <label className="auth-label" htmlFor="cidade-prof">Cidade</label>
                                <div className="auth-select-wrap">
                                    <select
                                        id="cidade-prof"
                                        className="auth-select"
                                        value={cidade}
                                        onChange={e => setCidade(e.target.value)}
                                        disabled={!estado}
                                        required
                                    >
                                        <option value="">{estado ? 'Selecione' : 'Escolha o estado'}</option>
                                        {cidadesIBGE.map(c => (
                                            <option key={c.id} value={c.nome}>{c.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Cadastrando...' : 'Cadastrar Professor'}
                        </button>
                    </form>
                </div>

                {/* ── FOOTER ── */}
                <div className="auth-footer">
                    <div className="auth-divider" />
                    <p className="auth-footer-text">
                        Já tem uma conta?{' '}
                        <Link to="/">Entrar</Link>
                    </p>
                </div>

            </div>

            <ModalSucesso show={showModal} mensagem="Professor cadastrado com sucesso!" />
        </div>
    );
}

export default Professor_new;
