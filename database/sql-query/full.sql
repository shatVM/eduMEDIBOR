-- =============================================================
-- eduMEDIBOR LMS – ENHANCED PROFESSIONAL SQL SCHEMA
-- PostgreSQL 14+
-- SCORM 1.2/2004, LTI 1.3, xAPI, Enterprise-ready
-- Version: 2.0 Extended
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
CREATE TYPE notification_type AS ENUM ('email','sms','push','in_app');
CREATE TYPE notification_priority AS ENUM ('low','medium','high','urgent');
CREATE TYPE event_type AS ENUM ('lecture','webinar','deadline','exam','office_hours');

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
  last_login TIMESTAMP,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  date_of_birth DATE,
  country TEXT,
  occupation TEXT,
  updated_at TIMESTAMP DEFAULT now()
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
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
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
  thumbnail_url TEXT,
  trailer_url TEXT,
  difficulty_level TEXT,
  estimated_hours INTEGER,
  language TEXT DEFAULT 'en',
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  rating_average DECIMAL(3,2),
  rating_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE course_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
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
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  status enrollment_status,
  progress_percent INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_accessed TIMESTAMP,
  enrollment_source TEXT,
  CONSTRAINT valid_dates CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE lesson_progress (
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  material_id UUID REFERENCES learning_materials(id) ON DELETE CASCADE,
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
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  instructions TEXT,
  max_score INTEGER,
  deadline TIMESTAMP,
  CONSTRAINT positive_max_score CHECK (max_score > 0)
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP,
  score INTEGER,
  feedback TEXT
);

-- =========================
-- QUIZZES
-- =========================
CREATE TABLE quiz_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID REFERENCES course_modules(id) ON DELETE CASCADE,
  time_limit_minutes INTEGER,
  attempts_allowed INTEGER,
  passing_score INTEGER,
  CONSTRAINT valid_passing_score CHECK (passing_score > 0 AND passing_score <= 100)
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  question_type question_type,
  question TEXT,
  options JSONB,
  correct_answers JSONB
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_set_id UUID REFERENCES quiz_sets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- =========================
-- CERTIFICATES
-- =========================
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE,
  issued_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  pdf_url TEXT,
  verification_code TEXT UNIQUE,
  metadata JSONB
);

-- =========================
-- NOTIFICATIONS
-- =========================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type notification_type,
  priority notification_priority,
  title TEXT NOT NULL,
  message TEXT,
  read_at TIMESTAMP,
  action_url TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE notification_preferences (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type,
  enabled BOOLEAN DEFAULT true,
  PRIMARY KEY (user_id, notification_type)
);

-- =========================
-- DISCUSSION FORUMS
-- =========================
CREATE TABLE discussion_forums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE forum_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forum_id UUID REFERENCES discussion_forums(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id UUID REFERENCES forum_threads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE post_reactions (
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT,
  PRIMARY KEY (post_id, user_id)
);

-- =========================
-- REVIEWS & RATINGS
-- =========================
CREATE TABLE course_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(course_id, user_id)
);

CREATE TABLE instructor_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  instructor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- CALENDAR & EVENTS
-- =========================
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  event_type event_type,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  reminder_minutes INTEGER[],
  created_at TIMESTAMP DEFAULT now(),
  CHECK (end_time > start_time)
);

CREATE TABLE event_attendees (
  event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rsvp_status TEXT,
  attended BOOLEAN,
  PRIMARY KEY (event_id, user_id)
);

-- =========================
-- PAYMENTS & PRICING
-- =========================
CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  billing_period TEXT,
  features JSONB
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status payment_status,
  payment_method TEXT,
  transaction_id TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_percent INTEGER,
  discount_amount DECIMAL(10,2),
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0
);

-- =========================
-- GAMIFICATION
-- =========================
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  criteria JSONB,
  points INTEGER DEFAULT 0
);

CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  last_updated TIMESTAMP DEFAULT now()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_type TEXT,
  metadata JSONB,
  achieved_at TIMESTAMP DEFAULT now()
);

-- =========================
-- ANALYTICS
-- =========================
CREATE TABLE course_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  date DATE,
  total_enrollments INTEGER DEFAULT 0,
  active_students INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2),
  average_score DECIMAL(5,2),
  total_time_spent INTEGER,
  engagement_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID,
  activity_type TEXT,
  resource_type TEXT,
  resource_id UUID,
  duration_seconds INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- FILE STORAGE
-- =========================
CREATE TABLE file_storage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  checksum TEXT,
  is_public BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT now()
);

CREATE TABLE file_access_log (
  file_id UUID REFERENCES file_storage(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  accessed_at TIMESTAMP DEFAULT now()
);

-- =========================
-- CONTENT VERSIONING
-- =========================
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT,
  entity_id UUID,
  version_number INTEGER,
  content JSONB,
  changed_by UUID REFERENCES users(id),
  change_notes TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- =========================
-- COLLABORATIVE FEATURES
-- =========================
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER,
  is_private BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE group_members (
  group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE peer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES assignment_submissions(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT now()
);

-- =========================
-- SCORM
-- =========================
CREATE TABLE scorm_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  version scorm_version,
  entry_url TEXT,
  manifest JSONB
);

CREATE TABLE scorm_runtime_data (
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
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
  platform_id UUID REFERENCES lti_platforms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  roles JSONB,
  context JSONB,
  launched_at TIMESTAMP DEFAULT now()
);

-- =========================
-- xAPI (Experience API)
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
-- GDPR & PRIVACY
-- =========================
CREATE TABLE data_retention_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  anonymize_after_days INTEGER
);

