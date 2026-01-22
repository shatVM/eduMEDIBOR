-- =============================================================
-- eduMEDIBOR LMS – FULL PROFESSIONAL SQL SCHEMA
-- PostgreSQL 14+
-- SCORM 1.2 / 2004, LTI 1.3, xAPI, Enterprise-ready
-- =============================================================

-- =========================
-- EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- ENUM TYPES
-- =========================
CREATE TYPE enrollment_status AS ENUM ('active','completed','dropped','expired');
CREATE TYPE payment_status AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE material_type AS ENUM ('video','audio','document','text','interactive','link','assignment','scorm');
CREATE TYPE question_type AS ENUM ('single','multiple','boolean','short','essay','fill_blank','matching','ordering','file');
CREATE TYPE scorm_version AS ENUM ('1.2','2004');

-- =========================
-- MULTITENANCY
-- =========================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  domain TEXT,
  settings JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- USERS & SECURITY
-- =========================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  avatar_url TEXT,
  two_factor_enabled BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  suspension_reason TEXT,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id),
  permission_id UUID REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id),
  role_id UUID REFERENCES roles(id),
  PRIMARY KEY (user_id, role_id)
);

-- =========================
-- COURSES STRUCTURE
-- =========================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  title TEXT NOT NULL,
  description TEXT,
  instructor_ids JSONB,
  prerequisites JSONB,
  enrollment_limit INTEGER,
  completion_certificate BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id),
  title TEXT NOT NULL,
  position INTEGER,
  unlock_rule JSONB,
  is_optional BOOLEAN DEFAULT false
);

-- =========================
-- LEARNING MATERIALS
-- =========================
CREATE TABLE learning_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES course_modules(id),
  material_type material_type,
  content JSONB,
  file_url TEXT,
  file_size BIGINT,
  file_mime_type TEXT,
  external_url TEXT,
  embed_code TEXT,
  download_allowed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- ENROLLMENTS & PROGRESS
-- =========================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  status enrollment_status,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE lesson_progress (
  enrollment_id UUID REFERENCES enrollments(id),
  material_id UUID REFERENCES learning_materials(id),
  viewed BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  time_spent INTEGER,
  PRIMARY KEY (enrollment_id, material_id)
);

-- =========================
-- ASSIGNMENTS
-- =========================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES course_modules(id),
  instructions TEXT,
  max_score INTEGER,
  deadline TIMESTAMP
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id),
  user_id UUID REFERENCES users(id),
  submitted_at TIMESTAMP,
  score INTEGER,
  feedback TEXT
);

-- =========================
-- QUIZZES
-- =========================
CREATE TABLE quiz_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES course_modules(id),
  time_limit_minutes INTEGER,
  attempts_allowed INTEGER,
  passing_score INTEGER
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_set_id UUID REFERENCES quiz_sets(id),
  question_type question_type,
  question TEXT,
  options JSONB,
  correct_answers JSONB
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_set_id UUID REFERENCES quiz_sets(id),
  user_id UUID REFERENCES users(id),
  score INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- =========================
-- SCORM
-- =========================
CREATE TABLE scorm_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id),
  version scorm_version,
  entry_url TEXT,
  manifest JSONB
);

CREATE TABLE scorm_runtime_data (
  enrollment_id UUID REFERENCES enrollments(id),
  cmi_key TEXT,
  cmi_value TEXT,
  updated_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (enrollment_id, cmi_key)
);

-- =========================
-- LTI 1.3
-- =========================
CREATE TABLE lti_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issuer TEXT,
  client_id TEXT,
  auth_url TEXT,
  token_url TEXT,
  jwks_url TEXT
);

CREATE TABLE lti_launches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID REFERENCES lti_platforms(id),
  user_id UUID REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  roles JSONB,
  context JSONB,
  launched_at TIMESTAMP DEFAULT now()
);

-- =========================
-- ANALYTICS (xAPI)
-- =========================
CREATE TABLE xapi_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor JSONB,
  verb JSONB,
  object JSONB,
  result JSONB,
  context JSONB,
  timestamp TIMESTAMP DEFAULT now()
);

-- =========================
-- AUDIT LOG
-- =========================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  action TEXT,
  entity TEXT,
  entity_id UUID,
  ip_address INET,
  created_at TIMESTAMP DEFAULT now()
);
