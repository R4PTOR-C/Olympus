import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles/Login.css';

function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext); // Pega a função de login do AuthContext

    // login.js (ou outro componente de login)
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });
            const data = await response.json();

            if (response.ok) {
                console.log('Login bem-sucedido:', data);
                // Chama a função de login do contexto passando os dados do usuário e o token
                login(
                    { userName: data.userName, userId: data.userId, funcao: data.funcao, avatar: data.avatar },
                    data.token
                );

                // Redireciona com base na função do usuário
                if (data.funcao === 'Professor') {
                    navigate('/usuarios'); // Exemplo de rota para professores
                } else if (data.funcao === 'Aluno') {
                    navigate('/home'); // Exemplo de rota para alunos
                } else {
                    // Se a função do usuário não for especificada, redireciona para uma rota padrão
                    navigate('/home');
                }
            } else {
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
                    <h3 className="mb-4" style={{fontFamily: 'delirium'}}>OLYMPUS</h3>
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
                    <img
                        src="/logo.png"
                        alt="Logo"
                        className="logo-image"
                        style={{maxWidth: '100%', height: 'auto', marginBottom: '20px'}}
                    />
                    <p>Não tem uma conta?</p>
                    <Link to="/sign-in" className="signin-btn" >Cadastrar-se</Link>
                </div>

            </div>
        </div>
    );
}

export default Login;
