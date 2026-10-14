import 'dotenv/config';
import { fileURLToPath } from 'node:url';

export const config = {
  port: Number(process.env.PORT ?? 3333),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-nao-use-em-producao',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'alo_camara',
  },
  // Fonte única da verdade do modelo de dados (repositório de banco de dados)
  schemaFile: process.env.SCHEMA_FILE ?? fileURLToPath(new URL('../../database/schema.sql', import.meta.url)),
};

export type DbConfig = typeof config.db;
