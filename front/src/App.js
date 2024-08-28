import logo from './logo.svg';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import Usuarios_index from './views/usuarios/Usuarios_index'
import Usuarios_new from "./views/usuarios/Usuarios_new";
import Login from "./views/login";
import Home from "./views/home";
import UsuariosEdit from './views/usuarios/Usuarios_edit';
import Academias_new from "./views/academias/Academias_new";
import ForgotPassword from "./views/usuarios/Forgot_password";
import ResetPassword from "./views/usuarios/Reset_password";
import './App.css';

function App() {
  return (
      <Router>
        <Routes>
            <Route path="/usuarios" element={<Usuarios_index />} />
            <Route path="/sign-in" element={<Usuarios_new />} />
            <Route path="/" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/usuarios/edit/:id" element={<UsuariosEdit/>} />
            <Route path="/academias" element={<Academias_new/>}/>
            <Route path="/forgot-password" element={<ForgotPassword/>}/>
            <Route path="/nova_senha/:token" element={<ResetPassword/>}/>

        </Routes>
      </Router>
  );
}

export default App;
