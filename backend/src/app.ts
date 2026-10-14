import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ZodError } from 'zod';
import type { Db } from './db.js';
import { HttpError } from './http.js';
import { authRoutes } from './routes/auth.js';
import { chamadosRoutes } from './routes/chamados.js';
import { eventosRoutes } from './routes/eventos.js';
import { notificacoesRoutes } from './routes/notificacoes.js';
import { politicosRoutes } from './routes/politicos.js';

export function createApp(db: Db) {
  const app = express();
  app.use(helmet(), cors(), express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api/auth', authRoutes(db));
  app.use('/api/chamados', chamadosRoutes(db));
  app.use('/api/politicos', politicosRoutes(db));
  app.use('/api/eventos', eventosRoutes(db));
  app.use('/api/notificacoes', notificacoesRoutes(db));

  app.use((_req, _res, next) => next(new HttpError(404, 'Rota não encontrada')));

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
    if (err instanceof ZodError) {
      return void res.status(400).json({ error: 'Dados inválidos', detalhes: err.issues.map(i => ({ campo: i.path.join('.'), mensagem: i.message })) });
    }
    if (err?.type === 'entity.parse.failed') return void res.status(400).json({ error: 'JSON inválido' });
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  };
  app.use(onError);
  return app;
}
