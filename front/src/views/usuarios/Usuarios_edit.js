import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import CropAvatar from "../components/CropAvatar";

const UsuariosEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateUser } = useContext(AuthContext);

    const [usuario, setUsuario] = useState({
        nome: '',
        email: '',
        genero: '',
        idade: '',
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
                // Remover campo função antes de setar no state
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
        formData.append('nome', usuario.nome);
        formData.append('email', usuario.email);
        formData.append('genero', usuario.genero);
        formData.append('idade', usuario.idade);
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
                updateUser && updateUser(res.usuario);
                navigate(`/home/${res.usuario.id}`);
            })
            .catch(error => {
                console.error("Erro ao atualizar o usuário:", error);
                setError(error.toString());
            });
    };

    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="alert alert-danger">Erro: {error}</div>;

    const avatarUrl = usuario.avatar || null;

    return (
        <div className="container mt-4 mb-5">
            <h2 className="text-center mb-4">Editar Perfil</h2>
            <form onSubmit={handleSubmit}>
                <div className="text-center mb-4">
                    {avatarUrl && !previewUrl && (
                        <img src={avatarUrl} alt="Avatar atual" className="rounded-circle" style={{ width: 120, height: 120, objectFit: 'cover' }} />
                    )}
                    {previewUrl && (
                        <img src={previewUrl} alt="Novo avatar" className="rounded-circle" style={{ width: 120, height: 120, objectFit: 'cover' }} />
                    )}
                </div>

                <div className="mb-3">
                    <label className="form-label">Alterar Avatar</label>
                    <input
                        type="file"
                        name="avatar"
                        onChange={handleFileChange}
                        className="form-control"
                        accept="image/*"
                    />
                    {showCropper && selectedFile && (
                        <CropAvatar file={selectedFile} onCropped={handleCropped} onClose={() => setShowCropper(false)} />
                    )}
                </div>

                {['nome', 'email', 'genero', 'idade'].map((campo) => (
                    <div className="form-floating mb-3" key={campo}>
                        {campo === 'genero' ? (
                            <>
                                <select
                                    className="form-select w-100"
                                    id={campo}
                                    name={campo}
                                    value={usuario[campo]}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Selecione o gênero</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Feminino">Feminino</option>
                                </select>
                                <label htmlFor={campo}>Gênero</label>
                            </>
                        ) : (
                            <>
                                <input
                                    type={campo === 'idade' ? 'number' : 'text'}
                                    className="form-control"
                                    id={campo}
                                    name={campo}
                                    value={usuario[campo]}
                                    onChange={handleInputChange}
                                    placeholder={`Digite o ${campo}`}
                                />
                                <label htmlFor={campo}>{campo.charAt(0).toUpperCase() + campo.slice(1)}</label>
                            </>
                        )}
                    </div>
                ))}


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
