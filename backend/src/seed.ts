import bcrypt from 'bcryptjs';
import { openDb, type Db } from './db.js';

const vereadores = [
  ['Maria Silva Santos', 'Partido A', 'Centro'],
  ['João Pedro Costa', 'Partido B', 'Norte'],
  ['Ana Carolina Lima', 'Partido C', 'Sul'],
  ['Carlos Alberto Souza', 'Partido D', 'Leste'],
  ['Beatriz Oliveira', 'Partido E', 'Oeste'],
];
// [titulo, data, hora, local, participantes, tipo]
const eventos = [
  ['Sessão Ordinária da Câmara', '2026-02-27', '14:00:00', 'Plenário Principal', 15, 'SESSAO'],
  ['Audiência Pública - Transporte', '2026-02-28', '09:00:00', 'Auditório', 45, 'AUDIENCIA'],
  ['Comissão de Infraestrutura', '2026-03-01', '10:00:00', 'Sala de Reuniões 2', 8, 'COMISSAO'],
];

const isEmpty = async (db: Db, table: string) => {
  const [rows] = await db.query(`SELECT COUNT(*) AS n FROM ${table}`);
  return (rows as { n: number }[])[0].n === 0;
};

// Idempotente: só popula tabelas vazias e ignora admin já existente.
export async function seed(db: Db, admin?: { email: string; password: string }) {
  if (await isEmpty(db, 'vereadores')) {
    await db.query('INSERT INTO vereadores (nome, partido, regiao) VALUES ?', [vereadores]);
  }
  if (await isEmpty(db, 'eventos')) {
    await db.query('INSERT INTO eventos (titulo, data_evento, hora_evento, local_evento, participantes, tipo) VALUES ?', [eventos]);
  }
  if (admin) {
    await db.query(
      `INSERT INTO usuarios (perfil_id, nome, email, senha_hash)
       SELECT p.id, 'Prefeitura', ?, ? FROM perfis p WHERE p.nome = 'ADMIN'
       ON DUPLICATE KEY UPDATE email = usuarios.email`,
      [admin.email.toLowerCase(), bcrypt.hashSync(admin.password, 10)],
    );
  }
}

if (process.argv[1]?.endsWith('seed.ts')) {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) throw new Error('Defina ADMIN_EMAIL e ADMIN_PASSWORD (veja .env.example)');
  const db = await openDb();
  await seed(db, { email, password });
  await db.end();
  console.log(`Seed concluído. Admin: ${email}`);
}
