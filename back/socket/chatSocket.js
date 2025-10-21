module.exports = (io, db) => {
    io.on("connection", (socket) => {
        console.log("🟢 Usuário conectado:", socket.id);

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
