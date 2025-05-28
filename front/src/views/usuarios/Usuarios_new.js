import React, { useState } from 'react';

function Usuarios_new() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [idade, setIdade] = useState('');
    const [senha, setSenha] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const funcao = 'Aluno';

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setAvatar(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('nome', nome);
        formData.append('email', email);
        formData.append('genero', genero);
        formData.append('idade', idade);
        formData.append('senha', senha);
        formData.append('funcao', funcao);
        if (avatar) {
            formData.append('avatar', avatar);
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Usuário adicionado com sucesso!' });
                setNome('');
                setEmail('');
                setGenero('');
                setIdade('');
                setSenha('');
                setAvatar(null);
                setPreviewUrl(null);
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
            <h2 className="text-center mb-4">Adicionar Novo Usuário</h2>

            {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="d-flex justify-content-center mb-4">
                    <div className="position-relative">
                        {previewUrl && (
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="rounded-circle shadow"
                                style={{ width: 120, height: 120, objectFit: 'cover' }}
                            />
                        )}

                        <button
                            type="button"
                            className="btn btn-light border position-absolute bottom-0 start-50 translate-middle-x"
                            style={{ borderRadius: '50%', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                            onClick={() => document.getElementById('avatar-input').click()}
                            title="Selecionar avatar"
                        >
                            <i className="bi bi-camera"></i>
                        </button>

                        <input
                            type="file"
                            id="avatar-input"
                            onChange={handleFileChange}
                            className="d-none"
                            accept="image/*"
                        />
                    </div>
                </div>

                {[
                    { label: 'Nome', type: 'text', value: nome, setter: setNome },
                    { label: 'Email', type: 'email', value: email, setter: setEmail },
                    { label: 'Idade', type: 'number', value: idade, setter: setIdade, min: 1 },
                    { label: 'Senha', type: 'password', value: senha, setter: setSenha, minLength: 6 },
                ].map((field, idx) => (
                    <div className="form-floating mb-3" key={idx}>
                        <input
                            type={field.type}
                            className="form-control"
                            id={field.label.toLowerCase()}
                            value={field.value}
                            onChange={(e) => field.setter(e.target.value)}
                            placeholder={`Digite o ${field.label.toLowerCase()}`}
                            required
                            {...(field.min && { min: field.min })}
                            {...(field.minLength && { minLength: field.minLength })}
                        />
                        <label htmlFor={field.label.toLowerCase()}>{field.label}</label>
                    </div>
                ))}

                <div className="form-floating mb-3">
                    <select
                        className="form-select"
                        id="genero"
                        value={genero}
                        onChange={(e) => setGenero(e.target.value)}
                        required
                    >
                        <option value="">Selecione o gênero</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                    </select>
                    <label htmlFor="genero">Gênero</label>
                </div>

                <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? 'Adicionando...' : 'Adicionar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default Usuarios_new;
