-- =============================================================
-- SQL SCRIPT: EXTENDED MEDICAL COURSE CONTENT
-- Run in pgAdmin 4 Query Tool
-- =============================================================

DO $$
DECLARE
    -- ID змінних для збереження зв'язків
    v_tenant_id UUID;
    v_instructor_id UUID;
    v_student_id UUID;
    v_course_id UUID;
    
    -- ID модулів
    v_mod_anatomy_id UUID;
    v_mod_pathology_id UUID;
    v_mod_treatment_id UUID;
    
    -- ID матеріалів (для прогресу)
    v_mat_text_intro_id UUID;
    v_mat_img_heart_id UUID;
    
    v_enrollment_id UUID;

BEGIN

    -- 1. ОТРИМАННЯ АБО СТВОРЕННЯ ТЕНАНТА ТА КОРИСТУВАЧІВ
    -- (Перевіряємо чи є тенант, якщо ні - створюємо)
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE name = 'Medibor Medical Academy') THEN
        INSERT INTO tenants (name, domain, settings)
        VALUES ('Medibor Medical Academy', 'academy.medibor.edu', '{"theme": "blue"}'::jsonb)
        RETURNING id INTO v_tenant_id;
    ELSE
        SELECT id INTO v_tenant_id FROM tenants WHERE name = 'Medibor Medical Academy' LIMIT 1;
    END IF;

    -- Створюємо Інструктора (Професор)
    INSERT INTO users (tenant_id, email, password_hash, avatar_url, created_at)
    VALUES (v_tenant_id, 'prof.wilson@medibor.edu', 'hash123', 'https://medibor.edu/avatars/wilson.jpg', NOW())
    RETURNING id INTO v_instructor_id;

    -- Створюємо Студента
    INSERT INTO users (tenant_id, email, password_hash, avatar_url, created_at)
    VALUES (v_tenant_id, 'student.adams@medibor.edu', 'hash456', 'https://medibor.edu/avatars/adams.jpg', NOW())
    RETURNING id INTO v_student_id;

    -- 2. СТВОРЕННЯ ВЕЛИКОГО КУРСУ
    INSERT INTO courses (
        tenant_id, title, description, instructor_ids, enrollment_limit, completion_certificate
    )
    VALUES (
        v_tenant_id,
        'Клінічна Кардіологія: Поглиблений Курс',
        'Комплексний курс, що охоплює анатомію серця, патофізіологію поширених захворювань та сучасні протоколи лікування. Курс включає відео-демонстрації, інтерактивні діаграми ЕКГ та клінічні задачі.',
        jsonb_build_array(v_instructor_id),
        200,
        true
    ) RETURNING id INTO v_course_id;

    -- =========================================================
    -- МОДУЛЬ 1: ФУНДАМЕНТАЛЬНА АНАТОМІЯ
    -- =========================================================
    INSERT INTO course_modules (course_id, title, position)
    VALUES (v_course_id, 'Модуль 1: Анатомія та Фізіологія Серця', 1)
    RETURNING id INTO v_mod_anatomy_id;

    -- Матеріал 1.1: Текстова лекція (Rich Text)
    INSERT INTO learning_materials (module_id, material_type, content)
    VALUES (
        v_mod_anatomy_id,
        'text',
        jsonb_build_object(
            'body', '<h1>Будова серця</h1><p>Серце складається з чотирьох камер...</p><p>Детальний опис клапанного апарату...</p>',
            'reading_time_minutes', 15
        )
    ) RETURNING id INTO v_mat_text_intro_id;

    -- Матеріал 1.2: ФОТО/Діаграма (Окремий файл зображення)
    INSERT INTO learning_materials (module_id, material_type, file_url, file_mime_type, content)
    VALUES (
        v_mod_anatomy_id,
        'document', -- Використовуємо document для зображень, які можна відкрити/завантажити
        'https://medibor.edu/assets/heart_anatomy_diagram_hd.jpg',
        'image/jpeg',
        jsonb_build_object('description', 'Детальна схема коронарних судин (проекція RAO/LAO)')
    ) RETURNING id INTO v_mat_img_heart_id;

    -- Матеріал 1.3: Відео (3D Модель роботи серця)
    INSERT INTO learning_materials (module_id, material_type, content, file_url, file_mime_type)
    VALUES (
        v_mod_anatomy_id,
        'video',
        jsonb_build_object('duration', '12:30', 'thumbnail', 'https://medibor.edu/thumbs/3dheart.jpg'),
        'https://vimeo.com/medibor/3d-heart-cycle',
        'video/mp4'
    );

    -- =========================================================
    -- МОДУЛЬ 2: ПАТОЛОГІЯ ТА ДІАГНОСТИКА
    -- =========================================================
    INSERT INTO course_modules (course_id, title, position)
    VALUES (v_course_id, 'Модуль 2: Ішемічна хвороба серця та ЕКГ', 2)
    RETURNING id INTO v_mod_pathology_id;

    -- Матеріал 2.1: Відео-лекція (Інструктор біля дошки)
    INSERT INTO learning_materials (module_id, material_type, content, file_url)
    VALUES (
        v_mod_pathology_id,
        'video',
        jsonb_build_object('duration', '45:00', 'instructor', 'Dr. Wilson'),
        'https://youtube.com/watch?v=medibor_ischemia'
    );

    -- Матеріал 2.2: ФОТО (Серія ЕКГ плівок)
    -- Тут ми створюємо "галерею" через JSON контент або просто посилання
    INSERT INTO learning_materials (module_id, material_type, content)
    VALUES (
        v_mod_pathology_id,
        'text',
        jsonb_build_object(
            'body', '<h3>Аналіз сегмента ST</h3><p>Нижче наведено приклади елевації ST при інфаркті міокарда:</p><img src="https://medibor.edu/ecg/st_elevation_v1_v6.jpg" alt="ECG Anterior STEMI" /><br><p>Порівняння з нормою:</p><img src="https://medibor.edu/ecg/normal_sinus.jpg" alt="Normal ECG" />'
        )
    );

    -- Матеріал 2.3: PDF (Довідник)
    INSERT INTO learning_materials (module_id, material_type, file_url, file_mime_type, download_allowed)
    VALUES (
        v_mod_pathology_id,
        'document',
        'https://medibor.edu/docs/ecg_interpretation_guide_2025.pdf',
        'application/pdf',
        true
    );

    -- Тест до Модуля 2
    WITH q_set AS (
        INSERT INTO quiz_sets (module_id, time_limit_minutes, passing_score, attempts_allowed)
        VALUES (v_mod_pathology_id, 45, 85, 2) RETURNING id
    )
    INSERT INTO quiz_questions (quiz_set_id, question_type, question, options, correct_answers)
    SELECT id, 'multiple', 'Які відведення ЕКГ відображають нижню стінку лівого шлуночка?', 
           '{"A": "I, aVL", "B": "II, III, aVF", "C": "V1-V4", "D": "V5-V6"}'::jsonb, 
           '["B"]'::jsonb
    FROM q_set;

    -- =========================================================
    -- МОДУЛЬ 3: ЛІКУВАННЯ ТА КЛІНІЧНІ ВИПАДКИ
    -- =========================================================
    INSERT INTO course_modules (course_id, title, position)
    VALUES (v_course_id, 'Модуль 3: Фармакотерапія та Інтервенції', 3)
    RETURNING id INTO v_mod_treatment_id;

    -- Матеріал 3.1: Інтерактивний кейс (Link)
    INSERT INTO learning_materials (module_id, material_type, external_url, content)
    VALUES (
        v_mod_treatment_id,
        'link',
        'https://interactive-cases.medibor.edu/case/554',
        jsonb_build_object('description', 'Симулятор пацієнта: Гострий коронарний синдром. Прийміть рішення за 5 хвилин.')
    );

    -- Матеріал 3.2: Завдання (Assignment)
    INSERT INTO assignments (module_id, instructions, max_score, deadline)
    VALUES (
        v_mod_treatment_id,
        'Завантажте фото або скан вашого розшифрування ЕКГ пацієнта №34 (файл у додатках) та напишіть план лікування.',
        100,
        NOW() + INTERVAL '14 days'
    );

    -- =========================================================
    -- ЗАПИС СТУДЕНТА ТА ПРОГРЕС
    -- =========================================================
    INSERT INTO enrollments (user_id, course_id, status, started_at)
    VALUES (v_student_id, v_course_id, 'active', NOW())
    RETURNING id INTO v_enrollment_id;

    -- Відмічаємо, що студент прочитав першу лекцію і подивився діаграму
    INSERT INTO lesson_progress (enrollment_id, material_id, viewed, completed, time_spent)
    VALUES 
    (v_enrollment_id, v_mat_text_intro_id, true, true, 900), -- 15 хв
    (v_enrollment_id, v_mat_img_heart_id, true, true, 120);  -- 2 хв

END $$;