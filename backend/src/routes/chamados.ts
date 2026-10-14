import { Router } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { tx, type Db } from '../db.js';
import { HttpError } from '../http.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

// A API expõe "chamados"; no banco eles são manifestacoes + protocolos.
const STATUS = ['Em análise', 'Respondido', 'Concluído'] as const;
type Status = (typeof STATUS)[number];

const STATUS_TO_DB: Record<Status, string> = { 'Em análise': 'EM_ANALISE', Respondido: 'RESPONDIDO', Concluído: 'FINALIZADO' };
const STATUS_FROM_DB: Record<string, Status> = {
  RECEBIDO: 'Em análise',
  EM_ANALISE: 'Em análise',
  EM_ANDAMENTO: 'Em análise',
  RESPONDIDO: 'Respondido',
  FINALIZADO: 'Concluído',
};
const DB_STATUSES_OF = (s: Status) => Object.entries(STATUS_FROM_DB).filter(([, v]) => v === s).map(([k]) => k);

const TIPOS = ['Solicitação', 'Reclamação', 'Sugestão', 'Denúncia', 'Elogio'] as const;
const TIPO_TO_DB: Record<(typeof TIPOS)[number], string> = { Solicitação: 'SOLICITACAO', Reclamação: 'RECLAMACAO', Sugestão: 'SUGESTAO', Denúncia: 'DENUNCIA', Elogio: 'ELOGIO' };
const TIPO_FROM_DB = Object.fromEntries(Object.entries(TIPO_TO_DB).map(([k, v]) => [v, k]));

const createSchema = z.object({
  tipo: z.enum(TIPOS),
  titulo: z.string().trim().min(3).max(200),
  endereco: z.string().trim().min(1).max(255),
  descricao: z.string().trim().min(5),
});
const respostaSchema = z.object({ mensagem: z.string().trim().min(1), status: z.enum(STATUS).optional() });
const statusSchema = z.object({ status: z.enum(STATUS) });

type Row = RowDataPacket & { id: number; protocolo_id: number; user_id: number; status: string; tipo: string; protocolo: string };

const SELECT_CHAMADO = `SELECT m.id, p.id AS protocolo_id, p.numero AS protocolo, m.usuario_id AS user_id, m.tipo, m.assunto AS titulo,
                               m.endereco, m.descricao, p.status, m.criado_em AS created_at, p.atualizado_em AS updated_at, u.nome AS cidadao
                        FROM manifestacoes m
                        JOIN protocolos p ON p.manifestacao_id = m.id
                        JOIN usuarios u ON u.id = m.usuario_id`;

const present = ({ protocolo_id: _p, ...c }: Row) => ({ ...c, tipo: TIPO_FROM_DB[c.tipo] ?? c.tipo, status: STATUS_FROM_DB[c.status] ?? c.status });

export const parseId = (v: unknown) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < 1) throw new HttpError(400, 'ID inválido');
  return n;
};

