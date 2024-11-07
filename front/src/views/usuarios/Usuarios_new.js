import React, { useState } from 'react';

function Usuarios_new() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [idade, setIdade] = useState('');
    const [senha, setSenha] = useState('');
    const [funcao, setFuncao] = useState('');
    const [avatar, setAvatar] = useState(null); // Novo estado para armazenar a imagem
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleFileChange = (event) => {
        setAvatar(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        // Usar FormData para enviar dados do formulário com a imagem
        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('email', email);
        formData.append('genero', genero);
        formData.append('idade', idade);
        formData.append('senha', senha);
        formData.append('funcao', funcao);
        if (avatar) {
            formData.append('avatar', avatar); // Adiciona a imagem ao FormData
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Usuário adicionado com sucesso!' });
                // Resetar o formulário
                setNome('');
                setEmail('');
                setGenero('');
                setIdade('');
                setSenha('');
                setFuncao('');
                setAvatar(null);
            } else {
                setMessage({ type: 'error', text: 'Falha ao adicionar usuário.' });
            }
        } catch (error) {
            console.error('Erro:', error);
            setMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Novo Usuário</h2>

            {/* Mensagem de feedback */}
            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {message.text}
                </div>
            )}

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
                        autoComplete="off"
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
                        min="1"
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
                        minLength="6"
                    />
                </div>

                <div className="form-group">
                    <label>Avatar</label>
                    <input
                        type="file"
                        className="form-control"
                        onChange={handleFileChange}
                        accept="image/*" // Restringe a apenas imagens
                    />
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Adicionando...' : 'Adicionar'}
                </button>
            </form>
        </div>
    );
}

export default Usuarios_new;
