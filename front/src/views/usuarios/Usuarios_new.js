import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import CropAvatar from '../components/CropAvatar';
import ModalSucesso from '../components/ModalSucesso';
import '../../styles/Auth.css';

function Usuarios_new() {
    const navigate = useNavigate();

    const [nome,            setNome]            = useState('');
    const [email,           setEmail]           = useState('');
    const [genero,          setGenero]          = useState('');
    const [dataNascimento,  setDataNascimento]  = useState('');
    const [telefone,        setTelefone]        = useState('');
    const [altura,          setAltura]          = useState('');
    const [peso,            setPeso]            = useState('');
    const [objetivo,        setObjetivo]        = useState('');
    const [senha,           setSenha]           = useState('');
    const [senhaVis,        setSenhaVis]        = useState(false);
    const [avatar,          setAvatar]          = useState(null);
    const [previewUrl,      setPreviewUrl]      = useState(null);
    const [loading,         setLoading]         = useState(false);
    const [erro,            setErro]            = useState(null);
    const [showCropper,     setShowCropper]     = useState(false);
    const [selectedFile,    setSelectedFile]    = useState(null);
    const [showModal,       setShowModal]       = useState(false);

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

        const formData = new FormData();
        formData.append('nome',             nome);
        formData.append('email',            email);
        formData.append('genero',           genero);
        formData.append('data_nascimento',  dataNascimento);
        formData.append('telefone',         telefone);
        formData.append('altura',           altura);
        formData.append('peso',             peso);
        formData.append('objetivo',         objetivo);
        formData.append('senha',            senha);
        formData.append('funcao',           'Aluno');
        if (avatar) formData.append('avatar', avatar);

        try {
            const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });
            const text = await res.text();

            if (res.ok) {
                setShowModal(true);
                setTimeout(() => {
                    setShowModal(false);
                    navigate('/');
                }, 1500);
            } else {
                try {
                    const err = JSON.parse(text);
                    setErro(err.error || 'Falha ao criar conta.');
                } catch {
                    setErro(text || 'Falha ao criar conta.');
                }
            }
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
                    <img src="/logo1.png" alt="Olympus" className="auth-logo" />
                    <h1 className="auth-title">Criar Conta</h1>
                    <p className="auth-subtitle">Preencha seus dados para começar</p>
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
                                onClick={() => document.getElementById('avatar-input-new').click()}
                                aria-label="Selecionar foto"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                            </button>
                            <input
                                type="file"
                                id="avatar-input-new"
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
                            <label className="auth-label" htmlFor="email-new">Email</label>
                            <input
                                id="email-new"
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
                            <label className="auth-label" htmlFor="senha-new">Senha</label>
                            <div className="auth-input-wrap">
                                <input
                                    id="senha-new"
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
                            <label className="auth-label" htmlFor="nome-new">Nome completo</label>
                            <input
                                id="nome-new"
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
                                <label className="auth-label" htmlFor="genero-new">Gênero</label>
                                <div className="auth-select-wrap">
                                    <select
                                        id="genero-new"
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
                                <label className="auth-label" htmlFor="nascimento-new">Nascimento</label>
                                <input
                                    id="nascimento-new"
                                    type="date"
                                    className="auth-input"
                                    value={dataNascimento}
                                    onChange={e => setDataNascimento(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="telefone-new">Telefone</label>
                            <input
                                id="telefone-new"
                                type="tel"
                                className="auth-input"
                                value={telefone}
                                onChange={e => setTelefone(e.target.value)}
                                placeholder="(00) 00000-0000"
                                autoComplete="tel"
                            />
                        </div>

                        {/* ── Informações corporais ── */}
                        <p className="auth-section-label">Informações corporais</p>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="altura-new">Altura (cm)</label>
                                <input
                                    id="altura-new"
                                    type="number"
                                    className="auth-input"
                                    value={altura}
                                    onChange={e => setAltura(e.target.value)}
                                    placeholder="175"
                                    min="100"
                                    max="250"
                                />
                            </div>

                            <div className="auth-field">
                                <label className="auth-label" htmlFor="peso-new">Peso (kg)</label>
                                <input
                                    id="peso-new"
                                    type="number"
                                    className="auth-input"
                                    value={peso}
                                    onChange={e => setPeso(e.target.value)}
                                    placeholder="70"
                                    min="30"
                                    max="300"
                                />
                            </div>
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="objetivo-new">Objetivo</label>
                            <div className="auth-select-wrap">
                                <select
                                    id="objetivo-new"
                                    className="auth-select"
                                    value={objetivo}
                                    onChange={e => setObjetivo(e.target.value)}
                                    required
                                >
                                    <option value="">Selecione seu objetivo</option>
                                    <option value="Emagrecimento">Emagrecimento</option>
                                    <option value="Hipertrofia">Hipertrofia</option>
                                    <option value="Condicionamento físico">Condicionamento físico</option>
                                </select>
                            </div>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Criando conta...' : 'Criar Conta'}
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

            <ModalSucesso show={showModal} mensagem="Conta criada com sucesso!" />
        </div>
    );
}

export default Usuarios_new;
