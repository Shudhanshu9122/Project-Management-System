-- Project Management System schema.
-- Safe to run repeatedly: every object is created with IF NOT EXISTS.
--
-- gen_random_uuid() moved into core in PostgreSQL 13, so no extension is
-- required on the 14+ versions this project targets.

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_full_name_not_blank CHECK (btrim(full_name) <> ''),
  CONSTRAINT users_email_not_blank     CHECK (btrim(email) <> '')
);

-- Uniqueness is on lower(email) so "Ada@Example.com" and "ada@example.com"
-- cannot both register. A plain UNIQUE(email) would allow it.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (lower(email));

CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'Not Started',
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT projects_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT projects_status_check CHECK (status IN ('Not Started', 'In Progress', 'Completed')),
  CONSTRAINT projects_date_order_check
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS projects_owner_id_idx     ON projects (owner_id);
CREATE INDEX IF NOT EXISTS projects_owner_status_idx ON projects (owner_id, status);

CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  priority    TEXT NOT NULL DEFAULT 'Medium',
  status      TEXT NOT NULL DEFAULT 'Pending',
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_name_not_blank CHECK (btrim(name) <> ''),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('Low', 'Medium', 'High')),
  CONSTRAINT tasks_status_check   CHECK (status IN ('Pending', 'In Progress', 'Completed'))
);

-- No owner_id here on purpose: ownership is reachable through projects.owner_id,
-- and duplicating it would let the two copies drift apart.
CREATE INDEX IF NOT EXISTS tasks_project_id_idx     ON tasks (project_id);
CREATE INDEX IF NOT EXISTS tasks_project_status_idx ON tasks (project_id, status);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        UUID PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Used to prune rows once the token they describe could not be used anyway.
CREATE INDEX IF NOT EXISTS revoked_tokens_expires_at_idx ON revoked_tokens (expires_at);