CREATE TABLE user_consents (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT,
  granted BOOLEAN,
  version TEXT,
  granted_at TIMESTAMP,
  ip_address INET,
  PRIMARY KEY (user_id, consent_type)
);

CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  export_url TEXT,
  requested_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP
);

CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  requested_at TIMESTAMP DEFAULT now(),
  processed_at TIMESTAMP
);

-- =========================
-- API & INTEGRATIONS
-- =========================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  scopes TEXT[],
  rate_limit INTEGER DEFAULT 1000,
  expires_at TIMESTAMP,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE api_rate_limits (
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint TEXT,
  request_count INTEGER DEFAULT 0,
  window_start TIMESTAMP DEFAULT now(),
  PRIMARY KEY (api_key_id, endpoint)
);

CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type TEXT,
  config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  events TEXT[],
  secret TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  endpoint_id UUID REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT,
  payload JSONB,
  response_code INTEGER,
  response_body TEXT,
  delivered_at TIMESTAMP DEFAULT now()
);

-- =========================
-- MOBILE SUPPORT
-- =========================
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  device_type TEXT,
  push_token TEXT UNIQUE,
  device_info JSONB,
  last_active TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
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

-- =========================
-- INDEXES FOR PERFORMANCE
-- =========================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified);

-- Enrollments indexes
CREATE INDEX idx_enrollments_user_course ON enrollments(user_id, course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);

-- Courses indexes
CREATE INDEX idx_courses_tenant ON courses(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_published ON courses(is_published) WHERE deleted_at IS NULL;
CREATE INDEX idx_courses_instructors ON courses USING GIN(instructor_ids);
CREATE INDEX idx_courses_tags ON courses USING GIN(tags);

-- Learning materials indexes
CREATE INDEX idx_learning_materials_module ON learning_materials(module_id);
CREATE INDEX idx_learning_materials_type ON learning_materials(material_type);

-- Notifications indexes
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE read_at IS NULL;

-- Forum indexes
CREATE INDEX idx_forum_threads_forum ON forum_threads(forum_id, created_at DESC);
CREATE INDEX idx_forum_posts_thread ON forum_posts(thread_id, created_at DESC);
CREATE INDEX idx_forum_posts_user ON forum_posts(user_id);

-- Activity log indexes
CREATE INDEX idx_activity_user_date ON user_activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_session ON user_activity_log(session_id);

-- Audit log indexes
CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);

-- xAPI indexes
CREATE INDEX idx_xapi_timestamp ON xapi_statements(timestamp DESC);
CREATE INDEX idx_xapi_actor ON xapi_statements USING GIN(actor);

-- Certificate indexes
CREATE INDEX idx_certificates_verification ON certificates(verification_code);
CREATE INDEX idx_certificates_enrollment ON certificates(enrollment_id);

-- Payment indexes
CREATE INDEX idx_payments_user ON payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON payments(status);

-- File storage indexes
CREATE INDEX idx_file_storage_user ON file_storage(user_id);
CREATE INDEX idx_file_storage_checksum ON file_storage(checksum);

-- Analytics indexes
CREATE INDEX idx_course_analytics_course_date ON course_analytics(course_id, date DESC);

-- =========================
-- FUNCTIONS & TRIGGERS
-- =========================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for courses updated_at
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update course rating
CREATE OR REPLACE FUNCTION update_course_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE courses
  SET 
    rating_average = (
      SELECT AVG(rating)::DECIMAL(3,2)
      FROM course_reviews
      WHERE course_id = NEW.course_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM course_reviews
      WHERE course_id = NEW.course_id
    )
  WHERE id = NEW.course_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for course rating updates
CREATE TRIGGER update_course_rating_on_review
  AFTER INSERT OR UPDATE ON course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_course_rating();

-- =========================
-- INITIAL DATA (Optional)
-- =========================

-- Default roles
INSERT INTO roles (name) VALUES 
  ('admin'),
  ('instructor'),
  ('student'),
  ('teaching_assistant')
ON CONFLICT (name) DO NOTHING;

-- Default permissions
INSERT INTO permissions (code) VALUES 
  ('course.create'),
  ('course.edit'),
  ('course.delete'),
  ('course.view'),
  ('user.manage'),
  ('enrollment.manage'),
  ('certificate.issue'),
  ('analytics.view')
ON CONFLICT (code) DO NOTHING;

-- =========================
-- COMMENTS FOR DOCUMENTATION
-- =========================

COMMENT ON TABLE users IS 'Stores user accounts with authentication and security features';
COMMENT ON TABLE courses IS 'Main courses table with multi-instructor support';
COMMENT ON TABLE enrollments IS 'Tracks student enrollment in courses';
COMMENT ON TABLE certificates IS 'Digital certificates issued upon course completion';
COMMENT ON TABLE xapi_statements IS 'Experience API statements for learning analytics';
COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all system actions';

-- =========================
-- END OF SCHEMA
-- =============================================================