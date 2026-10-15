const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");
const { enviarPush } = require("../push");
const { existeBloqueio } = require("../middleware/auth");

const MAX_MENSAGEM = 2000;

module.exports = (io, db) => {
    // Autenticação no handshake: o cliente manda { auth: { token } }.
    // Sem token válido, a conexão é recusada.
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Não autenticado."));
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error("Token inválido."));
            socket.userId = parseInt(decoded.userId);
            next();
        });
    });

    // O usuário participa deste chat?
    const ehParticipante = async (userId, chatId) => {
        const { rows } = await db.query(
            "SELECT usuario1_id, usuario2_id FROM chats WHERE id = $1 AND (usuario1_id = $2 OR usuario2_id = $2)",
            [chatId, userId]
        );
        return rows[0] || null;
    };

    io.on("connection", (socket) => {
        // sala pessoal do usuário (para atualizações de treinos, vínculos etc.)
        socket.join(`user_${socket.userId}`);

        // Mantido por compatibilidade: o cliente antigo pede a sala pessoal
        // explicitamente. Só entra na própria, nunca na de outra pessoa.
        socket.on("entrar_sala_usuario", () => {
            socket.join(`user_${socket.userId}`);
        });

        // entrar na sala do chat (só participantes)
        socket.on("entrar_chat", async (chatId) => {
            try {
                if (await ehParticipante(socket.userId, chatId)) socket.join(`chat_${chatId}`);
            } catch (err) {
                console.error("Erro ao entrar no chat:", err.message);
            }
        });

        // enviar mensagem — o remetente é sempre o usuário autenticado
        socket.on("enviar_mensagem", async (msg) => {
            try {
                const chatId = msg?.chat_id;
                const conteudo = typeof msg?.conteudo === "string" ? msg.conteudo.trim() : "";
                if (!chatId || !conteudo || conteudo.length > MAX_MENSAGEM) return;

                const chat = await ehParticipante(socket.userId, chatId);
                if (!chat) return;

                // Bloqueio em qualquer sentido impede a conversa
                const outroId = chat.usuario1_id === socket.userId ? chat.usuario2_id : chat.usuario1_id;
                if (await existeBloqueio(socket.userId, outroId)) {
                    socket.emit("mensagem_bloqueada", { chat_id: chatId });
                    return;
                }

                const { rows } = await db.query(
                    `INSERT INTO mensagens (chat_id, remetente_id, conteudo)
                     VALUES ($1, $2, $3)
                     RETURNING *`,
                    [chatId, socket.userId, conteudo]
                );
                io.to(`chat_${chatId}`).emit("nova_mensagem", rows[0]);

                // notificação para o destinatário (opcional: falha não afeta o envio)
                try {
                    const destinatarioId = outroId;
                    const senderRes = await db.query("SELECT nome FROM usuarios WHERE id = $1", [socket.userId]);
                    const senderName = senderRes.rows[0]?.nome || "Mensagem";
                    // notifica sala pessoal (badge na navbar)
                    io.to(`user_${destinatarioId}`).emit("nova_mensagem_notif", { chatId });
                    await enviarPush(destinatarioId, {
                        title: senderName,
                        body: conteudo.substring(0, 100),
                        url: `/chat/${chatId}`
                    });
                } catch (_) { /* push é opcional */ }
            } catch (err) {
                console.error("Erro ao salvar/enviar mensagem:", err);
            }
        });

        // status digitando (só repassa para salas em que o socket está)
        socket.on("digitando", (data) => {
            const sala = `chat_${data?.chat_id}`;
            if (socket.rooms.has(sala)) socket.to(sala).emit("usuario_digitando", socket.userId);
        });

        socket.on("parou_digitar", (data) => {
            const sala = `chat_${data?.chat_id}`;
            if (socket.rooms.has(sala)) socket.to(sala).emit("usuario_parou_digitar", socket.userId);
        });
    });
};
