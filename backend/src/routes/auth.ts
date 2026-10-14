import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { isDuplicate, tx, type Db } from '../db.js';
import { HttpError } from '../http.js';
import { requireAuth, signToken, type Role } from '../middleware/auth.js';

type UserRow = RowDataPacket & { id: number; name: string; email: string; password_hash: string | null; role: Role; ativo: number };

const publicUser = (u: UserRow) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// usuarios + perfis -> contrato da API (name/role)
const SELECT_USER = `SELECT u.id, u.nome AS name, u.email, u.senha_hash AS password_hash, u.ativo,
                            CASE WHEN p.nome = 'ADMIN' THEN 'admin' ELSE 'user' END AS role
                     FROM usuarios u JOIN perfis p ON p.id = u.perfil_id`;

const email = z.email().transform(e => e.toLowerCase());
const registerSchema = z.object({ name: z.string().trim().min(2).max(150), email: email.pipe(z.string().max(150)), password: z.string().min(8).max(72) });
const loginSchema = z.object({ email, password: z.string().min(1) });
const profileSchema = z.object({ name: z.string().trim().min(2).max(150).optional(), email: email.pipe(z.string().max(150)).optional() });

export function authRoutes(db: Db) {
  const r = Router();

  // Cadastro público: sempre cria cidadão. Administradores são criados via `npm run seed`.
  r.post('/register', async (req, res) => {
    const d = registerSchema.parse(req.body);
    let id: number;
    try {
      id = await tx(db, async c => {
        const [ins] = await c.query<ResultSetHeader>(
          "INSERT INTO usuarios (perfil_id, nome, email, senha_hash) SELECT id, ?, ?, ? FROM perfis WHERE nome = 'CIDADAO'",
          [d.name, d.email, bcrypt.hashSync(d.password, 10)],
        );
        if (!ins.insertId) throw new HttpError(500, "Perfil 'CIDADAO' inexistente: aplique o schema do banco");
        await c.query('INSERT INTO configuracoes_usuario (usuario_id) VALUES (?)', [ins.insertId]);
        return ins.insertId;
      });
    } catch (e) {
      if (isDuplicate(e)) throw new HttpError(409, 'E-mail já cadastrado');
      throw e;
    }
    res.status(201).json({ token: signToken({ id, role: 'user' }), user: { id, name: d.name, email: d.email, role: 'user' } });
  });

  r.post('/login', async (req, res) => {
    const d = loginSchema.parse(req.body);
    const [rows] = await db.query<UserRow[]>(`${SELECT_USER} WHERE u.email = ?`, [d.email]);
    const u = rows[0];
    // senha_hash é nula para contas criadas só por login externo (Google/gov.br)
    if (!u || !u.password_hash || !bcrypt.compareSync(d.password, u.password_hash)) throw new HttpError(401, 'E-mail ou senha inválidos');
    if (!u.ativo) throw new HttpError(403, 'Conta desativada');
    res.json({ token: signToken({ id: u.id, role: u.role }), user: publicUser(u) });
  });

  r.get('/me', requireAuth, async (req, res) => {
    const [rows] = await db.query<UserRow[]>(`${SELECT_USER} WHERE u.id = ?`, [req.auth!.id]);
    if (!rows[0]) throw new HttpError(401, 'Usuário não encontrado');
    res.json(publicUser(rows[0]));
  });

  r.patch('/me', requireAuth, async (req, res) => {
    const d = profileSchema.parse(req.body);
    const id = req.auth!.id;
    try {
      await db.query('UPDATE usuarios SET nome = COALESCE(?, nome), email = COALESCE(?, email) WHERE id = ?', [d.name ?? null, d.email ?? null, id]);
    } catch (e) {
      if (isDuplicate(e)) throw new HttpError(409, 'E-mail já cadastrado');
      throw e;
    }
    const [rows] = await db.query<UserRow[]>(`${SELECT_USER} WHERE u.id = ?`, [id]);
    if (!rows[0]) throw new HttpError(401, 'Usuário não encontrado');
    res.json(publicUser(rows[0]));
  });

  return r;
}
