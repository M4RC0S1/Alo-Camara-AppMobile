# Alô Câmara — projeto unificado

Reúne os três repositórios em um só:

| Pasta | Origem | Conteúdo |
|---|---|---|
| `frontend/` | repositório principal ("Interface App") | App Expo / React Native |
| `backend/` | repositório Backend (pasta `backend/`) | API Node + TypeScript + Express 5 |
| `database/` | repositório Banco de Dados | `schema.sql` (MySQL 8), diagrama EER |

O repositório "Backend" era uma cópia do app com a API dentro de `backend/`; os arquivos do app eram idênticos aos de "Interface App", então só uma cópia foi mantida em `frontend/`.

## Arquitetura

```
App (frontend/) ──HTTP──▶ API (backend/) ──mysql2──▶ MySQL (database/schema.sql)
```

O `database/schema.sql` é a **fonte única** do modelo de dados: o backend o lê para criar o banco se ele não existir, e o `docker-compose.yml` o usa para inicializar o MySQL.

## Como rodar

```bash
docker compose up -d --wait           # MySQL 8.4 com o banco alo_camara (porta 3306)

cd backend
cp .env.example .env                  # ajuste JWT_SECRET e as credenciais do admin
npm install
npm run seed                          # vereadores, agenda de exemplo e usuário admin
npm run dev                           # API em http://localhost:3333
npm test                              # integração, usa o banco separado alo_camara_test

cd ../frontend
npm install
npm start
```

Veja `backend/README.md` (endpoints e mapeamento API ↔ banco) e `database/README.md`.

## Estado da integração

- **Backend ↔ banco: integrados.** A API usa as tabelas do `schema.sql`.
- **Frontend ↔ backend: conectados.** `frontend/src/services/api.ts` concentra as chamadas; login, cadastro, chamados, vereadores/avaliações, agenda e notificações usam a API, e o painel admin (`(admin)`) lista, responde e muda o status dos chamados.
  - URL da API: `EXPO_PUBLIC_API_URL`; se ausente, usa o IP da máquina que serve o Expo na porta 3333 (`10.0.2.2` no emulador Android).
  - O token fica só em memória: fechar o app exige novo login.
  - Ainda sem backend (mostram aviso "em breve"): login Google/GOV.BR, alterar senha, solicitar reunião, preferências de notificação/tema (locais).
- O arquivo `database/alo_camara_EER.mwb` (binário do Workbench) não foi alterado e não reflete a restrição `UNIQUE (usuario_id, vereador_id)` adicionada em `avaliacoes`; reexporte o diagrama no Workbench.
