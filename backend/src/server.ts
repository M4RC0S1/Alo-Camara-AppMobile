import { createApp } from './app.js';
import { config } from './config.js';
import { openDb } from './db.js';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) throw new Error('Defina JWT_SECRET em produção');

const db = await openDb();
createApp(db).listen(config.port, () => console.log(`API Alô Câmara em http://localhost:${config.port}`));
