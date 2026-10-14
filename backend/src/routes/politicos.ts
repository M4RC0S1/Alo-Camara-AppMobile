import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import type { Db } from '../db.js';
import { HttpError } from '../http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { parseId } from './chamados.js';

const avaliacaoSchema = z.object({ nota: z.number().int().min(1).max(5), comentario: z.string().trim().max(500).optional() });

// A API expõe "políticos"; no banco são `vereadores`.
const BASE = `SELECT v.id, v.nome, v.partido, v.regiao, v.foto, v.biografia AS bio, v.email, v.telefone,
                     ROUND(AVG(a.nota), 1) AS media, COUNT(a.id) AS total_avaliacoes
              FROM vereadores v LEFT JOIN avaliacoes a ON a.vereador_id = v.id`;

// ROUND(AVG()) volta como DECIMAL (string) no driver
const present = (p: RowDataPacket) => ({ ...p, media: p.media === null ? null : Number(p.media) });

export function politicosRoutes(db: Db) {
  const r = Router();
  r.use(requireAuth);

  const find = async (id: number) => {
    const [rows] = await db.query<RowDataPacket[]>(`${BASE} WHERE v.id = ? AND v.ativo = TRUE GROUP BY v.id`, [id]);
    return rows[0] ? present(rows[0]) : undefined;
  };

  r.get('/', async (req, res) => {
    const regiao = typeof req.query.regiao === 'string' && req.query.regiao !== 'Todas' ? req.query.regiao : null;
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const [rows] = await db.query<RowDataPacket[]>(`${BASE} WHERE v.ativo = TRUE AND (? IS NULL OR v.regiao = ?) AND v.nome LIKE ? GROUP BY v.id ORDER BY v.nome`, [regiao, regiao, `%${q}%`]);
    res.json(rows.map(present));
  });

  r.get('/:id', async (req, res) => {
    const id = parseId(req.params.id);
    const p = await find(id);
    if (!p) throw new HttpError(404, 'Político não encontrado');
    const [avaliacoes] = await db.query(
      `SELECT a.id, a.nota, a.comentario, a.data_avaliacao AS created_at, u.nome AS autor
       FROM avaliacoes a JOIN usuarios u ON u.id = a.usuario_id WHERE a.vereador_id = ? ORDER BY a.data_avaliacao DESC LIMIT 50`,
      [id],
    );
    res.json({ ...p, avaliacoes });
  });

  // Uma avaliação por cidadão por vereador (UNIQUE no banco); reenviar atualiza a anterior
  r.put('/:id/avaliacao', requireRole('user'), async (req, res) => {
    const id = parseId(req.params.id);
    if (!(await find(id))) throw new HttpError(404, 'Político não encontrado');
    const d = avaliacaoSchema.parse(req.body);
    await db.query(
      `INSERT INTO avaliacoes (usuario_id, vereador_id, nota, comentario) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE nota = VALUES(nota), comentario = VALUES(comentario), data_avaliacao = CURRENT_TIMESTAMP`,
      [req.auth!.id, id, d.nota, d.comentario ?? null],
    );
    res.json(await find(id));
  });

  return r;
}
