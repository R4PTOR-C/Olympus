import React, { useState } from 'react';

const Avaliacoes_new = ({ usuarioId, onAvaliacaoCriada }) => {
    const [avaliacao, setAvaliacao] = useState({
        altura: '',
        peso: '',
        gordura_corporal: '',
        medicoes: '', // JSON ou texto livre para medições
    });

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setAvaliacao({ ...avaliacao, [name]: value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL}/avaliacoes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...avaliacao, usuario_id: usuarioId }),
            });

            if (!response.ok) throw new Error('Erro ao registrar avaliação.');

            const novaAvaliacao = await response.json();
            alert('Avaliação registrada com sucesso!');
            onAvaliacaoCriada(novaAvaliacao); // Atualiza a lista na tela de visualização
            setAvaliacao({ altura: '', peso: '', gordura_corporal: '', medicoes: '' }); // Limpa o formulário
        } catch (error) {
            console.error('Erro ao registrar avaliação:', error);
            alert('Erro ao registrar avaliação.');
        }
    };

    return (
        <div className="avaliacoes-new">
            <h4>Registrar Avaliação Física</h4>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Altura (em metros)</label>
                    <input
                        type="number"
                        name="altura"
                        value={avaliacao.altura}
                        onChange={handleInputChange}
                        className="form-control"
                        step="0.01"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Peso (em kg)</label>
                    <input
                        type="number"
                        name="peso"
                        value={avaliacao.peso}
                        onChange={handleInputChange}
                        className="form-control"
                        step="0.01"
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Gordura Corporal (%)</label>
                    <input
                        type="number"
                        name="gordura_corporal"
                        value={avaliacao.gordura_corporal}
                        onChange={handleInputChange}
                        className="form-control"
                        step="0.01"
                    />
                </div>
                <div className="form-group">
                    <label>Medições (em formato JSON)</label>
                    <textarea
                        name="medicoes"
                        value={avaliacao.medicoes}
                        onChange={handleInputChange}
                        className="form-control"
                        placeholder='Exemplo: {"peitoral": "100cm", "abdomen": "80cm"}'
                    ></textarea>
                </div>
                <button type="submit" className="btn btn-primary mt-3">Registrar Avaliação</button>
            </form>
        </div>
    );
};

export default Avaliacoes_new;
