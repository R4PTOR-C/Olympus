import React, { useState } from 'react';

function Professor_new() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [idade, setIdade] = useState('');
    const [senha, setSenha] = useState('');

    const funcao = 'Professor'; // Campo função definido automaticamente

    const handleSubmit = async (event) => {
        event.preventDefault();
        const usuario = { nome, email, genero, idade, senha, funcao };

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usuario),
            });

            if (response.ok) {
                alert('Professor adicionado com sucesso!');
                // Resetar o formulário ou redirecionar o usuário
            } else {
                alert('Falha ao adicionar professor.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Novo Professor</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nome</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete={"off"}
                    />
                </div>
                <div className="form-group">
                    <label>Gênero</label>
                    <select
                        className="form-control"
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        required
                    >
                        <option value="" disabled>Selecione o gênero</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Idade</label>
                    <input
                        type="number"
                        className="form-control"
                        value={idade}
                        onChange={(e) => setIdade(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Senha</label>
                    <input
                        type="password"
                        className="form-control"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        required
                        autoComplete="new-password"
                    />
                </div>
                <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>
        </div>
    );
}

export default Professor_new;
