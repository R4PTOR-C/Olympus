import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = {};
            }

            if (response.ok) {
                setMessage({ text: 'Um link para redefinição de senha foi enviado para o seu email.', type: 'success' });
            } else {
                setMessage({ text: data.error || 'Erro ao solicitar redefinição de senha.', type: 'danger' });
            }
        } catch (error) {
            console.error('Erro:', error);
            setMessage({ text: 'Erro ao conectar ao servidor.', type: 'danger' });
        }
    };

    return (
        <div className="container mt-5">
            <h2 className="text-center mb-4">Esqueceu a Senha</h2>
            <p className="text-center">Insira seu email para receber um link de redefinição de senha.</p>

            {message && (
                <div className={`alert alert-${message.type}`} role="alert">
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-floating mb-3">
                    <input
                        type="email"
                        className="form-control"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu email"
                        required
                    />
                    <label htmlFor="email">Email</label>
                </div>

                <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg">
                        Enviar
                    </button>
                </div>
            </form>

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

export default ForgotPassword;
