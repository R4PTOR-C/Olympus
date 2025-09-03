import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../AuthContext';
import CropAvatar from "../components/CropAvatar";
import ModalCarregando from '../components/ModalCarregando';
import ModalEdicaoCampo from '../components/ModalEdicaoCampo';
import '../../styles/UsuariosEdit.css';

const UsuariosEdit = () => {
    const { id } = useParams();
    const { updateUser } = useContext(AuthContext);

    const [usuario, setUsuario] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showCropper, setShowCropper] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [campoEditando, setCampoEditando] = useState(null);

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`)
            .then(async response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return response.json();
            })
            .then(data => {
                const { funcao, ...dadosUsuario } = data;
                setUsuario(dadosUsuario);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.toString());
                setLoading(false);
            });
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 5 * 1024 * 1024) {
            alert("A imagem deve ter no máximo 5MB.");
            return;
        }
        setSelectedFile(file);
        setShowCropper(true);
    };

    const handleCropped = async (croppedBlob) => {
        const file = new File([croppedBlob], 'avatar.jpeg', { type: 'image/jpeg' });
        setAvatar(file);
        setShowCropper(false);

        // salvar avatar direto
        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, {
                method: 'PUT',
                body: formData,
            });
            if (!res.ok) throw new Error("Erro ao atualizar avatar");
            const data = await res.json();

            setUsuario(prev => ({ ...prev, avatar: data.usuario.avatar }));
            updateUser && updateUser({
                userName: data.usuario.nome,
                avatar: data.usuario.avatar
            });
        } catch (err) {
            console.error(err);
            setError(err.toString());
        }
    };

    const handleSalvarCampo = async (campo, valor) => {
        try {
            // Atualiza localmente só o campo editado
            setUsuario(prev => ({ ...prev, [campo]: valor }));

            const formData = new FormData();
            formData.append(campo, valor);

            const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/usuarios/${id}`, {
                method: "PUT", // funciona porque seu backend trata agora como PATCH-like
                body: formData,
            });

            if (!res.ok) throw new Error("Erro ao atualizar usuário");
            const data = await res.json();

            // Atualiza contexto (caso nome/avatar mudem)
            updateUser && updateUser({
                userName: data.usuario.nome,
                avatar: data.usuario.avatar,
            });
        } catch (err) {
            console.error(err);
            setError(err.toString());
        } finally {
            setCampoEditando(null);
        }
    };




    if (loading) return <ModalCarregando show={true} />;
    if (error) return <div className="alert alert-danger">Erro: {error}</div>;
    if (!usuario) return null;

    const avatarUrl = avatar
        ? URL.createObjectURL(avatar)
        : usuario.avatar || null;

    // ...
    const dadosPessoais = [
        { name: 'nome', label: 'Nome', tipo: 'text' },
        { name: 'email', label: 'Email', tipo: 'email'}, // 🔹 agora só visualização
        { name: 'genero', label: 'Gênero', tipo: 'select', options: ['Masculino', 'Feminino', 'Outro'] },
        { name: 'data_nascimento', label: 'Data de nascimento', tipo: 'date' }, // 🔹 mantido, mas formatado
        { name: 'telefone', label: 'Telefone', tipo: 'tel' },
    ];
// ...

// função para formatar datas
    const formatarData = (dataStr) => {
        if (!dataStr) return 'Não informado';
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    };

    const formatarTelefone = (numero) => {
        if (!numero) return 'Não informado';

        // remove tudo que não for número
        const digitos = numero.replace(/\D/g, '');

        // casos: 10 dígitos (fixo) ou 11 dígitos (celular)
        if (digitos.length === 10) {
            return digitos.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else if (digitos.length === 11) {
            return digitos.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }

        // se não bater com padrão esperado, retorna cru
        return numero;
    };




    const infoCorporal = [
        { name: 'altura', label: 'Altura (cm)', tipo: 'number' },
        { name: 'peso', label: 'Peso (kg)', tipo: 'number' },
        { name: 'objetivo', label: 'Objetivo', tipo: 'select', options: ['Emagrecimento', 'Hipertrofia', 'Condicionamento físico'] },
    ];



    return (
        <div className="container mt-3 mb-5 usuarios-edit">
            <h2 className="text-center mb-4">Editar perfil</h2>

            {/* Avatar */}
            <div className="d-flex justify-content-center mb-4 position-relative">
                <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="rounded-circle shadow"
                    style={{ width: 120, height: 120, objectFit: 'cover' }}
                />
                <button
                    type="button"
                    className="btn btn-light border position-absolute bottom-0 start-50 translate-middle-x"
                    style={{ borderRadius: '50%', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                    onClick={() => document.getElementById('avatar-input').click()}
                    title="Editar avatar"
                >
                    <i className="bi bi-pencil"></i>
                </button>
                <input
                    type="file"
                    id="avatar-input"
                    onChange={handleFileChange}
                    className="d-none"
                    accept="image/*"
                />
            </div>

            {showCropper && selectedFile && (
                <CropAvatar
                    file={selectedFile}
                    onCropped={handleCropped}
                    onClose={() => setShowCropper(false)}
                />
            )}

            {/* Card Dados Pessoais */}
            <div className="card card-section">
                <div className="card-header-custom">
                    <i className="bi bi-person-circle me-2"></i> Dados pessoais
                </div>
                {dadosPessoais.map(campo => (
                    <div
                        key={campo.name}
                        className={`field-row ${campo.readOnly ? '' : 'clickable'}`}
                        onClick={() => !campo.readOnly && setCampoEditando(campo)} // 🔹 só abre modal se não for readOnly
                    >
                        <span className="fw-bold">{campo.label}</span>
                        <span>
            {campo.name === 'data_nascimento'
                ? formatarData(usuario[campo.name])
                : campo.name === 'telefone'
                    ? formatarTelefone(usuario[campo.name])
                    : usuario[campo.name] || 'Não informado'}
                        </span>
                    </div>
                ))}

            </div>

            {/* Card Informações Corporais */}
            <div className="card card-section mt-4">
                <div className="card-header-custom">
                    <i className="bi bi-activity me-2"></i> Informações corporais
                </div>
                {infoCorporal.map(campo => (
                    <div
                        key={campo.name}
                        className="field-row clickable"
                        onClick={() => setCampoEditando(campo)}
                    >
                        <span className="fw-bold">{campo.label}</span>
                        <span>{usuario[campo.name] || 'Não informado'}</span>
                    </div>
                ))}
            </div>

            {/* Modal edição campo */}
            {campoEditando && (
                <ModalEdicaoCampo
                    campo={campoEditando}
                    valorAtual={usuario[campoEditando.name]}
                    onClose={() => setCampoEditando(null)}
                    onSave={handleSalvarCampo}
                />
            )}
        </div>
    );
};

export default UsuariosEdit;
