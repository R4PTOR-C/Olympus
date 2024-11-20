import React, { useContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import Usuarios_index from './views/usuarios/Usuarios_index';
import Usuarios_new from "./views/usuarios/Usuarios_new";
import Usuarios_view from "./views/usuarios/Usuarios_view";
import Login from "./views/login";
import Home from "./views/home";
import UsuariosEdit from './views/usuarios/Usuarios_edit';
import Academias_new from "./views/academias/Academias_new";
import ForgotPassword from "./views/usuarios/Forgot_password";
import ResetPassword from "./views/usuarios/Reset_password";
import Academias_login from "./views/academias/Academias_login";
import Exercicios_new from "./views/exercicios/Exercicios_new";
import TreinosForm from './views/treinos/TreinosForm';
import Navbar from "./views/components/navbar";
import Exercicios_index from "./views/exercicios/Exercicios_index";
import Professor_new from "./views/professores/Professores_new";
import Exercicios_tabela from "./views/exercicios/Exercicios_tabela"
import { AuthProvider, AuthContext } from './AuthContext';
import './App.css';
import './styles/Navbar.css'
import './styles/Usuarios.css'; // Certifique-se de criar um arquivo CSS para os estilos


// Componente para rotas protegidas
function ProtectedRoute({ children }) {
    const { loggedIn } = useContext(AuthContext); // Acessa o contexto aqui dentro
    return loggedIn ? children : <Navigate to="/" />;
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

// Separar AppContent para usar useLocation dentro do Router
function AppContent() {
    const location = useLocation();
    const { loggedIn } = useContext(AuthContext);

    return (
        <>
            {/* Renderiza a Navbar apenas se o usuário estiver logado e não estiver na página de login */}
            {loggedIn && !['/', '/sign-in'].includes(location.pathname) && <Navbar />}
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/sign-in" element={<Usuarios_new />} />
                <Route path="/professor_new" element={<Professor_new />} />
                <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/usuarios" element={<ProtectedRoute><Usuarios_index /></ProtectedRoute>} />
                <Route path="/usuarios/edit/:id" element={<ProtectedRoute><UsuariosEdit /></ProtectedRoute>} />
                <Route path="/usuarios/view/:id" element={<ProtectedRoute><Usuarios_view /></ProtectedRoute>} />
                <Route path="/usuarios/:id/treinos" element={<ProtectedRoute><TreinosForm /></ProtectedRoute>} />
                <Route path="/academias" element={<ProtectedRoute><Academias_new /></ProtectedRoute>} />
                <Route path="/academias_login" element={<Academias_login />} />
                <Route path="/exercicios_new" element={<ProtectedRoute><Exercicios_new /></ProtectedRoute>} />
                <Route path="/exercicios" element={<ProtectedRoute><Exercicios_tabela /></ProtectedRoute>} />
                <Route path="/treinos/:treinoId/exercicios" element={<ProtectedRoute><Exercicios_index /></ProtectedRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/nova_senha/:token" element={<ResetPassword />} />
            </Routes>
        </>
    );
}

export default App;
