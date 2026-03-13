import { useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';

/**
 * Escuta o evento 'atualizar_tela' do socket do usuário
 * e chama o callback quando receber.
 * @param {Function} callback - função a executar (ex: recarregar dados)
 */
export default function useSocketRefresh(callback) {
    const { socket } = useContext(AuthContext);

    useEffect(() => {
        if (!socket) return;
        socket.on('atualizar_tela', callback);
        return () => socket.off('atualizar_tela', callback);
    }, [socket, callback]);
}
