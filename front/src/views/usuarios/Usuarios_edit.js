import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import CropAvatar from '../components/CropAvatar';
import ModalCarregando from '../components/ModalCarregando';
import ModalEdicaoCampo from '../components/ModalEdicaoCampo';
import ModalApagarConta from '../components/ModalApagarConta';
import ModalConfirmar from '../components/ModalConfirmar';
import PageStateHandler from '../components/PageStateHandler';
import '../../styles/UsuariosEdit.css';
import '../../styles/ModalApagarConta.css';
import '../../styles/ModalConfirmar.css';

const dadosPessoais = [
    { name: 'nome',             label: 'Nome',               tipo: 'text'   },
    { name: 'email',            label: 'Email',              tipo: 'email'  },
    { name: 'genero',           label: 'Gênero',             tipo: 'select', options: ['Masculino', 'Feminino', 'Outro'] },
    { name: 'data_nascimento',  label: 'Data de nascimento', tipo: 'date'   },
    { name: 'telefone',         label: 'Telefone',           tipo: 'tel'    },
];

const infoCorporal = [
    { name: 'altura',   label: 'Altura',   tipo: 'number' },
    { name: 'peso',     label: 'Peso',     tipo: 'number' },
    { name: 'objetivo', label: 'Objetivo', tipo: 'select', options: ['Emagrecimento', 'Hipertrofia', 'Condicionamento físico'] },
];

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

const formatarValor = (campo, usuario) => {
    const raw = usuario[campo.name];
    if (!raw) return null;
    if (campo.name === 'data_nascimento') return formatarData(raw);
    if (campo.name === 'telefone') return formatarTelefone(raw);
    if (campo.name === 'altura') return `${raw} cm`;
    if (campo.name === 'peso') return `${raw} kg`;
    return raw;
};

const UsuariosEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateUser, trocarFuncao, resetFuncaoAtiva } = useContext(AuthContext);

    const [usuario,       setUsuario]       = useState(null);
    const [avatar,        setAvatar]        = useState(null);
    const [selectedFile,  setSelectedFile]  = useState(null);
    const [showCropper,   setShowCropper]   = useState(false);
    const [loading,           setLoading]           = useState(true);
    const [error,             setError]             = useState(null);
    const [campoEditando,     setCampoEditando]     = useState(null);
    const [funcaoExtraLoading,   setFuncaoExtraLoading]   = useState(false);
    const [showApagarConta,      setShowApagarConta]      = useState(false);
    const [showConfirmarRemover, setShowConfirmarRemover] = useState(false);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`)
            .then(r => { if (!r.ok) throw new Error(`Erro ${r.status}`); return r.json(); })
            .then(data => { setUsuario({ ...data, funcao_extra: data.funcao_extra || null }); setLoading(false); })
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
            const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, { method: 'PUT', body: formData });
            if (!res.ok) throw new Error('Erro ao atualizar avatar');
            const data = await res.json();
            setUsuario(prev => ({ ...prev, avatar: data.usuario.avatar }));
            updateUser?.({ userName: data.usuario.nome, avatar: data.usuario.avatar });
        } catch (err) { setError(err.toString()); }
    };

    const handleSalvarCampo = async (campo, valor) => {
        try {
            setUsuario(prev => ({ ...prev, [campo]: valor }));
            const formData = new FormData();
            formData.append(campo, valor);
            const res  = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, { method: 'PUT', body: formData });
            if (!res.ok) throw new Error('Erro ao atualizar usuário');
            const data = await res.json();
            updateUser?.({ userName: data.usuario.nome, avatar: data.usuario.avatar });
        } catch (err) { setError(err.toString()); }
        finally { setCampoEditando(null); }
    };

    const executarRemocaoFuncaoExtra = async () => {
        const isProfessorPrimario = usuario.funcao === 'Professor';

        setFuncaoExtraLoading(true);
        try {
            await Promise.all([
                fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}/funcao-extra`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ funcao_extra: null }),
                }),
                fetch(`${process.env.REACT_APP_API_BASE_URL}/professores/${id}`, { method: 'DELETE' }),
            ]);
            setUsuario(prev => ({ ...prev, funcao_extra: null }));
            updateUser?.({ funcao_extra: null });
            resetFuncaoAtiva();

            if (isProfessorPrimario) {
                navigate(`/professores/edit/${id}`);
            }
        } catch { /* silencioso */ }
        finally { setFuncaoExtraLoading(false); }
    };

    const handleToggleFuncaoExtra = async () => {
        const isProfessorPrimario = usuario.funcao === 'Professor';
        const temProfessorExtra   = usuario.funcao_extra === 'Professor';

        if (!isProfessorPrimario && !temProfessorExtra) {
            navigate('/completar-perfil-professor');
            return;
        }

        setShowConfirmarRemover(true);
    };

    if (loading) return <ModalCarregando show={true} />;
    if (error)   return <div style={{ color: 'red', padding: '2rem' }}>Erro: {error}</div>;
    if (!usuario) return null;

    const avatarUrl = avatar ? URL.createObjectURL(avatar) : usuario.avatar || null;

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
                            onClick={() => document.getElementById('ue-avatar-input').click()}
                            aria-label="Alterar foto"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <input
                            id="ue-avatar-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <h1 className="ue-name">{usuario.nome}</h1>

                    {(usuario.peso || usuario.altura || usuario.objetivo) && (
                        <div className="ue-stats-row">
                            {usuario.peso && (
                                <div className="ue-stat-chip">
                                    <span className="ue-stat-val">{usuario.peso} kg</span>
                                    <span className="ue-stat-lbl">Peso</span>
                                </div>
                            )}
                            {usuario.altura && (
                                <div className="ue-stat-chip">
                                    <span className="ue-stat-val">{usuario.altura} cm</span>
                                    <span className="ue-stat-lbl">Altura</span>
                                </div>
                            )}
                            {usuario.objetivo && (
                                <div className="ue-stat-chip">
                                    <span className="ue-stat-val">{usuario.objetivo}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── SECTIONS ── */}
                <div className="ue-body">

                    {/* Dados pessoais */}
                    <div className="ue-section">
                        <div className="ue-section-title">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Dados Pessoais
                        </div>
                        {dadosPessoais.map(campo => {
                            const val = formatarValor(campo, usuario);
                            return (
                                <div
                                    key={campo.name}
                                    className="ue-field"
                                    onClick={() => setCampoEditando(campo)}
                                >
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

                    {/* Informações corporais */}
                    <div className="ue-section">
                        <div className="ue-section-title">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                            </svg>
                            Informações Corporais
                        </div>
                        {infoCorporal.map(campo => {
                            const val = formatarValor(campo, usuario);
                            return (
                                <div
                                    key={campo.name}
                                    className="ue-field"
                                    onClick={() => setCampoEditando(campo)}
                                >
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

                    {/* ── Perfil de Professor ── */}
                    <div className="ue-section">
                        <div className="ue-section-title">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            Perfil de Personal Trainer
                        </div>
                        <div className="ue-field" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--ue-text-muted)', margin: 0, lineHeight: 1.5 }}>
                                {usuario.funcao === 'Professor'
                                    ? 'Seu perfil principal é de personal trainer. Você está navegando como aluno.'
                                    : usuario.funcao_extra === 'Professor'
                                        ? 'Você também tem um perfil de personal trainer. Pode alternar entre os modos no login ou pelo menu.'
                                        : 'É personal trainer? Ative um perfil de professor para gerenciar seus alunos.'}
                            </p>
                            <button
                                className={`ue-btn-funcao-extra${(usuario.funcao === 'Professor' || usuario.funcao_extra === 'Professor') ? ' ativo' : ''}`}
                                onClick={handleToggleFuncaoExtra}
                                disabled={funcaoExtraLoading}
                            >
                                {usuario.funcao === 'Professor'
                                    ? 'Remover perfil de aluno'
                                    : usuario.funcao_extra === 'Professor'
                                        ? 'Remover perfil de professor'
                                        : 'Ativar perfil de professor'}
                            </button>
                        </div>
                    </div>

                </div>

                {/* ── Apagar conta ── */}
                <div style={{ padding: '0 16px 32px' }}>
                    <button
                        onClick={() => setShowApagarConta(true)}
                        style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid rgba(224,92,92,0.2)', background: 'transparent', color: 'rgba(224,92,92,0.6)', fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                        Apagar conta
                    </button>
                </div>

                {/* Cropper de avatar */}
                {showCropper && selectedFile && (
                    <CropAvatar
                        file={selectedFile}
                        onCropped={handleCropped}
                        onClose={() => setShowCropper(false)}
                    />
                )}

                {/* Modal de edição de campo */}
                {campoEditando && (
                    <ModalEdicaoCampo
                        campo={campoEditando}
                        valorAtual={usuario[campoEditando.name]}
                        onClose={() => setCampoEditando(null)}
                        onSave={handleSalvarCampo}
                    />
                )}

            </div>

            {showConfirmarRemover && (
                <ModalConfirmar
                    titulo="Remover perfil de professor?"
                    mensagem="Seu perfil profissional (CREF, especialidade, bio) será apagado. Seus treinos não serão afetados. Tem certeza?"
                    labelConfirmar="Remover"
                    perigoso
                    onConfirmar={() => { setShowConfirmarRemover(false); executarRemocaoFuncaoExtra(); }}
                    onCancelar={() => setShowConfirmarRemover(false)}
                />
            )}

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

export default UsuariosEdit;
