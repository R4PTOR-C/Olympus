import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CropAvatar from "../components/CropAvatar";
import ModalSucesso from "../components/ModalSucesso";

function Usuarios_new() {
    const navigate = useNavigate();

    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [telefone, setTelefone] = useState('');
    const [altura, setAltura] = useState('');
    const [peso, setPeso] = useState('');
    const [objetivo, setObjetivo] = useState('');
    const [senha, setSenha] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const funcao = 'Aluno';

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5MB.");
            return;
        }
        setSelectedFile(file);
        setShowCropper(true);
    };

    const handleCropped = async (croppedBlob) => {
        const file = new File([croppedBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        setAvatar(file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowCropper(false);
    };

    function formatarDataParaEnvio(dataStr) {
        if (!dataStr) return '';
        const data = new Date(dataStr);
        return data.toISOString().split('T')[0]; // garante formato ISO
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('email', email);
        formData.append('genero', genero);
        formData.append('data_nascimento', formatarDataParaEnvio(dataNascimento));
        formData.append('telefone', telefone);
        formData.append('altura', altura);
        formData.append('peso', peso);
        formData.append('objetivo', objetivo);
        formData.append('senha', senha);
        formData.append('funcao', funcao);
        if (avatar) formData.append('avatar', avatar);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });

            const text = await response.text();
            console.log("Status:", response.status);
            console.log("Resposta do servidor:", text);

            if (response.ok) {
                setShowModal(true);

                // limpa os campos
                setNome('');
                setEmail('');
                setGenero('');
                setDataNascimento('');
                setTelefone('');
                setAltura('');
                setPeso('');
                setObjetivo('');
                setSenha('');
                setAvatar(null);
                setPreviewUrl(null);

                // redireciona após 1,5s
                setTimeout(() => {
                    setShowModal(false);
                    navigate('/');
                }, 1500);
            } else {
                try {
                    const erro = JSON.parse(text);
                    setMessage({ type: 'error', text: erro.error || 'Falha ao adicionar usuário.' });
                } catch {
                    setMessage({ type: 'error', text: text || 'Falha ao adicionar usuário.' });
                }
            }
        } catch (error) {
            console.error('Erro:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Criar Conta</h2>

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
                            src={previewUrl || "/user.png"} // pode usar um placeholder
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
                                transform: "translate(-50%, 30%)", // 🔹 pequeno deslocamento visual (opcional)
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
                    { label: 'Telefone', type: 'tel', value: telefone, setter: setTelefone },
                    { label: 'Altura (cm)', type: 'number', value: altura, setter: setAltura },
                    { label: 'Peso (kg)', type: 'number', value: peso, setter: setPeso },
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
                            {...(field.min && { min: field.min })}
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

                {/* Objetivo */}
                <div className="form-floating mb-3">
                    <select
                        className="form-select"
                        id="objetivo"
                        value={objetivo}
                        onChange={(e) => setObjetivo(e.target.value)}
                        required
                    >
                        <option value="">Selecione o objetivo</option>
                        <option value="Emagrecimento">Emagrecimento</option>
                        <option value="Hipertrofia">Hipertrofia</option>
                        <option value="Condicionamento físico">Condicionamento físico</option>
                    </select>
                    <label htmlFor="objetivo">Objetivo</label>
                </div>

                <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </div>
            </form>

            <ModalSucesso show={showModal} mensagem="Conta criada com sucesso!" />
        </div>
    );
}

export default Usuarios_new;
