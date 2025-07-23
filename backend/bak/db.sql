-- 1. Catalogue of reusable blocks (admin-managed, mostly static)
CREATE TABLE workflow_block_types (
    id              TEXT PRIMARY KEY,          -- “GoogleSearch”
    display_name    TEXT        NOT NULL,
    description     TEXT,
    icon            TEXT,                      -- Tabler icon name
    color_hex       CHAR(7)    NOT NULL,       -- “#4f46e5”
    type            TEXT        NOT NULL,      -- 'action' | 'data'
    enabled         BOOLEAN     NOT NULL DEFAULT TRUE,
    input_schema    JSONB       NOT NULL,      -- JSON-Schema v7
    output_schema   JSONB       NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-----------------------------------------------------------------
-- 2. Workflow definition (belongs to a project, versioned inline)
CREATE TABLE workflow_definitions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id     UUID NOT NULL REFERENCES blog_projects(id),
    name           TEXT NOT NULL,
    description    TEXT,
    version        INTEGER     NOT NULL DEFAULT 1,
    nodes          JSONB       NOT NULL,       -- reactFlow.toObject().nodes
    edges          JSONB       NOT NULL,       -- reactFlow.toObject().edges
    cron_expr      TEXT,                       -- NULL ⇒ manual only
    is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at         TIMESTAMPTZ
);

-- Optional: simple version bump trigger
CREATE OR REPLACE FUNCTION bump_workflow_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bump_workflow_version
BEFORE UPDATE ON workflow_definitions
FOR EACH ROW EXECUTE FUNCTION bump_workflow_version();

-----------------------------------------------------------------
-- 3. Top-level execution record
CREATE TYPE run_trigger_type AS ENUM ('user', 'cron');

CREATE TABLE workflow_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES workflow_definitions(id),
    trigger_type    run_trigger_type NOT NULL,
    trigger_user_id UUID REFERENCES users(id),
    status          TEXT NOT NULL,            -- queued | running | success | error
    started_at      TIMESTAMPTZ,
    finished_at     TIMESTAMPTZ,
    metrics         JSONB,                    -- aggregate (SEO score, read-time…)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id),
    error_message      TEXT,
);

-----------------------------------------------------------------
-- 4. Per-node execution record
CREATE TABLE node_runs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_run_id      UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id     TEXT NOT NULL,               -- React Flow node id
    block_type  TEXT NOT NULL REFERENCES workflow_block_types(id),
    status      TEXT NOT NULL,               -- queued | running | success | skipped | failed
    input       JSONB,
    output      JSONB,
    started_at  TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message      TEXT
);

-----------------------------------------------------------------
-- 5. (Optional) separate cron schedules if you need many per workflow
--    Skip if the single `cron_expr` field is sufficient.
CREATE TABLE workflow_cron_triggers (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id  UUID NOT NULL REFERENCES workflow_definitions(id) ON DELETE CASCADE,
    cron_expr    TEXT NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    last_run_at        TIMESTAMPTZ,
    next_run_at        TIMESTAMPTZ,
    created_by         UUID          REFERENCES users(id),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);