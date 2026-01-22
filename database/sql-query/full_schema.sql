-- Full PostgreSQL schema for eduMEDIBOR

/* --------------------------------------------------------------
   1. Extensions – needed for UUID generation and case‑insensitive email
   -------------------------------------------------------------- */
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;    -- case‑insensitive text

/* --------------------------------------------------------------
   2. Enumerated types – created only once
   -------------------------------------------------------------- */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        CREATE TYPE role_type AS ENUM ('student','teacher','admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('male','female','other');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'quiz_type') THEN
        CREATE TYPE quiz_type AS ENUM ('multiple_choice','true_false','short_answer','essay');
    END IF;
END $$;

/* --------------------------------------------------------------
   3. Trigger function – shared by all tables that have `updated_at`
   -------------------------------------------------------------- */
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/* --------------------------------------------------------------
   4. Users table
   -------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS users (
    user_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email                 CITEXT UNIQUE NOT NULL,
    password_hash         VARCHAR(255) NOT NULL,
    first_name            VARCHAR(100) NOT NULL,
    last_name             VARCHAR(100) NOT NULL,
    date_of_birth         DATE,
    gender                gender_type,
    phone_number          VARCHAR(20),
    profile_picture_url   TEXT,
    bio                   TEXT,
    locale                VARCHAR(5)   DEFAULT 'uk',
    role                  role_type    DEFAULT 'student' NOT NULL,
    is_active             BOOLEAN      DEFAULT TRUE,
    email_verified        BOOLEAN      DEFAULT FALSE,
    registration_date    TIMESTAMPTZ  DEFAULT NOW(),
    last_login            TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    failed_login_attempts SMALLINT    DEFAULT 0,
    custom_attributes    JSONB,
    created_by            UUID REFERENCES users(user_id),
    updated_at            TIMESTAMPTZ  DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_email          ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_last_login    ON users (last_login);
CREATE INDEX IF NOT EXISTS idx_users_role          ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_registration ON users (registration_date);
CREATE INDEX IF NOT EXISTS idx_users_custom_attr   ON users USING GIN (custom_attributes);

/* --------------------------------------------------------------
   5. Courses table
   -------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS courses (
    course_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title              VARCHAR(255) NOT NULL,
    description        TEXT,
    category           VARCHAR(100),
    level              VARCHAR(50)   DEFAULT 'beginner',
    duration_hours     INTEGER,
    price              NUMERIC(10,2),
    currency           VARCHAR(3)    DEFAULT 'UAH',
    image_url          TEXT,
    instructor_id      UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_published       BOOLEAN      DEFAULT FALSE,
    max_students       INTEGER,
    rating             NUMERIC(3,2),
    rating_count       INTEGER      DEFAULT 0,
    created_at         TIMESTAMPTZ  DEFAULT NOW(),
    updated_at         TIMESTAMPTZ  DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_courses ON courses;
CREATE TRIGGER set_updated_at_courses
BEFORE UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses (instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_category  ON courses (category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses (is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created   ON courses (created_at);

/* --------------------------------------------------------------
   6. Lessons table
   -------------------------------------------------------------- */
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

DROP TRIGGER IF EXISTS set_updated_at_lessons ON lessons;
CREATE TRIGGER set_updated_at_lessons
BEFORE UPDATE ON lessons
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_lessons_course   ON lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order    ON lessons (course_id, "order");
CREATE INDEX IF NOT EXISTS idx_lessons_published ON lessons (is_published);

/* --------------------------------------------------------------
   7. Quizzes – more detailed schema
   -------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id          UUID NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    question           TEXT NOT NULL,
    quiz_type          quiz_type      DEFAULT 'multiple_choice',
    options            JSONB,
    correct_answer     TEXT,
    explanation        TEXT,
    points             INTEGER        DEFAULT 1,
    "order"            INTEGER,
    is_required        BOOLEAN        DEFAULT TRUE,
    created_at         TIMESTAMPTZ    DEFAULT NOW(),
    updated_at         TIMESTAMPTZ    DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_quizzes ON quizzes;
CREATE TRIGGER set_updated_at_quizzes
BEFORE UPDATE ON quizzes
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_quizzes_lesson ON quizzes (lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_order  ON quizzes (lesson_id, "order");

-- End of schema