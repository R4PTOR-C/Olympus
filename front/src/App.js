import logo from './logo.svg';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import Usuarios_index from './views/usuarios/Usuarios_index'
import Usuarios_new from "./views/usuarios/Usuarios_new";
import Login from "./views/login";
import Home from "./views/home";
import './App.css';

function App() {
  return (
      <Router>
        <Routes>
            <Route path="/usuarios" element={<Usuarios_index />} />
            <Route path="/sign-in" element={<Usuarios_new />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
        </Routes>
      </Router>
  );
}

export default App;
