import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Exercicios_edit() {
    const { id } = useParams(); // Pega o ID do exercício da URL
    const navigate = useNavigate();
    const [nome_exercicio, setNome_exercicio] = useState('');
    const [grupo_muscular, setGrupo_muscular] = useState('');
    const [nivel, setNivel] = useState('');
    const [gifFile, setGifFile] = useState(null); // Novo estado para o arquivo GIF
    const [gifPreview, setGifPreview] = useState(''); // Estado para exibir pré-visualização do GIF

    // Buscar os dados do exercício existente
    useEffect(() => {
        const fetchExercicio = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios/exercicios/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setNome_exercicio(data.nome_exercicio);
                    setGrupo_muscular(data.grupo_muscular);
                    setNivel(data.nivel);
                    setGifPreview(data.gif_url); // Carregar pré-visualização do GIF existente
                } else {
                    alert('Erro ao buscar os dados do exercício.');
                }
            } catch (error) {
                console.error('Erro ao conectar ao servidor:', error);
                alert('Erro ao conectar ao servidor.');
            }
        };

        fetchExercicio();
    }, [id]);

    const handleGifChange = (event) => {
        const file = event.target.files[0];
        setGifFile(file);

        // Gerar pré-visualização do GIF
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setGifPreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('nome_exercicio', nome_exercicio);
        formData.append('grupo_muscular', grupo_muscular);
        formData.append('nivel', nivel);

        if (gifFile) {
            formData.append('gif', gifFile); // Adiciona o arquivo GIF ao formulário
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios/${id}`, {
                method: 'PUT',
                body: formData,
            });

            if (response.ok) {
                alert('Exercício atualizado com sucesso!');
                navigate('/exercicios'); // Redirecionar para a lista de exercícios
            } else {
                alert('Erro ao atualizar o exercício.');
            }
        } catch (error) {
            console.error('Erro ao conectar ao servidor:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Editar Exercício</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div className="form-group">
                    <label>Nome do Exercício</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome_exercicio}
                        onChange={(e) => setNome_exercicio(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group mt-3">
                    <label>Grupo Muscular</label>
                    <input
                        type="text"
                        className="form-control"
                        value={grupo_muscular}
                        onChange={(e) => setGrupo_muscular(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group mt-3">
                    <label>Nível</label>
                    <select
                        className="form-control"
                        value={nivel}
                        onChange={(e) => setNivel(e.target.value)}
                        required
                    >
                        <option value="">Selecione o nível</option>
                        <option value="Iniciante">Iniciante</option>
                        <option value="Intermediário">Intermediário</option>
                        <option value="Avançado">Avançado</option>
                    </select>
                </div>
                <div className="form-group mt-3">
                    <label>GIF do Exercício</label>
                    <input
                        type="file"
                        className="form-control"
                        accept="image/gif"
                        onChange={handleGifChange}
                    />
                    {gifPreview && (
                        <div className="mt-3">
                            <label>Pré-visualização:</label>
                            <img src={gifPreview} alt="GIF Preview" style={{ maxWidth: '100%', height: 'auto' }} />
                        </div>
                    )}
                </div>
                <button type="submit" className="btn btn-primary mt-3">Salvar Alterações</button>
            </form>
        </div>
    );
}

export default Exercicios_edit;
