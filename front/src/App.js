// App.js
import React, { useContext, useEffect, lazy, Suspense } from 'react';
import { useSwipeNavigation } from './hooks/useSwipeNavigation';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import UsuariosIndex from './views/usuarios/Usuarios_index';
import Onboarding from "./views/usuarios/Onboarding";
import UsuariosView from "./views/usuarios/Usuarios_view";
import Login from "./views/login";
import Home from "./views/home";
import UsuariosEdit from './views/usuarios/Usuarios_edit';
import ForgotPassword from "./views/usuarios/Forgot_password";
import ResetPassword from "./views/usuarios/Reset_password";
import ExerciciosNew from "./views/exercicios/Exercicios_new";
import TreinosForm from './views/treinos/TreinosForm';
import Navbar from "./views/components/navbar";
import ExerciciosIndex from "./views/exercicios/Exercicios_index";
import ProfessorNew from "./views/professores/Professores_new";
import ExerciciosTabela from "./views/exercicios/Exercicios_tabela"
import ExerciciosEdit from "./views/exercicios/Exercicios_edit";
import TreinosEdit from "./views/treinos/Treinos_edit"
import AvaliacoesNew from "./views/avaliacoes/Avaliacoes_new";
import AvaliacoesView from "./views/avaliacoes/Avaliacoes_view";
import { AuthProvider, AuthContext } from './AuthContext';
import './App.css';
import './styles/Navbar.css'
import './styles/Usuarios.css';
import './styles/buttons.css'
import NavbarInferior from "./views/components/NavbarInferior";
import HistoricoExercicios from './views/exercicios/HistoricoExercicios';
import './imgs/muscle.gif';
import HerculesChat from "./views/hercules/HerculesChat";
import ProfessoresList from "./views/professores/ProfessoresList";
import ProcurarProfessor from "./views/professores/ProcurarProfessor";
import ProfessoresEdit from "./views/professores/Professores_edit";
import CompletarPerfilProfessor from "./views/professores/CompletarPerfilProfessor";
import HistoricoAluno from "./views/professores/HistoricoAluno";
import HistoricoAlunos from "./views/professores/HistoricoAlunos";
import ChatView from "./views/chat/ChatView";
import ChatsList from "./views/chat/ChatsList";
import CardioForm from "./views/cardio/CardioForm";
import Agua from "./views/agua/Agua";
import Progresso from "./views/gamificacao/Progresso";
import Social from "./views/social/Social";
import AmigoTreinos from "./views/social/AmigoTreinos";

// Telas de teste: só existem no build de desenvolvimento
const EH_DEV = process.env.NODE_ENV === 'development';
const TestBodyMap  = EH_DEV ? lazy(() => import("./views/test/TestBodyMap")) : null;
const BadgePreview = EH_DEV ? lazy(() => import("./views/test/BadgePreview")) : null;

