import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Login.css'; // Importa o CSS personalizado para estilos adicionais

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, senha }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Login bem-sucedido:', data);
            navigate('/home');
        } else {
            console.error('Erro de login:', data.error);
        }
    };

    return (
        <div className="login-page-container">
        <div className="login-container d-flex">
            <div className="col-md-6 login-form">
                <h3 className="mb-4">Sign In</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            className="form-control"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="senha">Senha</label>
                        <input
                            type="password"
                            className="form-control"
                            id="senha"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Senha"
                            required
                        />
                    </div>
                    <div className="form-group form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            id="rememberMe"
                        />
                        <label className="form-check-label remember-me" htmlFor="rememberMe">Lembrar-me</label>
                    </div>
                    <button type="submit" className="btn btn-primary btn-block login-btn">Entrar</button>
                    <div className="d-flex justify-content-between mt-3">
                        <a href="/forgot-password" className="forgot-password">Esqueceu a senha?</a>
                    </div>
                </form>
                <div className="social-icons mt-3">
                    <a href="#"><i className="fab fa-facebook-f"></i></a>
                    <a href="#"><i className="fab fa-twitter"></i></a>
                </div>
            </div>
            <div className="col-md-6 welcome-container">
                <h2>Bem-vindo</h2>
                <p>Não tem uma conta?</p>
                <a href="/sign-in" className="btn btn-outline-light">Cadastrar-se</a>
            </div>
        </div>
        </div>
    );
}

export default Login;
