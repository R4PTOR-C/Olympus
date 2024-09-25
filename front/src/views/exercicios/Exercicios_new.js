import React, { useState } from 'react';

function Exercicios_new() {
    const [nome_exercicio, setNome_exercicio] = useState('');


    const handleSubmit = async (event) => {
        event.preventDefault();
        const usuario = { nome_exercicio};

        try {
            const response = await fetch(`http://localhost:5000/exercicios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usuario),
            });

            if (response.ok) {
                alert('Exercicio adicionado com sucesso!');
                // Resetar o formulário ou redirecionar o usuário
            } else {
                alert('Falha ao adicionar exercicio.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Novo Exercicio</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nome</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome_exercicio}
                        onChange={(e) => setNome_exercicio(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>
        </div>
    );
}

export default Exercicios_new;
