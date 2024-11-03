import React from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import Usuarios_index from './views/usuarios/Usuarios_index'
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
import { AuthProvider } from './AuthContext';
import './App.css';

const routesWithNavbar = ["/home", "/usuarios", "/exercicios", "/academias"];

function App() {
  return (
      <AuthProvider>

      <Router>
          {routesWithNavbar.includes(window.location.pathname) && <Navbar />}
          <Routes>
            <Route path="/usuarios" element={<Usuarios_index />} />
            <Route path="/sign-in" element={<Usuarios_new />} />
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/usuarios/edit/:id" element={<UsuariosEdit/>} />
            <Route path="/usuarios/view/:id" element={<Usuarios_view />} />
            <Route path="/usuarios/:id/treinos" element={<TreinosForm />} />
            <Route path="/academias" element={<Academias_new/>}/>
            <Route path="/academias_login" element={<Academias_login/>}/>
            <Route path="/exercicios" element={<Exercicios_new />} />
            <Route path="/forgot-password" element={<ForgotPassword/>}/>
            <Route path="/nova_senha/:token" element={<ResetPassword/>}/>

        </Routes>
      </Router>
      </AuthProvider>

  );
}

export default App;
