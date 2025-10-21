import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CropAvatar from "../components/CropAvatar";
import ModalSucesso from "../components/ModalSucesso";

function Professor_new() {
    const navigate = useNavigate();

    // Dados de usuário
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [senha, setSenha] = useState('');

    // Dados de professor
    const [cref, setCref] = useState('');
    const [especialidade, setEspecialidade] = useState('');
    const [experiencia, setExperiencia] = useState('');
    const [descricao, setDescricao] = useState('');
    const [precoHora, setPrecoHora] = useState('');
    const [cidade, setCidade] = useState('');
    const [estado, setEstado] = useState('');
    const [contato, setContato] = useState('');

    const [avatar, setAvatar] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const funcao = 'Professor';


    // ---------------------- //
// 👇 Adicione no topo do componente (junto dos outros useState)
    const [estadosIBGE, setEstadosIBGE] = useState([]);
    const [cidadesIBGE, setCidadesIBGE] = useState([]);

// 👇 useEffect para buscar os estados ao carregar a página
    useEffect(() => {
        const fetchEstados = async () => {
            try {
                const res = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
                const data = await res.json();
                setEstadosIBGE(data);
            } catch (error) {
                console.error("Erro ao carregar estados:", error);
            }
        };
        fetchEstados();
    }, []);

// 👇 função que busca as cidades quando o estado muda
    const carregarCidades = async (uf) => {
        try {
            const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`);
            const data = await res.json();
            setCidadesIBGE(data);
        } catch (error) {
            console.error("Erro ao carregar cidades:", error);
        }
    };


    // ---- Upload e Crop ----
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5MB.");
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

    function formatarDataParaEnvio(dataStr) {
        if (!dataStr) return '';
        const data = new Date(dataStr);
        return data.toISOString().split('T')[0];
    }

    // ---- Envio do formulário ----
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // 1️⃣ Cria o usuário (tabela usuarios)
            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('email', email);
            formData.append('genero', genero);
            formData.append('data_nascimento', formatarDataParaEnvio(dataNascimento));
            formData.append('senha', senha);
            formData.append('funcao', funcao);
            if (avatar) formData.append('avatar', avatar);

            const userResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });

            if (!userResponse.ok) {
                const errorText = await userResponse.text();
                throw new Error(errorText || 'Erro ao criar usuário.');
            }

            const usuario = await userResponse.json();
            console.log('Usuário criado:', usuario);

            // 2️⃣ Cria o perfil de professor (tabela professores)
            const profData = {
                usuario_id: usuario.id,
                cref,
                especialidade,
                experiencia,
                descricao,
                preco_hora: precoHora,
                cidade,
                estado,
                contato,
            };

            const profResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL}/professores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profData),
            });

            if (!profResponse.ok) {
                const errorText = await profResponse.text();
                throw new Error(errorText || 'Erro ao criar perfil de professor.');
            }

            setShowModal(true);

            // Limpa os campos
            setNome('');
            setEmail('');
            setGenero('');
            setDataNascimento('');
            setSenha('');
            setAvatar(null);
            setPreviewUrl(null);
            setCref('');
            setEspecialidade('');
            setExperiencia('');
            setDescricao('');
            setPrecoHora('');
            setCidade('');
            setEstado('');
            setContato('');

            setTimeout(() => {
                setShowModal(false);
                navigate('/');
            }, 1500);

        } catch (error) {
            console.error('Erro:', error);
            setMessage({ type: 'error', text: error.message || 'Erro ao conectar ao servidor.' });
        } finally {
            setLoading(false);
        }
    };

    // ---- JSX ----
    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Cadastro de Professor</h2>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Avatar */}
                <div className="d-flex justify-content-center mb-4">
                    <div className="position-relative" style={{ width: 140, height: 140 }}>
                        <img
                            src={previewUrl || "/user.png"}
                            alt="Preview"
                            className="rounded-circle shadow"
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                border: "2px solid #dee2e6",
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-primary shadow-lg position-absolute bottom-0 start-50 translate-middle-x"
                            style={{
                                borderRadius: "50%",
                                width: 48,
                                height: 48,
                                fontSize: "1.3rem",
                                border: "3px solid white",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                transform: "translate(-50%, 30%)",
                            }}
                            onClick={() => document.getElementById("avatar-input").click()}
                            title="Selecionar avatar"
                        >
                            <i className="bi bi-camera-fill"></i>
                        </button>

                        <input
                            type="file"
                            id="avatar-input"
                            onChange={handleFileChange}
                            className="d-none"
                            accept="image/*"
                        />
                    </div>
                </div>

                {showCropper && selectedFile && (
                    <CropAvatar file={selectedFile} onCropped={handleCropped} onClose={() => setShowCropper(false)} />
                )}

                {/* Campos principais */}
                {[
                    { label: 'Nome', type: 'text', value: nome, setter: setNome },
                    { label: 'Email', type: 'email', value: email, setter: setEmail },
                    { label: 'Data de Nascimento', type: 'date', value: dataNascimento, setter: setDataNascimento },
                    { label: 'Senha', type: 'password', value: senha, setter: setSenha, minLength: 6 },
                ].map((field, idx) => (
                    <div className="form-floating mb-3" key={idx}>
                        <input
                            type={field.type}
                            className="form-control"
                            id={field.label.toLowerCase().replace(/\s/g, "_")}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            placeholder={`Digite o ${field.label.toLowerCase()}`}
                            required
                            {...(field.minLength && { minLength: field.minLength })}
                        />
                        <label htmlFor={field.label.toLowerCase().replace(/\s/g, "_")}>{field.label}</label>
                    </div>
                ))}

                {/* Gênero */}
                <div className="form-floating mb-3">
                    <select
                        className="form-select"
                        id="genero"
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        required
                    >
                        <option value="">Selecione o gênero</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                    </select>
                    <label htmlFor="genero">Gênero</label>
                </div>

                {/* Campos profissionais */}
                {[
                    { label: 'CREF', type: 'text', value: cref, setter: setCref },
                    { label: 'Especialidade', type: 'text', value: especialidade, setter: setEspecialidade },
                    { label: 'Experiência (anos)', type: 'number', value: experiencia, setter: setExperiencia },
                    { label: 'Descrição', type: 'text', value: descricao, setter: setDescricao },
                    { label: 'Preço por hora (R$)', type: 'number', value: precoHora, setter: setPrecoHora },
                    { label: 'Contato (Instagram, WhatsApp, etc)', type: 'text', value: contato, setter: setContato },
                ].map((field, idx) => (
                    <div className="form-floating mb-3" key={idx}>
                        <input
                            type={field.type}
                            className="form-control"
                            id={field.label.toLowerCase().replace(/\s/g, "_")}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            placeholder={field.label}
                        />
                        <label htmlFor={field.label.toLowerCase().replace(/\s/g, "_")}>{field.label}</label>
                    </div>
                ))}


                {/* Estado */}
                <div className="form-floating mb-3">
                    <select
                        className="form-select"
                        id="estado"
                        value={estado}
                        onChange={(e) => {
                            const uf = e.target.value;
                            setEstado(uf);
                            carregarCidades(uf);
                            setCidade('');
                        }}
                        required
                    >
                        <option value="">Selecione o estado</option>
                        {estadosIBGE.map((uf) => (
                            <option key={uf.id} value={uf.sigla}>
                                {uf.nome}
                            </option>
                        ))}
                    </select>
                    <label htmlFor="estado">Estado</label>
                </div>

                {/* Cidade */}
                <div className="form-floating mb-3">
                    <select
                        className="form-select"
                        id="cidade"
                        value={cidade}
                        onChange={(e) => setCidade(e.target.value)}
                        disabled={!estado}
                        required
                    >
                        <option value="">
                            {estado ? "Selecione a cidade" : "Escolha o estado primeiro"}
                        </option>
                        {cidadesIBGE.map((c) => (
                            <option key={c.id} value={c.nome}>
                                {c.nome}
                            </option>
                        ))}
                    </select>
                    <label htmlFor="cidade">Cidade</label>
                </div>


                <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? 'Adicionando...' : 'Cadastrar Professor'}
                    </button>
                </div>
            </form>

            <ModalSucesso show={showModal} mensagem="Professor cadastrado com sucesso!" />
        </div>
    );
}

export default Professor_new;
