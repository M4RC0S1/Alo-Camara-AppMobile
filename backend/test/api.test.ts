import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { openDb, resetData, type Db } from '../src/db.js';
import { seed } from '../src/seed.js';

let app: ReturnType<typeof createApp>;

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
async function register(email: string) {
  const r = await request(app).post('/api/auth/register').send({ name: 'Fulano', email, password: 'senha1234' });
  return r.body.token as string;
}
async function adminToken() {
  const r = await request(app).post('/api/auth/login').send({ email: 'admin@x.gov', password: 'admin1234' });
  return r.body.token as string;
}
const chamado = { tipo: 'Solicitação', titulo: 'Reparo de calçada', endereco: 'Rua das Flores', descricao: 'Trecho danificado' };

// Usa um banco MySQL dedicado (nunca o de desenvolvimento), criado a partir do database/schema.sql
let db: Db;
beforeAll(async () => {
  db = await openDb({ ...config.db, database: process.env.DB_TEST_NAME ?? 'alo_camara_test' });
});
afterAll(() => db.end());

beforeEach(async () => {
  await resetData(db);
  await seed(db, { email: 'admin@x.gov', password: 'admin1234' });
  app = createApp(db);
});

describe('auth', () => {
  it('cadastra, loga e rejeita e-mail duplicado ou senha errada', async () => {
    await register('a@x.com');
    expect((await request(app).post('/api/auth/register').send({ name: 'Fulano', email: 'A@x.com', password: 'senha1234' })).status).toBe(409);
    expect((await request(app).post('/api/auth/login').send({ email: 'a@x.com', password: 'errada' })).status).toBe(401);
    const ok = await request(app).post('/api/auth/login').send({ email: 'a@x.com', password: 'senha1234' });
    expect(ok.status).toBe(200);
    expect(ok.body.user.role).toBe('user');
    expect(ok.body.user.password_hash).toBeUndefined();
  });

  it('valida entrada e exige token', async () => {
    expect((await request(app).post('/api/auth/register').send({ name: 'F', email: 'x', password: '1' })).status).toBe(400);
    expect((await request(app).get('/api/chamados')).status).toBe(401);
  });
});

describe('chamados', () => {
  it('cidadão cria e só vê os próprios; admin vê todos', async () => {
    const a = await register('a@x.com');
    const b = await register('b@x.com');
    const criado = await request(app).post('/api/chamados').set(auth(a)).send(chamado);
    expect(criado.status).toBe(201);
    expect(criado.body.protocolo).toMatch(/^AL\d{4}0001$/);
    expect(criado.body.status).toBe('Em análise');

    expect((await request(app).get('/api/chamados').set(auth(b))).body).toHaveLength(0);
    expect((await request(app).get(`/api/chamados/${criado.body.id}`).set(auth(b))).status).toBe(404);
    expect((await request(app).get('/api/chamados').set(auth(await adminToken()))).body).toHaveLength(1);
  });

  it('admin responde, muda status e o cidadão é notificado', async () => {
    const a = await register('a@x.com');
    const { body } = await request(app).post('/api/chamados').set(auth(a)).send(chamado);
    const admin = await adminToken();

    expect((await request(app).post(`/api/chamados/${body.id}/respostas`).set(auth(a)).send({ mensagem: 'oi' })).status).toBe(403);
    const resp = await request(app).post(`/api/chamados/${body.id}/respostas`).set(auth(admin)).send({ mensagem: 'Equipe a caminho' });
    expect(resp.status).toBe(201);
    expect(resp.body.status).toBe('Respondido');
    await request(app).patch(`/api/chamados/${body.id}/status`).set(auth(admin)).send({ status: 'Concluído' }).expect(200);

    const detalhe = await request(app).get(`/api/chamados/${body.id}`).set(auth(a));
    expect(detalhe.body.status).toBe('Concluído');
    expect(detalhe.body.respostas).toHaveLength(1);

    const notifs = (await request(app).get('/api/notificacoes').set(auth(a))).body;
    expect(notifs).toHaveLength(2);
    await request(app).post('/api/notificacoes/marcar-todas-lidas').set(auth(a)).expect(200);
    expect((await request(app).get('/api/notificacoes?lida=false').set(auth(a))).body).toHaveLength(0);
  });

  it('admin não abre chamados e status inválido é rejeitado', async () => {
    expect((await request(app).post('/api/chamados').set(auth(await adminToken())).send(chamado)).status).toBe(403);
    const a = await register('a@x.com');
    const { body } = await request(app).post('/api/chamados').set(auth(a)).send(chamado);
    expect((await request(app).patch(`/api/chamados/${body.id}/status`).set(auth(await adminToken())).send({ status: 'Foo' })).status).toBe(400);
  });
});

describe('políticos e agenda', () => {
  it('lista com filtros e calcula média das avaliações (uma por cidadão)', async () => {
    const a = await register('a@x.com');
    const b = await register('b@x.com');
    expect((await request(app).get('/api/politicos?regiao=Centro').set(auth(a))).body).toHaveLength(1);
    expect((await request(app).get('/api/politicos?q=ana').set(auth(a))).body).toHaveLength(1);

    await request(app).put('/api/politicos/1/avaliacao').set(auth(a)).send({ nota: 5 }).expect(200);
    await request(app).put('/api/politicos/1/avaliacao').set(auth(a)).send({ nota: 3 }).expect(200);
    const r = await request(app).put('/api/politicos/1/avaliacao').set(auth(b)).send({ nota: 4 });
    expect(r.body.media).toBe(3.5);
    expect(r.body.total_avaliacoes).toBe(2);
    expect((await request(app).put('/api/politicos/1/avaliacao').set(auth(a)).send({ nota: 9 })).status).toBe(400);
    expect((await request(app).get('/api/politicos/99').set(auth(a))).status).toBe(404);
  });

  it('lista eventos filtrando por tipo e mês', async () => {
    const a = await register('a@x.com');
    expect((await request(app).get('/api/eventos').set(auth(a))).body).toHaveLength(3);
    expect((await request(app).get('/api/eventos?mes=2026-03').set(auth(a))).body).toHaveLength(1);
    expect((await request(app).get('/api/eventos?tipo=Sessão').set(auth(a))).body).toHaveLength(1);
  });
});
