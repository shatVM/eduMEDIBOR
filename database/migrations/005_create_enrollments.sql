-- database/migrations/005_create_enrollments.sql

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enrollment_status') THEN
        CREATE TYPE enrollment_status AS ENUM ('pending','active','completed','dropped','suspended');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    course_id          UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    status             enrollment_status DEFAULT 'pending',
    progress_percent   INTEGER DEFAULT 0,
    enrollment_date    TIMESTAMPTZ DEFAULT NOW(),
    completion_date    TIMESTAMPTZ,
    last_accessed      TIMESTAMPTZ,
    certificate_url    TEXT,
    notes              TEXT,
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

/* Trigger for updated_at */
DROP TRIGGER IF EXISTS set_updated_at_enrollments ON enrollments;
CREATE TRIGGER set_updated_at_enrollments
BEFORE UPDATE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments (status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON enrollments (user_id, status);
