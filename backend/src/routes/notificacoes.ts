import { Router } from 'express';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { Db } from '../db.js';
import { HttpError } from '../http.js';
import { requireAuth } from '../middleware/auth.js';
import { parseId } from './chamados.js';

export function notificacoesRoutes(db: Db) {
  const r = Router();
  r.use(requireAuth);

  r.get('/', async (req, res) => {
    const soNaoLidas = req.query.lida === 'false';
    const [rows] = await db.query(
      `SELECT id, usuario_id AS user_id, protocolo_id, tipo, titulo, descricao AS mensagem, lida, criado_em AS created_at
       FROM notificacoes WHERE usuario_id = ? ${soNaoLidas ? 'AND lida = FALSE' : ''} ORDER BY criado_em DESC, id DESC`,
      [req.auth!.id],
    );
    res.json(rows);
  });

  r.post('/marcar-todas-lidas', async (req, res) => {
    const [r2] = await db.query<ResultSetHeader>('UPDATE notificacoes SET lida = TRUE WHERE usuario_id = ? AND lida = FALSE', [req.auth!.id]);
    res.json({ atualizadas: r2.affectedRows });
  });

  r.patch('/:id/lida', async (req, res) => {
    // existência checada à parte: affectedRows seria 0 também para notificação já lida
    const id = parseId(req.params.id);
    const [rows] = await db.query<RowDataPacket[]>('SELECT 1 FROM notificacoes WHERE id = ? AND usuario_id = ?', [id, req.auth!.id]);
    if (!rows.length) throw new HttpError(404, 'Notificação não encontrada');
    await db.query('UPDATE notificacoes SET lida = TRUE WHERE id = ?', [id]);
    res.status(204).end();
  });

  return r;
}
