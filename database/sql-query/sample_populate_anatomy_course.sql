-- =================================================================
-- POPULATE SCRIPT: Comprehensive Human Anatomy Course (Ukrainian)
-- This script creates a full course with a tenant, instructor, student,
-- modules, rich materials, an assignment, a quiz, and tracks student progress.
-- It is idempotent and safe to run multiple times.
-- =================================================================

DO $$
DECLARE
    -- IDs for tracking relationships
    v_tenant_id UUID;
    v_instructor_id UUID;
    v_student_id UUID;
    v_course_id UUID;
    v_enrollment_id UUID;

    -- Module IDs
    v_mod_intro_id UUID;
    v_mod_skeletal_id UUID;
    v_mod_muscular_id UUID;
    v_mod_nervous_id UUID;
    v_mod_assessment_id UUID;

    -- Material IDs (for progress tracking)
    v_mat_intro_text_id UUID;
    v_mat_skeletal_video_id UUID;
    
BEGIN

-- =========================
-- 0. ENSURE EXTENSIONS
-- =========================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. ENSURE PREREQUISITES (TENANT, INSTRUCTOR, STUDENT)
-- =========================
-- Find or create the Tenant.
SELECT id INTO v_tenant_id FROM tenants WHERE name = 'Med-Star Academy' LIMIT 1;
IF v_tenant_id IS NULL THEN
    INSERT INTO tenants (name, domain, settings)
    VALUES ('Med-Star Academy', 'med-star.com', '{"theme": "dark", "language": "uk"}'::jsonb)
    RETURNING id INTO v_tenant_id;
END IF;

-- Find or create the Instructor User.
INSERT INTO users (tenant_id, email, password_hash, avatar_url)
VALUES (v_tenant_id, 'prof.gray@med-star.com', 'hash123', 'https://med-star.com/avatars/prof_gray.jpg')
ON CONFLICT (email) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
RETURNING id INTO v_instructor_id;

-- Find or create the Student User.
INSERT INTO users (tenant_id, email, password_hash, avatar_url)
VALUES (v_tenant_id, 'student.carter@med-star.com', 'hash456', 'https://med-star.com/avatars/student_carter.jpg')
ON CONFLICT (email) DO UPDATE SET avatar_url = EXCLUDED.avatar_url
RETURNING id INTO v_student_id;

