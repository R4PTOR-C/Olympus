import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import CropAvatar from "../components/CropAvatar";
import ModalCarregando from '../components/ModalCarregando';

const UsuariosEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateUser } = useContext(AuthContext);

    const [usuario, setUsuario] = useState({
        nome: '',
        email: '',
        genero: '',
        idade: '',
        data_nascimento: '',
        telefone: '',
        altura: '',
        peso: '',
        objetivo: ''
    });
    const [avatar, setAvatar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const previewUrl = avatar ? URL.createObjectURL(avatar) : null;

    useEffect(() => {
        if (!id) return;

        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`)
            .then(async response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Usuário não encontrado');
                    } else {
                        const errText = await response.text();
                        throw new Error(`Erro ${response.status}: ${errText}`);
                    }
                }
                return response.json();
            })
            .then(data => {
                const { funcao, ...dadosUsuario } = data;
                setUsuario(dadosUsuario);
                setAvatar(null);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados do usuário:", error);
                setError(error.toString());
                setLoading(false);
            });
    }, [id]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setUsuario({ ...usuario, [name]: value });
    };

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
        setShowCropper(false);
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData();
        Object.entries(usuario).forEach(([key, value]) => {
            formData.append(key, value);
        });
        if (avatar) {
            formData.append('avatar', avatar);
        }

        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            body: formData,
        })
            .then(response => {
                if (!response.ok) throw new Error('Erro ao atualizar o usuário');
                return response.json();
            })
            .then((res) => {
                updateUser && updateUser({
                    userName: res.usuario.nome,
                    avatar: res.usuario.avatar
                });
                navigate(`/home/${res.usuario.id}`);
            })
            .catch(error => {
                console.error("Erro ao atualizar o usuário:", error);
                setError(error.toString());
            });
    };

    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div className="alert alert-danger">Erro: {error}</div>;

    const avatarUrl = usuario.avatar || null;

    return (
        <div className="container mt-4 mb-5">
            <h2 className="text-center mb-4">Editar Perfil</h2>
            <form onSubmit={handleSubmit}>
                {/* Avatar */}
                <div className="d-flex justify-content-center mb-4">
                    <div className="position-relative">
                        <img
                            src={previewUrl || avatarUrl}
                            alt="Avatar"
                            className="rounded-circle shadow"
                            style={{ width: 120, height: 120, objectFit: 'cover' }}
                        />
                        <button
                            type="button"
                            className="btn btn-light border position-absolute bottom-0 start-50 translate-middle-x"
                            style={{ borderRadius: '50%', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => document.getElementById('avatar-input').click()}
                            title="Editar avatar"
                        >
                            <i className="bi bi-pencil"></i>
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

                {/* Card Dados Pessoais */}
                <div className="card mb-4 shadow-sm">
                    <div className="card-header fw-bold">Dados Pessoais</div>
                    <div className="card-body">
                        {[
                            { name: 'nome', label: 'Nome', type: 'text' },
                            { name: 'email', label: 'Email', type: 'email' },
                            { name: 'genero', label: 'Gênero', type: 'select', options: ['Masculino', 'Feminino', 'Outro'] },
                            { name: 'idade', label: 'Idade', type: 'number' },
                            { name: 'data_nascimento', label: 'Data de Nascimento', type: 'date' },
                            { name: 'telefone', label: 'Telefone', type: 'tel' },
                        ].map((campo) => (
                            <div className="d-flex align-items-center gap-3 mb-3" key={campo.name}>
                                <label htmlFor={campo.name} className="fw-bold" style={{ minWidth: "160px" }}>
                                    {campo.label}
                                </label>
                                {campo.type === 'select' ? (
                                    <select
                                        className="form-select"
                                        id={campo.name}
                                        name={campo.name}
                                        value={usuario[campo.name] || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Selecione</option>
                                        {campo.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={campo.type}
                                        className="form-control"
                                        id={campo.name}
                                        name={campo.name}
                                        value={usuario[campo.name] || ''}
                                        onChange={handleInputChange}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Card Informações Corporais */}
                <div className="card mb-4 shadow-sm">
                    <div className="card-header fw-bold">Informações Corporais</div>
                    <div className="card-body">
                        {[
                            { name: 'altura', label: 'Altura (cm)', type: 'number' },
                            { name: 'peso', label: 'Peso (kg)', type: 'number' },
                            { name: 'objetivo', label: 'Objetivo', type: 'select', options: ['Emagrecimento', 'Hipertrofia', 'Condicionamento físico'] },
                        ].map((campo) => (
                            <div className="d-flex align-items-center gap-3 mb-3" key={campo.name}>
                                <label htmlFor={campo.name} className="fw-bold" style={{ minWidth: "160px" }}>
                                    {campo.label}
                                </label>
                                {campo.type === 'select' ? (
                                    <select
                                        className="form-select"
                                        id={campo.name}
                                        name={campo.name}
                                        value={usuario[campo.name] || ''}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Selecione</option>
                                        {campo.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type={campo.type}
                                        className="form-control"
                                        id={campo.name}
                                        name={campo.name}
                                        value={usuario[campo.name] || ''}
                                        onChange={handleInputChange}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botão Salvar */}
                <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg">
                        Salvar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UsuariosEdit;
