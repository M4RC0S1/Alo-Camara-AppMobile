import { Router } from 'express';
import type { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import type { Db } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const TIPO_TO_DB = { Sessão: 'SESSAO', Audiência: 'AUDIENCIA', Comissão: 'COMISSAO' } as const;
const TIPO_FROM_DB = Object.fromEntries(Object.entries(TIPO_TO_DB).map(([k, v]) => [v, k]));

const querySchema = z.object({
  tipo: z.enum(['Sessão', 'Audiência', 'Comissão']).optional(),
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(), // ex.: 2026-02
});

export function eventosRoutes(db: Db) {
  const r = Router();
  r.use(requireAuth);

  // data_evento + hora_evento (colunas separadas no banco) -> data_hora "YYYY-MM-DDTHH:MM" da API
  r.get('/', async (req, res) => {
    const { tipo, mes } = querySchema.parse(req.query);
    const tipoDb = tipo ? TIPO_TO_DB[tipo] : null;
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, titulo, descricao, tipo, local_evento AS local, participantes,
              CONCAT(DATE_FORMAT(data_evento, '%Y-%m-%d'), 'T', TIME_FORMAT(hora_evento, '%H:%i')) AS data_hora
       FROM eventos
       WHERE (? IS NULL OR tipo = ?) AND (? IS NULL OR DATE_FORMAT(data_evento, '%Y-%m') = ?)
       ORDER BY data_evento, hora_evento, id`,
      [tipoDb, tipoDb, mes ?? null, mes ?? null],
    );
    res.json(rows.map(e => ({ ...e, tipo: TIPO_FROM_DB[e.tipo] ?? e.tipo })));
  });

  return r;
}