-- =========================
-- 2. CREATE THE COURSE (ONLY IF IT DOESN'T EXIST)
-- =========================
-- This block ensures the whole course population runs only once.
SELECT id INTO v_course_id FROM courses WHERE title = 'Анатомія Людини: Повний Курс' AND tenant_id = v_tenant_id;

IF v_course_id IS NULL THEN

    INSERT INTO courses (tenant_id, title, description, instructor_ids, enrollment_limit, completion_certificate, created_at)
    VALUES (
        v_tenant_id,
        'Анатомія Людини: Повний Курс',
        'Комплексний курс, що детально розглядає будову людського тіла, від клітинного рівня до складних систем органів. Включає 3D-моделі, відеолекції та практичні завдання.',
        jsonb_build_array(v_instructor_id),
        150,
        true,
        now()
    ) RETURNING id INTO v_course_id;

    -- =========================
    -- 3. CREATE COURSE MODULES
    -- =========================
    INSERT INTO course_modules (course_id, title, position) VALUES (v_course_id, 'Модуль 1: Вступ до Анатомії та Організації Тіла', 1) RETURNING id INTO v_mod_intro_id;
    INSERT INTO course_modules (course_id, title, position) VALUES (v_course_id, 'Модуль 2: Опорно-рухова система', 2) RETURNING id INTO v_mod_skeletal_id;
    INSERT INTO course_modules (course_id, title, position) VALUES (v_course_id, 'Модуль 3: М''язова система', 3) RETURNING id INTO v_mod_muscular_id;
    INSERT INTO course_modules (course_id, title, position) VALUES (v_course_id, 'Модуль 4: Нервова система', 4) RETURNING id INTO v_mod_nervous_id;
    INSERT INTO course_modules (course_id, title, position) VALUES (v_course_id, 'Модуль 5: Підсумковий іспит', 5) RETURNING id INTO v_mod_assessment_id;

    -- =========================
    -- 4. ADD LEARNING MATERIALS
    -- =========================
    -- Materials for Module 1
    INSERT INTO learning_materials (module_id, material_type, content) 
    VALUES (v_mod_intro_id, 'text', '{"title": "Рівні організації тіла", "body": "<h1>Від атома до організму</h1><p>Людське тіло організоване ієрархічно, починаючи з хімічного рівня (атоми, молекули) і закінчуючи рівнем цілісного організму.</p>"}'::jsonb)
    RETURNING id INTO v_mat_intro_text_id;

    INSERT INTO learning_materials (module_id, material_type, content, external_url) 
    VALUES (v_mod_intro_id, 'video', '{"title": "Анатомічні площини та осі", "duration": "08:15"}'::jsonb, 'https://youtube.com/watch?v=anatomical-planes');

    -- Materials for Module 2
    INSERT INTO learning_materials (module_id, material_type, content, external_url, embed_code)
    VALUES (v_mod_skeletal_id, 'interactive', '{"title": "3D-модель скелету"}'::jsonb, 'https://anatomy.med-star.com/skeleton3d', '<iframe src="https://anatomy.med-star.com/skeleton3d/embed"></iframe>')
    RETURNING id INTO v_mat_skeletal_video_id;

    INSERT INTO learning_materials (module_id, material_type, file_url, file_mime_type, download_allowed)
    VALUES (v_mod_skeletal_id, 'document', 'https://med-star.com/docs/bones_table.pdf', 'application/pdf', true);

    -- Materials for Module 3
    INSERT INTO assignments (module_id, instructions, max_score, deadline)
    VALUES (v_mod_muscular_id, 'Назвіть та опишіть 5 основних м''язів плечового поясу. Завантажте відповідь у форматі .docx або .pdf.', 100, now() + interval '10 days');

    -- =========================
    -- 5. CREATE A QUIZ
    -- =========================
    WITH q_set AS (
        INSERT INTO quiz_sets (module_id, time_limit_minutes, passing_score, attempts_allowed)
        VALUES (v_mod_assessment_id, 60, 80, 1) RETURNING id
    )
    INSERT INTO quiz_questions (quiz_set_id, question_type, question, options, correct_answers)
    VALUES 
        ( (SELECT id FROM q_set), 'single', 'Скільки кісток у скелеті дорослої людини?', '{"A": "188", "B": "206", "C": "214", "D": "230"}'::jsonb, '["B"]'::jsonb ),
        ( (SELECT id FROM q_set), 'multiple', 'Які з цих кісток належать до осьового скелету?', '{"A": "Череп", "B": "Стегнова кістка", "C": "Хребет", "D": "Ребра"}'::jsonb, '["A", "C", "D"]'::jsonb ),
        ( (SELECT id FROM q_set), 'boolean', 'Найдовший м''яз у тілі людини - кравецький.', '{"True": "Так", "False": "Ні"}'::jsonb, '["True"]'::jsonb );

    -- =========================
    -- 6. ENROLL STUDENT AND TRACK PROGRESS
    -- =========================
    -- Check if enrollment exists to prevent ON CONFLICT errors and make script re-runnable.
    SELECT id INTO v_enrollment_id FROM enrollments WHERE user_id = v_student_id AND course_id = v_course_id;

    IF v_enrollment_id IS NULL THEN
        INSERT INTO enrollments (user_id, course_id, status, started_at)
        VALUES (v_student_id, v_course_id, 'active', now())
        RETURNING id INTO v_enrollment_id;
    END IF;

    -- Log progress for the first two materials
    -- The lesson_progress table has a PRIMARY KEY, so ON CONFLICT is valid here.
    INSERT INTO lesson_progress (enrollment_id, material_id, viewed, completed, time_spent)
    VALUES 
        (v_enrollment_id, v_mat_intro_text_id, true, true, 600), -- 10 minutes
        (v_enrollment_id, v_mat_skeletal_video_id, true, false, 300) -- 5 minutes, viewed but not marked 'completed'
    ON CONFLICT (enrollment_id, material_id) DO NOTHING;

    RAISE NOTICE 'Успішно створено або оновлено курс "Анатомія Людини" з ID: %', v_course_id;

ELSE
    RAISE NOTICE 'Курс "Анатомія Людини" вже існує. Пропускаємо створення.';
END IF;

END $$;
