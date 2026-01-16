-- database/migrations/001_create_users.sql

/* Extensions */
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- для gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;      -- для case-insensitive email

/* Enums */
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_type') THEN
        CREATE TYPE role_type AS ENUM ('student','teacher','admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('male','female','other');
    END IF;
END $$;

/* Users Table */
CREATE TABLE IF NOT EXISTS users (
    user_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email              CITEXT UNIQUE NOT NULL,
    password_hash      VARCHAR(255) NOT NULL,
    first_name         VARCHAR(100) NOT NULL,
    last_name          VARCHAR(100) NOT NULL,
    date_of_birth      DATE,
    gender             gender_type,
    phone_number       VARCHAR(20),
    profile_picture_url TEXT,
    bio                TEXT,
    locale             VARCHAR(5) DEFAULT 'uk',
    role               role_type DEFAULT 'student' NOT NULL,
    is_active          BOOLEAN DEFAULT TRUE,
    email_verified     BOOLEAN DEFAULT FALSE,
    registration_date  TIMESTAMPTZ DEFAULT NOW(),
    last_login         TIMESTAMPTZ,
    last_password_change TIMESTAMPTZ,
    failed_login_attempts SMALLINT DEFAULT 0,
    custom_attributes  JSONB,
    created_by         UUID REFERENCES users(user_id),
    updated_at         TIMESTAMPTZ DEFAULT NOW()
);

/* Trigger for updated_at */
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trg_set_updated_at();

/* Indexes */
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users (last_login);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_registration ON users (registration_date);
CREATE INDEX IF NOT EXISTS idx_users_custom_attr ON users USING GIN (custom_attributes);