export function chamadosRoutes(db: Db) {
  const r = Router();
  r.use(requireAuth);

  const load = async (id: number, auth: { id: number; role: string }) => {
    const [rows] = await db.query<Row[]>(`${SELECT_CHAMADO} WHERE m.id = ?`, [id]);
    const c = rows[0];
    // 404 (e não 403) para não revelar a existência de chamados de outros usuários
    if (!c || (auth.role !== 'admin' && c.user_id !== auth.id)) throw new HttpError(404, 'Chamado não encontrado');
    return c;
  };

  const notify = (c: PoolConnection, userId: number, protocoloId: number, titulo: string, descricao: string) =>
    c.query("INSERT INTO notificacoes (usuario_id, protocolo_id, tipo, titulo, descricao) VALUES (?,?,'PROTOCOLO',?,?)", [userId, protocoloId, titulo, descricao]);

  const registrarStatus = (c: PoolConnection, protocoloId: number, status: string, observacao: string | null, adminId: number | null) =>
    c.query('INSERT INTO historico_protocolos (protocolo_id, status, observacao, usuario_responsavel_id) VALUES (?,?,?,?)', [protocoloId, status, observacao, adminId]);

  // Cidadão vê os seus; administrador vê todos (filtro opcional ?status=)
  r.get('/', async (req, res) => {
    const status = req.query.status ? z.enum(STATUS).parse(req.query.status) : null;
    const where: string[] = [];
    const args: unknown[] = [];
    if (req.auth!.role !== 'admin') {
      where.push('m.usuario_id = ?');
      args.push(req.auth!.id);
    }
    if (status) {
      const dbStatuses = DB_STATUSES_OF(status);
      where.push(`p.status IN (${dbStatuses.map(() => '?').join(',')})`);
      args.push(...dbStatuses);
    }
    const [rows] = await db.query<Row[]>(`${SELECT_CHAMADO} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY m.criado_em DESC, m.id DESC`, args);
    res.json(rows.map(present));
  });

  r.post('/', requireRole('user'), async (req, res) => {
    const d = createSchema.parse(req.body);
    const id = await tx(db, async c => {
      const [m] = await c.query<ResultSetHeader>('INSERT INTO manifestacoes (usuario_id, tipo, assunto, endereco, descricao) VALUES (?,?,?,?,?)', [
        req.auth!.id,
        TIPO_TO_DB[d.tipo],
        d.titulo,
        d.endereco,
        d.descricao,
      ]);
      const numero = `AL${new Date().getFullYear()}${String(m.insertId).padStart(4, '0')}`;
      const [p] = await c.query<ResultSetHeader>("INSERT INTO protocolos (manifestacao_id, numero, status) VALUES (?,?,'RECEBIDO')", [m.insertId, numero]);
      await registrarStatus(c, p.insertId, 'RECEBIDO', 'Manifestação registrada', req.auth!.id);
      return m.insertId;
    });
    res.status(201).json(present(await load(id, req.auth!)));
  });

  r.get('/:id', async (req, res) => {
    const c = await load(parseId(req.params.id), req.auth!);
    const [respostas] = await db.query(
      `SELECT r.id, r.resposta AS mensagem, r.criado_em AS created_at, u.nome AS autor
       FROM respostas_protocolos r LEFT JOIN usuarios u ON u.id = r.usuario_responsavel_id
       WHERE r.protocolo_id = ? ORDER BY r.id`,
      [c.protocolo_id],
    );
    res.json({ ...present(c), respostas });
  });

  // Prefeitura responde; opcionalmente já atualiza o status (padrão: "Respondido")
  r.post('/:id/respostas', requireRole('admin'), async (req, res) => {
    const c = await load(parseId(req.params.id), req.auth!);
    const d = respostaSchema.parse(req.body);
    const status = d.status ?? 'Respondido';
    await tx(db, async conn => {
      await conn.query('INSERT INTO respostas_protocolos (protocolo_id, usuario_responsavel_id, resposta) VALUES (?,?,?)', [c.protocolo_id, req.auth!.id, d.mensagem]);
      await conn.query('UPDATE protocolos SET status = ? WHERE id = ?', [STATUS_TO_DB[status], c.protocolo_id]);
      await registrarStatus(conn, c.protocolo_id, STATUS_TO_DB[status], d.mensagem, req.auth!.id);
      await notify(conn, c.user_id, c.protocolo_id, 'Chamado respondido', `Seu chamado ${c.protocolo} recebeu uma resposta da prefeitura.`);
    });
    res.status(201).json(present(await load(c.id, req.auth!)));
  });

  r.patch('/:id/status', requireRole('admin'), async (req, res) => {
    const c = await load(parseId(req.params.id), req.auth!);
    const { status } = statusSchema.parse(req.body);
    await tx(db, async conn => {
      await conn.query('UPDATE protocolos SET status = ? WHERE id = ?', [STATUS_TO_DB[status], c.protocolo_id]);
      await registrarStatus(conn, c.protocolo_id, STATUS_TO_DB[status], null, req.auth!.id);
      if (status !== STATUS_FROM_DB[c.status]) await notify(conn, c.user_id, c.protocolo_id, 'Status atualizado', `Seu chamado ${c.protocolo} agora está: ${status}.`);
    });
    res.json(present(await load(c.id, req.auth!)));
  });

  return r;
}
