import React, { useState } from 'react';

function Exercicios_new() {
    const [nome_exercicio, setNome_exercicio] = useState('');
    const [grupo_muscular, setGrupo_muscular] = useState('');
    const [nivel, setNivel] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        const exercicio = { nome_exercicio, grupo_muscular, nivel };

        try {
            const response = await fetch(`http://localhost:5000/exercicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(exercicio),
            });

            if (response.ok) {
                alert('Exercício adicionado com sucesso!');
                // Limpar o formulário
                setNome_exercicio('');
                setGrupo_muscular('');
                setNivel('');
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
                <button type="submit" className="btn btn-primary mt-3">Adicionar</button>
            </form>
        </div>
    );
}

export default Exercicios_new;
