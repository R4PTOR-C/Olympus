import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate


function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const navigate = useNavigate(); // Cria a instância de navigate


    const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',  // necessário para enviar/receber cookies
            body: JSON.stringify({ email, senha }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Login bem-sucedido:', data);
            navigate('/home'); // Redireciona para o dashboard

        } else {
            console.error('Erro de login:', data.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label>
                Email:
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
                Senha:
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </label>
            <button type="submit">Login</button>
        </form>
    );
}

export default Login;
