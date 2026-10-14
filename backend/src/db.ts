import mysql, { type Pool, type PoolConnection } from 'mysql2/promise';
import { readFileSync } from 'node:fs';
import { config, type DbConfig } from './config.js';

export type Db = Pool;

const q = (name: string) => '`' + name.replace(/`/g, '``') + '`';

// Converte o schema.sql oficial em statements executáveis dentro do banco já selecionado:
// remove comentários, DROP/CREATE DATABASE, USE e as consultas de verificação do final.
export function schemaStatements(file = config.schemaFile): string[] {
  return readFileSync(file, 'utf8')
    .replace(/--.*$/gm, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !/^(DROP DATABASE|CREATE DATABASE|USE|SHOW|SELECT)\b/i.test(s));
}

export async function ensureSchema(db: Db) {
  const [rows] = await db.query('SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?', ['perfis']);
  if ((rows as unknown[]).length) return;
  for (const stmt of schemaStatements()) await db.query(stmt);
}

// Cria o banco (se preciso), abre o pool e garante que o schema existe.
export async function openDb(cfg: DbConfig = config.db): Promise<Db> {
  const { database, ...server } = cfg;
  const admin = await mysql.createConnection(server);
  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS ${q(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await admin.end();
  }
  // dateStrings: DATETIME/DATE/TIME chegam como texto, sem conversão de fuso
  const db = mysql.createPool({ ...cfg, dateStrings: true, charset: 'utf8mb4', connectionLimit: 10 });
  await ensureSchema(db);
  return db;
}

export async function tx<T>(db: Db, fn: (c: PoolConnection) => Promise<T>): Promise<T> {
  const c = await db.getConnection();
  try {
    await c.beginTransaction();
    const out = await fn(c);
    await c.commit();
    return out;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

// Apaga os dados (menos a tabela de referência `perfis`). Usado nos testes.
export async function resetData(db: Db) {
  const c = await db.getConnection();
  try {
    const [rows] = await c.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> 'perfis'");
    await c.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const { t } of rows as { t: string }[]) await c.query(`TRUNCATE TABLE ${q(t)}`);
    await c.query('SET FOREIGN_KEY_CHECKS = 1');
  } finally {
    c.release();
  }
}

export const isDuplicate = (e: unknown) => (e as { errno?: number })?.errno === 1062;
