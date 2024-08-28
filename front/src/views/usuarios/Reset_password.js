import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function ResetPassword() {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`http://localhost:5000/usuarios/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ senha: password }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Senha redefinida com sucesso.');
            } else {
                setMessage(data.error || 'Erro ao redefinir senha.');
            }
        } catch (error) {
            console.error('Erro:', error);
            setMessage('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="reset-password-container">
            <h3>Redefinir Senha</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nova Senha</label>
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Digite sua nova senha"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Redefinir Senha</button>
            </form>
            {message && <p className="mt-3">{message}</p>}
        </div>
    );
}

export default ResetPassword;
