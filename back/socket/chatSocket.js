module.exports = (io, db) => {
    io.on("connection", (socket) => {
        console.log("🟢 Usuário conectado:", socket.id);

        // sala pessoal do usuário (para atualizações de treinos, vínculos etc.)
        socket.on("entrar_sala_usuario", (userId) => {
            socket.join(`user_${userId}`);
        });

        // entrar na sala do chat
        socket.on("entrar_chat", (chatId) => {
            socket.join(`chat_${chatId}`);
            console.log(`👥 Usuário entrou na sala chat_${chatId}`);
        });

        // enviar mensagem
        socket.on("enviar_mensagem", async (msg) => {
            try {
                const { rows } = await db.query(
                    `INSERT INTO mensagens (chat_id, remetente_id, conteudo)
           VALUES ($1, $2, $3)
           RETURNING *`,
                    [msg.chat_id, msg.remetente_id, msg.conteudo]
                );

                const novaMensagem = rows[0];
                io.to(`chat_${msg.chat_id}`).emit("nova_mensagem", novaMensagem);

                // push para o destinatário
                try {
                    const { enviarPush } = require('../push');
                    const chatRes = await db.query(
                        'SELECT usuario1_id, usuario2_id FROM chats WHERE id = $1',
                        [msg.chat_id]
                    );
                    if (chatRes.rows.length) {
                        const chat = chatRes.rows[0];
                        const destinatarioId = chat.usuario1_id === msg.remetente_id
                            ? chat.usuario2_id : chat.usuario1_id;
                        const senderRes = await db.query(
                            'SELECT nome FROM usuarios WHERE id = $1', [msg.remetente_id]
                        );
                        const senderName = senderRes.rows[0]?.nome || 'Mensagem';
                        await enviarPush(destinatarioId, {
                            title: senderName,
                            body: msg.conteudo.substring(0, 100),
                            url: `/chat`
                        });
                    }
                } catch (_) { /* push é opcional */ }
            } catch (err) {
                console.error("Erro ao salvar/enviar mensagem:", err);
            }
        });

        // status digitando
        socket.on("digitando", (data) => {
            socket.to(`chat_${data.chat_id}`).emit("usuario_digitando", data.usuario_id);
        });

        socket.on("parou_digitar", (data) => {
            socket.to(`chat_${data.chat_id}`).emit("usuario_parou_digitar", data.usuario_id);
        });

        socket.on("disconnect", () => {
            console.log("🔴 Usuário desconectado:", socket.id);
        });
    });
};
