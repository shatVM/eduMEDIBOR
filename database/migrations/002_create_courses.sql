-- database/migrations/002_create_courses.sql

CREATE TABLE IF NOT EXISTS courses (
    course_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    category           VARCHAR(100),
    level              VARCHAR(50) DEFAULT 'beginner',  -- beginner, intermediate, advanced
    duration_hours     INTEGER,
    price              DECIMAL(10, 2),
    currency           VARCHAR(3) DEFAULT 'UAH',
    image_url          TEXT,
    instructor_id      UUID NOT NULL REFERENCES users(user_id) ON DELETE SET NULL,
    is_published       BOOLEAN DEFAULT FALSE,
    max_students       INTEGER,
    enrolled_count     INTEGER DEFAULT 0,
    rating             DECIMAL(3, 2),
    rating_count       INTEGER DEFAULT 0,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

/* Trigger for updated_at */
DROP TRIGGER IF EXISTS set_updated_at_courses ON courses;
CREATE TRIGGER set_updated_at_courses
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses (instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created ON courses (created_at);
