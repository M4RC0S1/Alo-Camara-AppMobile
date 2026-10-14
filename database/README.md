# Banco de Dados - Alô Câmara
banco de dados MySQL do projeto alocamara

Banco de dados do projeto **Alô Câmara**, desenvolvido para armazenar e organizar os dados utilizados pelo aplicativo mobile, sistema web e painel administrativo.

O banco foi desenvolvido em **MySQL** e modelado utilizando o **MySQL Workbench**.

## Tecnologias

- MySQL 8
- MySQL Workbench
- SQL
- Modelo EER

## Estrutura do Repositório

```text
Banco_AloCamara/
├── schema.sql
├── alo_camara_EER.mwb
├── der/
│   ├── alo_camara_eer.png
│   └── alo_camara_eer.pdf
└── README.md
```

Banco de Dados
Nome do banco:
alo_camara

O banco utiliza:
```text
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci
```
para permitir o armazenamento correto de caracteres especiais, acentos e outros caracteres Unicode.

Tabelas
O banco possui 14 tabelas:
- perfis
- usuarios
- provedores_externos
- configuracoes_usuario
- vereadores
- avaliacoes
- manifestacoes
- protocolos
- historico_protocolos
- respostas_protocolos
- eventos
- solicitacoes_reuniao
- notificacoes
- historico_camara
Principais relacionamentos
Usuários
Os usuários podem:
- criar manifestações;
- avaliar vereadores;
- receber notificações;
- solicitar reuniões;
- possuir configurações de conta;
- utilizar autenticação externa.
Vereadores
Os vereadores podem estar relacionados a:
- avaliações;
- manifestações;
- protocolos;
- solicitações de reunião;
- registros do histórico da Câmara.
Manifestações
Uma manifestação pode ser:
- Solicitação
- Reclamação
- Sugestão
- Denúncia
- Elogio
Cada manifestação pode gerar um protocolo para acompanhamento.
Protocolos
Os protocolos permitem acompanhar o andamento das manifestações.
Os principais status são:
```text
RECEBIDO
EM_ANALISE
EM_ANDAMENTO
RESPONDIDO
FINALIZADO
```

O sistema também mantém o histórico das alterações de status e as respostas oficiais relacionadas ao protocolo.
Diagrama EER
O modelo do banco pode ser visualizado nos arquivos:
```text
der/alo_camara_eer.png
der/alo_camara_eer.pdf
```
O arquivo editável do MySQL Workbench está disponível em:
```text
alo_camara_EER.mwb
```
Como criar o banco
1. Instale o MySQL Server e o MySQL Workbench.
2. Abra o MySQL Workbench.
3. Conecte-se ao servidor MySQL.
4. Abra o arquivo:
schema.sql

5. Execute o script completo.
O script criará automaticamente o banco:
alo_camara

e todas as tabelas e relacionamentos necessários.
Arquivo principal
O arquivo:
schema.sql

contém toda a estrutura necessária para recriar o banco de dados.
Ele inclui:
- criação do banco;
- criação das tabelas;
- chaves primárias;
- chaves estrangeiras;
- restrições;
- índices;
- relacionamentos.
Projeto
Este banco foi desenvolvido para ser utilizado de forma centralizada pelo:

```text

Aplicativo Mobile
       │
       │
       ▼
Backend / API
       │
       ▼
    MySQL
       ▲
       │
       │
Site Web + Painel Administrativo

```

Os frontends não devem acessar diretamente o banco de dados. A comunicação deve ocorrer através do backend/API.

Autor

Nicolas Z. Grecco
