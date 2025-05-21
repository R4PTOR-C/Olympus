import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CropAvatar from "../components/CropAvatar";
import { AuthContext } from '../../AuthContext';


const UsuariosEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState({
        nome: '',
        email: '',
        genero: '',
        idade: '',
        funcao: '',
    });
    const [avatar, setAvatar] = useState(null); // Estado para o novo avatar
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const previewUrl = avatar ? URL.createObjectURL(avatar) : null;
    const { updateUser, userId } = useContext(AuthContext);





    useEffect(() => {
        if (!id) return; // 👈 CORRETO: só continua quando o id estiver definido

        console.log("ID recebido pelo useParams:", id);

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
                setUsuario(data);
                setAvatar(null); // Reseta avatar novo após carregar o existente
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
        console.log("🎯 Recebido no onCropped:", croppedBlob);
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
        formData.append('funcao', usuario.funcao);
        if (avatar) {
            formData.append('avatar', avatar);
        }

        console.log("➡️ Submetendo formulário");
        console.log('🧪 Avatar a ser enviado:', avatar);
        console.log('É um File?', avatar instanceof File);

        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            body: formData,
        })
            .then(async response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar o usuário');
                }
                const updated = await response.json();
                if (updated.usuario && updated.usuario.avatar && Number(id) === userId) {
                    updateUser({ avatar: updated.usuario.avatar }); // ✅ atualiza avatar no contexto
                }
                navigate('/usuarios');
            })
            .catch(error => {
                console.error("Erro ao atualizar o usuário:", error);
                setError(error.toString());
            });
    };


    if (loading) return <div>Carregando...</div>;
    if (error) return <div className="alert alert-danger">Erro: {error}</div>;

    // URL da imagem de avatar atual
    const avatarUrl = usuario.avatar || null; // A URL já vem pronta do Cloudinary

    return (
        <div className="container mt-5">
            <h1 className="mb-4">Editar Usuário</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Avatar Atual</label>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar do usuário" className="img-thumbnail mb-3"
                             style={{width: '150px', height: '150px', objectFit: 'cover'}}/>
                    ) : (
                        <p>Nenhum avatar definido</p>
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
                    {previewUrl && (
                        <div className="mt-3">
                            <label className="form-label">Prévia do novo avatar</label>
                            <img
                                src={previewUrl}
                                alt="Prévia do novo avatar"
                                className="img-thumbnail"
                                style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            />
                        </div>
                    )}

                </div>

                <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input
                        type="text"
                        name="nome"
                        value={usuario.nome}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={usuario.email}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Gênero</label>
                    <input
                        type="text"
                        name="genero"
                        value={usuario.genero}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Idade</label>
                    <input
                        type="number"
                        name="idade"
                        value={usuario.idade}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Função</label>
                    <input
                        type="text"
                        name="funcao"
                        value={usuario.funcao}
                        onChange={handleInputChange}
                        className="form-control"
                    />
                </div>


                <button type="submit" className="btn btn-primary">Salvar</button>
            </form>
        </div>
    );
}

export default UsuariosEdit;
