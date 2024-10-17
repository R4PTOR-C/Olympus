import React, { useState } from 'react';

function Usuarios_new() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [idade, setIdade] = useState('');
    const [senha, setSenha] = useState('');
    const [funcao, setFuncao] = useState('');


    const handleSubmit = async (event) => {
        event.preventDefault();
        const usuario = { nome, email, genero, idade, senha, funcao};

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(usuario),
            });

            if (response.ok) {
                alert('Usuário adicionado com sucesso!');
                // Resetar o formulário ou redirecionar o usuário
            } else {
                alert('Falha ao adicionar usuário.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Novo Usuário</h2>
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
                        <option value="V">Outras viadagens</option>

                    </select>
                </div>
                <div className="form-group">
                    <label>Função</label>
                    <select
                        className="form-control"
                        value={funcao}
                        onChange={(e) => setFuncao(e.target.value)}
                        required
                    >
                        <option value="" disabled>Selecione a função</option>
                        <option value="Aluno">Aluno</option>
                        <option value="Professor">Professor</option>
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

export default Usuarios_new;
