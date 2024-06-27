import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const Usuarios_index = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        //maxdoc.onrender.com
        fetch('http://localhost:5000/usuarios')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta do servidor');
                }
                return response.json();
            })
            .then(data => {
                setUsuarios(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Erro ao buscar dados dos usuários:", error);
                setError(error.toString());
                setLoading(false);
            });
    }, []);

    if (loading) return <div>Carregando...</div>;
    if (error) return <div>Erro: {error}</div>;

    return (

        <div className="overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Usuários</h1>
            <div className="table-responsive">
                <table className="table table-hover">
                    <thead className="bg-gray-200">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID</th>
                        <th scope="col" className="px-6 py-3">Nome</th>
                        <th scope="col" className="px-6 py-3">Email</th>
                        <th scope="col" className="px-6 py-3">Gênero</th>
                        <th scope="col" className="px-6 py-3">Idade</th>
                    </tr>
                    </thead>
                    <tbody>
                    {usuarios.map(usuario => (
                        <tr key={usuario.id}>
                            <th scope="row" className="px-6 py-4">{usuario.id}</th>
                            <td className="px-6 py-4">{usuario.nome}</td>
                            <td className="px-6 py-4">{usuario.email}</td>
                            <td className="px-6 py-4">{usuario.genero}</td>
                            <td className="px-6 py-4">{usuario.idade}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}



export default Usuarios_index;
