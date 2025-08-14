import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ senha: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ text: 'Senha redefinida com sucesso.', type: 'success' });
            } else {
                setMessage({ text: data.error || 'Erro ao redefinir senha.', type: 'danger' });
            }
        } catch (error) {
            console.error('Erro:', error);
            setMessage({ text: 'Erro ao conectar ao servidor.', type: 'danger' });
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Redefinir Senha</h2>

            {message && (
                <div className={`alert alert-${message.type}`} role="alert">
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                    <input
                        type="password"
                        className="form-control"
                        id="novaSenha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua nova senha"
                        required
                        minLength={6}
                    />
                    <label htmlFor="novaSenha">Nova Senha</label>
                </div>

                <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg">
                        Redefinir Senha
                    </button>
                </div>
            </form>

            {/* Botão para voltar ao login */}
            <div className="d-grid mt-3">
                <button
                    type="button"
                    className="btn btn-secondary btn-lg"
                    onClick={() => navigate('/')}
                >
                    Voltar para Login
                </button>
            </div>
        </div>
    );
}

export default ResetPassword;
