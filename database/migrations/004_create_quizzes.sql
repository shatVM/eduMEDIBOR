-- database/migrations/004_create_quizzes.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
        CREATE TYPE quiz_type AS ENUM ('multiple_choice','true_false','short_answer','essay');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id          UUID NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    question           TEXT NOT NULL,
    quiz_type          quiz_type DEFAULT 'multiple_choice',
    options            JSONB,
    correct_answer     TEXT,
    explanation        TEXT,
    points             INTEGER DEFAULT 1,
    "order"            INTEGER,
    is_required        BOOLEAN DEFAULT TRUE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

/* Trigger for updated_at */
DROP TRIGGER IF EXISTS set_updated_at_quizzes ON quizzes;
CREATE TRIGGER set_updated_at_quizzes
BEFORE UPDATE ON quizzes
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes (lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_order ON quizzes (lesson_id, "order");
