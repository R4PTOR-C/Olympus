import React, { useState } from 'react';
import axios from 'axios';

function Academias_new() {
    const [nome, setNome] = useState('');
    const [cnpj, setCNPJ] = useState('');
    const [nome_dono, setNomeDono] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [cep, setCep] = useState('');
    const [logradouro, setLogradouro] = useState('');
    const [complemento, setComplemento] = useState('');
    const [unidade, setUnidade] = useState('');
    const [bairro, setBairro] = useState('');
    const [localidade, setLocalidade] = useState('');
    const [uf, setUf] = useState('');

    // Função para buscar endereço pelo CEP
    const handleCepChange = async (e) => {
        const cepValue = e.target.value.replace(/\D/g, ''); // Remove qualquer caractere que não seja número
        setCep(cepValue);

        if (cepValue.length === 8) {
            try {
                const response = await axios.get(`https://viacep.com.br/ws/${cepValue}/json/`);
                if (response.data.erro) {
                    alert('CEP não encontrado.');
                } else {
                    const { logradouro, complemento, bairro, localidade, uf } = response.data;
                    setLogradouro(logradouro);
                    setComplemento(complemento);
                    setBairro(bairro);
                    setLocalidade(localidade);
                    setUf(uf);
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
                alert('Erro ao buscar CEP.');
            }
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const academia = { nome, cnpj, nome_dono, email, senha, cep, logradouro, complemento, unidade, bairro, localidade, uf };

        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/academias`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(academia),
            });

            if (response.ok) {
                alert('Academia adicionada com sucesso!');
                // Resetar o formulário ou redirecionar o usuário
            } else {
                alert('Falha ao adicionar academia.');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar ao servidor.');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Adicionar Nova Academia</h2>
            <form onSubmit={handleSubmit}>

                <div className="form-group">
                    <label>Academia</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>CNPJ</label>
                    <input
                        type="text"
                        className="form-control"
                        value={cnpj}
                        onChange={(e) => setCNPJ(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Nome Completo</label>
                    <input
                        type="text"
                        className="form-control"
                        value={nome_dono}
                        onChange={(e) => setNomeDono(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete={"off"}
                        required
                    />
                </div>


                <div className="form-group">
                    <label>CEP</label>
                    <input
                        type="text"
                        className="form-control"
                        value={cep}
                        onChange={handleCepChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Logradouro</label>
                    <input
                        type="text"
                        className="form-control"
                        value={logradouro}
                        onChange={(e) => setLogradouro(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Complemento</label>
                    <input
                        type="text"
                        className="form-control"
                        value={complemento}
                        onChange={(e) => setComplemento(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Unidade</label>
                    <input
                        type="text"
                        className="form-control"
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Bairro</label>
                    <input
                        type="text"
                        className="form-control"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Localidade</label>
                    <input
                        type="text"
                        className="form-control"
                        value={localidade}
                        onChange={(e) => setLocalidade(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>UF</label>
                    <input
                        type="text"
                        className="form-control"
                        value={uf}
                        onChange={(e) => setUf(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Senha</label>
                    <input
                        type="password"
                        className="form-control"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </div>
                <button type="submit" className="btn btn-primary">Adicionar</button>
            </form>
        </div>
    );
}

export default Academias_new;
