-- ===========================================================================
-- Sistema de Constancias de Notas - FACES / Universidad de Carabobo
-- Esquema relacional normalizado (3FN) para PostgreSQL 16
--
-- NOTA: el backend usa Prisma. Este archivo es la referencia SQL equivalente
-- y puede aplicarse manualmente con:  psql -f db/schema.sql
-- Prisma crea exactamente estas tablas con: npx prisma db push
-- ===========================================================================

DO $$
BEGIN
    CREATE TYPE "Rol" AS ENUM ('ADMIN', 'DOCENTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END
$$;

-- ---------------------------------------------------------------------------
-- Programas de postgrado
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS programas (
    id              SERIAL PRIMARY KEY,
    codigo_programa VARCHAR(20)  NOT NULL UNIQUE,
    desc_programa   VARCHAR(255) NOT NULL,
    creado_en       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Catálogo de asignaturas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaturas (
    id                SERIAL PRIMARY KEY,
    codigo_asignatura VARCHAR(30)  NOT NULL UNIQUE,
    desc_asignatura   VARCHAR(255) NOT NULL,
    nivel             INTEGER      NOT NULL DEFAULT 0,
    uc                INTEGER      NOT NULL DEFAULT 0,
    programa_id       INTEGER      NOT NULL,
    CONSTRAINT fk_asignaturas_programa
        FOREIGN KEY (programa_id) REFERENCES programas (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_asignaturas_programa ON asignaturas (programa_id);

-- ---------------------------------------------------------------------------
-- Estudiantes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estudiantes (
    id          SERIAL PRIMARY KEY,
    cedula      VARCHAR(20)  NOT NULL UNIQUE,
    nombres     VARCHAR(255) NOT NULL,
    programa_id INTEGER      NOT NULL,
    creado_en   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_estudiantes_programa
        FOREIGN KEY (programa_id) REFERENCES programas (id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_estudiantes_programa ON estudiantes (programa_id);

-- ---------------------------------------------------------------------------
-- Usuarios internos (docentes / administradores)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id            SERIAL PRIMARY KEY,
    cedula        VARCHAR(20)  NOT NULL UNIQUE,
    nombre        VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol           "Rol"        NOT NULL DEFAULT 'DOCENTE',
    activo        BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- Histórico de notas (hecho académico)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_notas (
    id               SERIAL PRIMARY KEY,
    estudiante_id    INTEGER      NOT NULL,
    asignatura_id    INTEGER      NOT NULL,
    periodo_lectivo  VARCHAR(30)  NOT NULL,
    anno_lectivo     VARCHAR(10)  NOT NULL,
    seccion          VARCHAR(20)  NOT NULL DEFAULT '',
    nota_final       DOUBLE PRECISION NOT NULL,
    aprobada         BOOLEAN      NOT NULL DEFAULT FALSE,
    calculo_promedio DOUBLE PRECISION,
    nombre_profesor  VARCHAR(255),
    creado_en        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_estudiante
        FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id) ON DELETE CASCADE,
    CONSTRAINT fk_historico_asignatura
        FOREIGN KEY (asignatura_id) REFERENCES asignaturas (id) ON DELETE RESTRICT,
    CONSTRAINT uq_historico_notas
        UNIQUE (estudiante_id, asignatura_id, periodo_lectivo, anno_lectivo)
);

CREATE INDEX IF NOT EXISTS idx_historico_estudiante ON historico_notas (estudiante_id);
CREATE INDEX IF NOT EXISTS idx_historico_asignatura ON historico_notas (asignatura_id);
