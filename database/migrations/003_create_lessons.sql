-- database/migrations/003_create_lessons.sql

CREATE TABLE IF NOT EXISTS lessons (
    lesson_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id          UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    content            TEXT,
    "order"            INTEGER NOT NULL,
    duration_minutes   INTEGER,
    video_url          TEXT,
    video_duration     INTEGER,
    is_published       BOOLEAN DEFAULT TRUE,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

/* Trigger for updated_at */
DROP TRIGGER IF EXISTS set_updated_at_lessons ON lessons;
CREATE TRIGGER set_updated_at_lessons
BEFORE UPDATE ON lessons
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons (course_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons (is_published);
