import React, { useState } from 'react';

function Exercicios_new() {
    const [nome_exercicio, setNome_exercicio] = useState('');
    const [grupo_muscular, setGrupo_muscular] = useState('');
    const [nivel, setNivel] = useState('');
    const [gif, setGif] = useState(null);

    const GRUPOS_MUSCULARES = [
        "Peitoral",
        "Bíceps",
        "Tríceps",
        "Costas",
        "Ombros",
        "Pernas",
        "Abdômen",
        "Panturrilha"
    ];

    const handleSubmit = async (event) => {
        event.preventDefault();

        const formData = new FormData();
        formData.append('nome_exercicio', nome_exercicio);
        formData.append('grupo_muscular', grupo_muscular);
        formData.append('nivel', nivel);
        formData.append('gif', gif);

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/exercicios`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('Exercício adicionado com sucesso!');
                // Limpar o formulário
                setNome_exercicio('');
                setGrupo_muscular('');
                setNivel('');
                setGif(null);
            } else {
                alert('Falha ao adicionar exercício.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Novo Exercício</h2>
            <form onSubmit={handleSubmit}>
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
                    <select
                        className="form-control"
                        value={grupo_muscular}
                        onChange={(e) => setGrupo_muscular(e.target.value)}
                        required
                    >
                        <option value="">Selecione o grupo muscular</option>
                        {GRUPOS_MUSCULARES.map((grupo) => (
                            <option key={grupo} value={grupo}>{grupo}</option>
                        ))}
                    </select>
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
                        accept=".gif"
                        onChange={(e) => setGif(e.target.files[0])}
                        required
                    />
                    {gif && (
                        <small className="form-text text-muted">
                            Arquivo selecionado: {gif.name}
                        </small>
                    )}
                </div>
                <button type="submit" className="btn btn-primary mt-3">Adicionar</button>
            </form>
        </div>
    );
}

export default Exercicios_new;
