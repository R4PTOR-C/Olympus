import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

    useEffect(() => {
        // Fetch user data
        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor');
                }
                return response.json();
            })
            .then(data => {
                setUsuario(data);
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

    const handleFileChange = (event) => {
        setAvatar(event.target.files[0]); // Armazena o arquivo de imagem selecionado
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        // Usar FormData para enviar dados do formulário junto com a imagem
        const formData = new FormData();
        formData.append('nome', usuario.nome);
        formData.append('email', usuario.email);
        formData.append('genero', usuario.genero);
        formData.append('idade', usuario.idade);
        formData.append('funcao', usuario.funcao);
        if (avatar) {
            formData.append('avatar', avatar); // Adiciona o avatar ao FormData se houver um novo arquivo
        }

        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, {
            method: 'PUT',
            body: formData,
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao atualizar o usuário');
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
    const avatarUrl = usuario.avatar ? `${process.env.REACT_APP_API_BASE_URL}/uploads/${usuario.avatar}` : null;

    return (
        <div className="container mt-5">
            <h1 className="mb-4">Editar Usuário</h1>
            <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
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
                <div className="mb-3">
                    <label className="form-label">Avatar Atual</label>
                    {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar do usuário" className="img-thumbnail mb-3" style={{ width: '150px', height: '150px', objectFit: 'cover' }} />
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
                </div>
                <button type="submit" className="btn btn-primary">Salvar</button>
            </form>
        </div>
    );
}

export default UsuariosEdit;