// Componente para rotas protegidas
function ProtectedRoute({ children }) {
    const { loggedIn, loading } = useContext(AuthContext);
    if (loading) return null;
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
    const { loggedIn, loading, userId, darkMode } = useContext(AuthContext);

    useSwipeNavigation();

    // aplica classes no body sempre que mudar rota ou tema + reseta scroll
    useEffect(() => {
        window.scrollTo(0, 0);

        const hasChrome = loggedIn && !['/', '/sign-in'].includes(location.pathname);
        document.body.classList.toggle('with-chrome', hasChrome);
        document.body.classList.toggle('no-chrome', !hasChrome);

        if (darkMode) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.add('light-mode');
            document.body.classList.remove('dark-mode');
        }

        return () => {
            document.body.classList.remove('with-chrome', 'no-chrome');
        };
    }, [loggedIn, location.pathname, darkMode]);

    if (loading) {
        return <div className="loading-indicator">Verificando sessão...</div>;
    }

    return (
        <>
            {loggedIn && !['/', '/sign-in'].includes(location.pathname) && (
                <Navbar />
            )}

            <Routes>
                <Route path="/" element={
                    loggedIn ? <Navigate to={`/home/${userId}`} /> : <Login />
                } />
                <Route path="/sign-in" element={<Onboarding />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/sign-in_professor" element={<ProfessorNew />} />
                <Route path="/home/:id" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                <Route path="/usuarios" element={<ProtectedRoute><UsuariosIndex /></ProtectedRoute>} />
                <Route path="/usuarios/edit/:id" element={<ProtectedRoute><UsuariosEdit /></ProtectedRoute>} />
                <Route path="/exercicios/edit/:id" element={<ProtectedRoute><ExerciciosEdit /></ProtectedRoute>} />
                <Route path="/treinos/edit/:id/:treinoId" element={<ProtectedRoute><TreinosEdit /></ProtectedRoute>} />
                <Route path="/usuarios/view/:id" element={<ProtectedRoute><UsuariosView /></ProtectedRoute>} />
                <Route path="/usuarios/:id/treinos" element={<ProtectedRoute><TreinosForm /></ProtectedRoute>} />
                <Route path="/exercicios_new" element={<ProtectedRoute><ExerciciosNew /></ProtectedRoute>} />
                <Route path="/exercicios" element={<ProtectedRoute><ExerciciosTabela /></ProtectedRoute>} />
                <Route path="/historico-exercicios" element={<ProtectedRoute><HistoricoExercicios /></ProtectedRoute>} />
                <Route path="/historico-aluno/:alunoId" element={<ProtectedRoute><HistoricoAluno /></ProtectedRoute>} />
                <Route path="/historico-alunos" element={<ProtectedRoute><HistoricoAlunos /></ProtectedRoute>} />
                <Route path="/treinos/:treinoId/exercicios" element={<ProtectedRoute><ExerciciosIndex /></ProtectedRoute>} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/nova_senha/:token" element={<ResetPassword />} />
                <Route path="/avaliacoes/:id" element={<ProtectedRoute><AvaliacoesView /></ProtectedRoute>} />
                <Route path="/avaliacoes/:id/new" element={<ProtectedRoute><AvaliacoesNew /></ProtectedRoute>} />
                <Route path="/hercules" element={<ProtectedRoute><HerculesChat /></ProtectedRoute>} />
                <Route path="/professores" element={<ProtectedRoute><ProfessoresList /></ProtectedRoute>} />
                <Route path="/procurar-professor" element={<ProtectedRoute><ProcurarProfessor /></ProtectedRoute>} />
                <Route path="/professores/edit/:id" element={<ProtectedRoute><ProfessoresEdit /></ProtectedRoute>} />
                <Route path="/completar-perfil-professor" element={<ProtectedRoute><CompletarPerfilProfessor /></ProtectedRoute>} />
                <Route path="/chat/:chatId" element={<ProtectedRoute><ChatView /></ProtectedRoute>} />
                <Route path="/meus-chats" element={<ProtectedRoute><ChatsList /></ProtectedRoute>} />
                <Route path="/cardio/:id/new" element={<ProtectedRoute><CardioForm /></ProtectedRoute>} />
                {EH_DEV && <Route path="/test-body" element={<Suspense fallback={null}><TestBodyMap /></Suspense>} />}
                {EH_DEV && <Route path="/badge-preview" element={<Suspense fallback={null}><BadgePreview /></Suspense>} />}
                <Route path="/agua" element={<ProtectedRoute><Agua /></ProtectedRoute>} />
                <Route path="/progresso" element={<ProtectedRoute><Progresso /></ProtectedRoute>} />
                <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
                <Route path="/social/amigo/:amigoId" element={<ProtectedRoute><AmigoTreinos /></ProtectedRoute>} />

                {/* Qualquer outra URL volta para o início */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {loggedIn && !['/', '/sign-in'].includes(location.pathname) && <NavbarInferior />}
        </>
    );
}

export default App;
