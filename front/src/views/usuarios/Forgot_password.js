import React, { useState } from 'react';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const response = await fetch('http://localhost:5000/usuarios/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            // Verifique o texto da resposta
            const text = await response.text();
            console.log(text);

            // Tente converter o texto para JSON
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = {};
            }

            if (response.ok) {
                setMessage('Um link para redefinição de senha foi enviado para o seu email.');
            } else {
                setMessage(data.error || 'Erro ao solicitar redefinição de senha.');
            }
        } catch (error) {
            console.error('Erro:', error);
            setMessage('Erro ao conectar ao servidor.');
        }
    };


    return (
        <div className="forgot-password-container">
            <h3>Esqueceu a Senha</h3>
            <p>Insira seu email para receber um link de redefinição de senha.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu email"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Enviar</button>
            </form>
            {message && <p className="mt-3">{message}</p>}
        </div>
    );
}

export default ForgotPassword;
