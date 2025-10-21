const express = require('express');
const db = require('./db'); // ajuste o caminho conforme sua estrutura
const router = express.Router();

// GET - lista todos os professores
router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query(`
      SELECT 
        u.id AS usuario_id,
        u.nome,
        u.avatar,
        p.cref,
        p.especialidade,
        p.experiencia,
        p.descricao,
        p.preco_hora,
        p.cidade,
        p.estado,
        p.contato
      FROM professores p
      JOIN usuarios u ON u.id = p.usuario_id
      ORDER BY p.data_cadastro DESC;
    `);
        res.json(rows);
    } catch (err) {
        console.error('Erro ao listar professores:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// GET - professor por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows } = await db.query(`
      SELECT 
        u.id AS usuario_id,
        u.nome,
        u.avatar,
        p.*
      FROM professores p
      JOIN usuarios u ON u.id = p.usuario_id
      WHERE u.id = $1
    `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Professor não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Erro ao buscar professor:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// POST - cria perfil de professor
router.post('/', async (req, res) => {
    const { usuario_id, cref, especialidade, experiencia, descricao, preco_hora, cidade, estado, contato } = req.body;

    try {
        const result = await db.query(`
      INSERT INTO professores 
      (usuario_id, cref, especialidade, experiencia, descricao, preco_hora, cidade, estado, contato)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *;
    `, [usuario_id, cref, especialidade, experiencia, descricao, preco_hora, cidade, estado, contato]);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar professor:', err);
        res.status(500).json({ error: 'Erro ao criar perfil de professor' });
    }
});

// PUT - atualiza perfil de professor
router.put('/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    const { cref, especialidade, experiencia, descricao, preco_hora, cidade, estado, contato } = req.body;

    try {
        const result = await db.query(`
      UPDATE professores
      SET cref = $1, especialidade = $2, experiencia = $3, descricao = $4, preco_hora = $5, cidade = $6, estado = $7, contato = $8
      WHERE usuario_id = $9
      RETURNING *;
    `, [cref, especialidade, experiencia, descricao, preco_hora, cidade, estado, contato, usuario_id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Professor não encontrado' });
        }

        res.json({ message: 'Perfil atualizado com sucesso', professor: result.rows[0] });
    } catch (err) {
        console.error('Erro ao atualizar professor:', err);
        res.status(500).json({ error: 'Erro ao atualizar perfil de professor' });
    }
});

// DELETE - exclui perfil de professor
router.delete('/:usuario_id', async (req, res) => {
    const { usuario_id } = req.params;
    try {
        const result = await db.query('DELETE FROM professores WHERE usuario_id = $1 RETURNING *', [usuario_id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Professor não encontrado' });
        }
        res.json({ message: 'Perfil de professor deletado com sucesso' });
    } catch (err) {
        console.error('Erro ao excluir professor:', err);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

module.exports = router;
