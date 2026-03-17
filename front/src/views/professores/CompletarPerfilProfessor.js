import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import ModalSucesso from '../components/ModalSucesso';
import '../../styles/Auth.css';

const API = process.env.REACT_APP_API_BASE_URL;

function CompletarPerfilProfessor() {
    const navigate = useNavigate();
    const { userId, updateUser, trocarFuncao } = useContext(AuthContext);

    const [cref,          setCref]          = useState('');
    const [especialidade, setEspecialidade] = useState('');
    const [experiencia,   setExperiencia]   = useState('');
    const [descricao,     setDescricao]     = useState('');
    const [precoHora,     setPrecoHora]     = useState('');
    const [contato,       setContato]       = useState('');
    const [estado,        setEstado]        = useState('');
    const [cidade,        setCidade]        = useState('');

    const [estadosIBGE, setEstadosIBGE] = useState([]);
    const [cidadesIBGE, setCidadesIBGE] = useState([]);

    const [loading,   setLoading]   = useState(false);
    const [erro,      setErro]      = useState(null);
    const [showModal, setShowModal] = useState(false);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErro(null);

        try {
            // 1. Cria o perfil de professor
            const profRes = await fetch(`${API}/professores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id:  userId,
                    cref,
                    especialidade,
                    experiencia,
                    descricao,
                    preco_hora: precoHora,
                    cidade,
                    estado,
                    contato,
                }),
            });

            if (!profRes.ok) {
                const data = await profRes.json();
                setErro(data.error || 'Erro ao criar perfil.');
                return;
            }

            // 2. Ativa funcao_extra = 'Professor'
            await fetch(`${API}/usuarios/${userId}/funcao-extra`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ funcao_extra: 'Professor' }),
            });

            updateUser({ funcao_extra: 'Professor' });
            trocarFuncao(); // alterna funcaoAtiva para 'Professor'

            setShowModal(true);
            setTimeout(() => {
                setShowModal(false);
                navigate(`/professores/edit/${userId}`);
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

                <div className="auth-header">
                    <h1 className="auth-title">Perfil de Professor</h1>
                    <p className="auth-subtitle">Preencha seus dados profissionais para ativar o modo personal trainer</p>
                </div>

                <div className="auth-body">
                    {erro && (
                        <div className="auth-msg error">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {erro}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <p className="auth-section-label">Dados profissionais</p>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="cref">CREF</label>
                                <input
                                    id="cref"
                                    type="text"
                                    className="auth-input"
                                    value={cref}
                                    onChange={e => setCref(e.target.value)}
                                    placeholder="000000-G/UF"
                                />
                            </div>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="experiencia">Experiência (anos)</label>
                                <input
                                    id="experiencia"
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
                            <label className="auth-label" htmlFor="especialidade">Especialidade</label>
                            <input
                                id="especialidade"
                                type="text"
                                className="auth-input"
                                value={especialidade}
                                onChange={e => setEspecialidade(e.target.value)}
                                placeholder="Ex: Musculação, Funcional..."
                            />
                        </div>

                        <div className="auth-field">
                            <label className="auth-label" htmlFor="descricao">Descrição</label>
                            <input
                                id="descricao"
                                type="text"
                                className="auth-input"
                                value={descricao}
                                onChange={e => setDescricao(e.target.value)}
                                placeholder="Breve descrição sobre você"
                            />
                        </div>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="preco">Preço/hora (R$)</label>
                                <input
                                    id="preco"
                                    type="number"
                                    className="auth-input"
                                    value={precoHora}
                                    onChange={e => setPrecoHora(e.target.value)}
                                    placeholder="80"
                                    min="0"
                                />
                            </div>
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="contato">Contato</label>
                                <input
                                    id="contato"
                                    type="text"
                                    className="auth-input"
                                    value={contato}
                                    onChange={e => setContato(e.target.value)}
                                    placeholder="@instagram ou WhatsApp"
                                />
                            </div>
                        </div>

                        <p className="auth-section-label">Localização</p>

                        <div className="auth-row">
                            <div className="auth-field">
                                <label className="auth-label" htmlFor="estado">Estado</label>
                                <div className="auth-select-wrap">
                                    <select
                                        id="estado"
                                        className="auth-select"
                                        value={estado}
                                        onChange={e => { setEstado(e.target.value); setCidade(''); carregarCidades(e.target.value); }}
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
                                <label className="auth-label" htmlFor="cidade">Cidade</label>
                                <div className="auth-select-wrap">
                                    <select
                                        id="cidade"
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
                            {loading ? 'Salvando...' : 'Ativar perfil de professor'}
                        </button>

                        <button
                            type="button"
                            className="auth-btn"
                            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(200,209,208,0.5)', marginTop: 8 }}
                            onClick={() => navigate(-1)}
                        >
                            Cancelar
                        </button>

                    </form>
                </div>

            </div>

            <ModalSucesso show={showModal} mensagem="Perfil de professor ativado!" />
        </div>
    );
}

export default CompletarPerfilProfessor;
