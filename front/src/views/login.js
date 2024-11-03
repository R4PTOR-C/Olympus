import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css'; // Importa o CSS personalizado para estilos adicionais

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login`, {
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
                setTimeout(() => {
                    navigate('/home');
                }, 100); // Aguarda 100ms antes de navegar
            } else {
                console.error('Erro no login:', data.error);
                alert(data.error || 'Erro ao fazer login. Tente novamente.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de rede. Verifique sua conexão e tente novamente.');
        } finally {
            setLoading(false);
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
                                autoComplete="off"
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
                        <button type="submit" className="btn btn-primary btn-block login-btn" disabled={loading}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                        <div className="d-flex justify-content-between mt-3">
                            <Link to="/forgot-password" className="forgot-password">Esqueceu a senha?</Link>
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
                    <Link to="/sign-in" className="btn btn-outline-light">Cadastrar-se</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;
