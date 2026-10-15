import React, { useCallback, useEffect, useState } from 'react';
import { listarBloqueados, desbloquear } from '../../services/moderacao';
import '../../styles/Moderacao.css';

// Seção "Usuários bloqueados" das telas de perfil, com opção de desbloquear
export default function BloqueadosLista() {
    const [lista, setLista] = useState(null);
    const [erro, setErro]   = useState('');

    const carregar = useCallback(() => {
        listarBloqueados()
            .then(setLista)
            .catch(() => setLista([]));
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const remover = async (id) => {
        setErro('');
        try {
            await desbloquear(id);
            setLista(prev => prev.filter(u => u.id !== id));
        } catch (err) {
            setErro(err.message);
        }
    };

    if (lista === null) return null;

    return (
        <div className="md-bloqueados">
            <p className="md-bloqueados-titulo">Usuários bloqueados</p>
            {lista.length === 0 && <p className="md-vazio">Você não bloqueou ninguém.</p>}
            {lista.map(u => (
                <div key={u.id} className="md-bloqueado">
                    {u.avatar
                        ? <img src={u.avatar} alt="" />
                        : <div className="md-bloqueado-sem-foto" aria-hidden="true" />}
                    <span className="md-bloqueado-nome">{u.nome}</span>
                    <button onClick={() => remover(u.id)}>Desbloquear</button>
                </div>
            ))}
            {erro && <p className="md-erro" role="alert">{erro}</p>}
        </div>
    );
}
