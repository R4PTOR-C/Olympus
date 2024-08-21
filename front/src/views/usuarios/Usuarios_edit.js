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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:5000/usuarios/${id}`)
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

    const handleSubmit = (event) => {
        event.preventDefault();
        fetch(`http://localhost:5000/usuarios/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario),
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
    if (error) return <div>Erro: {error}</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Editar Usuário</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Nome</label>
                    <input
                        type="text"
                        name="nome"
                        value={usuario.nome}
                        onChange={handleInputChange}
                        className="form-input mt-1 block w-full"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Email</label>
                    <input
                        type="email"
                        name="email"
                        value={usuario.email}
                        onChange={handleInputChange}
                        className="form-input mt-1 block w-full"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Gênero</label>
                    <input
                        type="text"
                        name="genero"
                        value={usuario.genero}
                        onChange={handleInputChange}
                        className="form-input mt-1 block w-full"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Idade</label>
                    <input
                        type="number"
                        name="idade"
                        value={usuario.idade}
                        onChange={handleInputChange}
                        className="form-input mt-1 block w-full"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium">Função</label>
                    <input
                        type="text"
                        name="funcao"
                        value={usuario.funcao}
                        onChange={handleInputChange}
                        className="form-input mt-1 block w-full"
                    />
                </div>
                <button type="submit" className="btn btn-primary">Salvar</button>
            </form>
        </div>
    );
}

export default UsuariosEdit;
