-- Garante que acentos do script sejam lidos como UTF-8 (o cliente mysql usa latin1 por padrão em alguns ambientes)
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS alo_camara;

CREATE DATABASE alo_camara
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE alo_camara;

CREATE TABLE perfis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(255)
);

CREATE TABLE usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    perfil_id BIGINT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha_hash VARCHAR(255),
    telefone VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_usuario_perfil
        FOREIGN KEY (perfil_id)
        REFERENCES perfis(id)
);

CREATE TABLE provedores_externos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    provedor ENUM(
        'GOOGLE',
        'GOVBR'
    ) NOT NULL,
    identificador_externo VARCHAR(255) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_provedor_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_provedor_identificador
        UNIQUE (provedor, identificador_externo)
);

CREATE TABLE configuracoes_usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL UNIQUE,
    notificacao_push BOOLEAN NOT NULL DEFAULT TRUE,
    notificacao_email BOOLEAN NOT NULL DEFAULT TRUE,
    modo_escuro BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_config_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TABLE vereadores (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    partido VARCHAR(100) NOT NULL,
    regiao VARCHAR(50),
    foto VARCHAR(500),
    biografia TEXT,
    email VARCHAR(150),
    telefone VARCHAR(20),
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE avaliacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    vereador_id BIGINT NOT NULL,
    nota TINYINT NOT NULL,
    comentario TEXT,
    data_avaliacao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_avaliacao_nota
        CHECK (nota BETWEEN 1 AND 5),

    -- uma avaliação por cidadão por vereador (a API faz upsert)
    CONSTRAINT uq_avaliacao_usuario_vereador
        UNIQUE (usuario_id, vereador_id),

    CONSTRAINT fk_avaliacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_avaliacao_vereador
        FOREIGN KEY (vereador_id)
        REFERENCES vereadores(id)
);

CREATE TABLE manifestacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    vereador_id BIGINT NULL,

    tipo ENUM(
        'SOLICITACAO',
        'RECLAMACAO',
        'SUGESTAO',
        'DENUNCIA',
        'ELOGIO'
    ) NOT NULL,

    assunto VARCHAR(200),
    bairro VARCHAR(100),
    endereco VARCHAR(255),
    local_ocorrido VARCHAR(255),
    categoria VARCHAR(100),
    descricao TEXT NOT NULL,
    anexo_url VARCHAR(500),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_manifestacao_latitude
        CHECK (
            latitude IS NULL
            OR latitude BETWEEN -90 AND 90
        ),

    CONSTRAINT chk_manifestacao_longitude
        CHECK (
            longitude IS NULL
            OR longitude BETWEEN -180 AND 180
        ),

    CONSTRAINT fk_manifestacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_manifestacao_vereador
        FOREIGN KEY (vereador_id)
        REFERENCES vereadores(id)
        ON DELETE SET NULL
);

CREATE TABLE protocolos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    manifestacao_id BIGINT NOT NULL UNIQUE,
    vereador_responsavel_id BIGINT NULL,
    numero VARCHAR(30) NOT NULL UNIQUE,

    status ENUM(
        'RECEBIDO',
        'EM_ANALISE',
        'EM_ANDAMENTO',
        'RESPONDIDO',
        'FINALIZADO'
    ) NOT NULL DEFAULT 'RECEBIDO',

    aberto_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_protocolo_manifestacao
        FOREIGN KEY (manifestacao_id)
        REFERENCES manifestacoes(id),

    CONSTRAINT fk_protocolo_vereador
        FOREIGN KEY (vereador_responsavel_id)
        REFERENCES vereadores(id)
        ON DELETE SET NULL
);

CREATE TABLE historico_protocolos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    protocolo_id BIGINT NOT NULL,

    status ENUM(
        'RECEBIDO',
        'EM_ANALISE',
        'EM_ANDAMENTO',
        'RESPONDIDO',
        'FINALIZADO'
    ) NOT NULL,

    observacao TEXT,
    usuario_responsavel_id BIGINT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historico_protocolo
        FOREIGN KEY (protocolo_id)
        REFERENCES protocolos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_historico_responsavel
        FOREIGN KEY (usuario_responsavel_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

CREATE TABLE respostas_protocolos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    protocolo_id BIGINT NOT NULL,
    usuario_responsavel_id BIGINT NULL,
    resposta TEXT NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_resposta_protocolo
        FOREIGN KEY (protocolo_id)
        REFERENCES protocolos(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_resposta_usuario
        FOREIGN KEY (usuario_responsavel_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL
);

CREATE TABLE eventos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    tipo ENUM(
        'SESSAO',
        'COMISSAO',
        'AUDIENCIA'
    ) NOT NULL,

    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_evento DATE NOT NULL,
    hora_evento TIME NOT NULL,
    local_evento VARCHAR(255),
    participantes INT NOT NULL DEFAULT 0,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_evento_participantes
        CHECK (participantes >= 0)
);

CREATE TABLE solicitacoes_reuniao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    vereador_id BIGINT NOT NULL,
    data_solicitada DATE,
    hora_solicitada TIME,
    observacao TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reuniao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id),

    CONSTRAINT fk_reuniao_vereador
        FOREIGN KEY (vereador_id)
        REFERENCES vereadores(id)
);

CREATE TABLE notificacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    protocolo_id BIGINT NULL,

    tipo ENUM(
        'PROTOCOLO',
        'AVISO'
    ) NOT NULL,

    titulo VARCHAR(200) NOT NULL,
    descricao TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notificacao_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notificacao_protocolo
        FOREIGN KEY (protocolo_id)
        REFERENCES protocolos(id)
        ON DELETE SET NULL
);

CREATE TABLE historico_camara (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ano SMALLINT NOT NULL,
    titulo VARCHAR(200),
    nome_destaque VARCHAR(150),
    descricao TEXT NOT NULL,
    vereador_id BIGINT NULL,

    CONSTRAINT fk_historico_camara_vereador
        FOREIGN KEY (vereador_id)
        REFERENCES vereadores(id)
        ON DELETE SET NULL
);

-- Dados de referência exigidos pela API
INSERT INTO perfis (nome, descricao) VALUES
    ('CIDADAO', 'Cidadão que abre manifestações e avalia vereadores'),
    ('ADMIN', 'Administrador da prefeitura/câmara');

CREATE INDEX idx_usuario_nome
    ON usuarios(nome);

CREATE INDEX idx_vereador_nome
    ON vereadores(nome);

CREATE INDEX idx_vereador_regiao
    ON vereadores(regiao);

CREATE INDEX idx_manifestacao_usuario
    ON manifestacoes(usuario_id);

CREATE INDEX idx_manifestacao_tipo
    ON manifestacoes(tipo);

CREATE INDEX idx_manifestacao_bairro
    ON manifestacoes(bairro);

CREATE INDEX idx_protocolo_status
    ON protocolos(status);

CREATE INDEX idx_historico_protocolo
    ON historico_protocolos(protocolo_id);

CREATE INDEX idx_evento_data
    ON eventos(data_evento);

CREATE INDEX idx_evento_tipo
    ON eventos(tipo);

CREATE INDEX idx_notificacao_usuario
    ON notificacoes(usuario_id);

CREATE INDEX idx_notificacao_lida
    ON notificacoes(usuario_id, lida);

CREATE INDEX idx_avaliacao_vereador
    ON avaliacoes(vereador_id);

SHOW TABLES;

SELECT
    TABLE_NAME,
    COLUMN_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'alo_camara'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;