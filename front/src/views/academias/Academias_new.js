import React, { useState } from 'react';

function Academias_new() {
    const [nome, setNome] = useState('');
    const [cnpj, setCNPJ] = useState('');
    const [nome_dono, setNomeDono] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');


    const handleSubmit = async (event) => {
        event.preventDefault();
        const academia = { nome, cnpj, nome_dono, email, senha};

        try {
            const response = await fetch(`http://localhost:5000/academias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(academia),
            });

            if (response.ok) {
                alert('Academia adicionada com sucesso!');
                // Resetar o formulário ou redirecionar o usuário
            } else {
                alert('Falha ao adicionar academia.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Nova Academia</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Academia</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>CNPJ</label>
                    <input
                        type="text"
                        className="form-control"
                        value={cnpj}
                        onChange={(e) => setCNPJ(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nome Completo</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome_dono}
                        onChange={(e) => setNomeDono(e.target.value)}
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
                    />
                </div>
                <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>
        </div>
    );
}

export default Academias_new;
