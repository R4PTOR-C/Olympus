import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Usuarios_view = () => {
    const { id } = useParams(); // ID do usuário a ser visualizado
    const [usuario, setUsuario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Buscar os detalhes do usuário com base no ID
        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar os dados do usuário');
                }
                return response.json();
            })
            .then(data => {
                setUsuario(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [id]);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (
        <div className="container mt-5">
            <h2>Detalhes do Usuário</h2>
            {usuario ? (
                <div>
                    <p><strong>ID:</strong> {usuario.id}</p>
                    <p><strong>Nome:</strong> {usuario.nome}</p>
                    <p><strong>Email:</strong> {usuario.email}</p>
                    <p><strong>Gênero:</strong> {usuario.genero}</p>
                    <p><strong>Idade:</strong> {usuario.idade}</p>
                    <p><strong>Função:</strong> {usuario.funcao}</p>
                </div>
            ) : (
                <p>Usuário não encontrado</p>
            )}
        </div>
    );
};

export default Usuarios_view;
