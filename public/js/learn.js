// public/js/learn.js

// These are assumed to be available globally from the learn.hbs template
// const courseId = '...'; 
// const lessons = [...]; // The full list of lesson objects {id, title, ...}
// let currentLessonId = '...'; // The ID of the initially loaded lesson

let completedLessons = {}; // Store by lesson ID: { "lessonId1": true, "lessonId2": true }
let currentLessonData = null;

// --- Helper Functions ---
function getAuthHeader() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function findLessonIndex(lessonId) {
    return lessons.findIndex(l => l.id === lessonId);
}

// --- Data Fetching ---

async function loadUserProgress() {
    try {
        const response = await fetch(`/api/progress/${courseId}`, {
            headers: getAuthHeader()
        });
        if (!response.ok) throw new Error('Failed to load progress');
        const progress = await response.json();
        completedLessons = progress.completedLessons || {};
        updateLessonsNavigation();
    } catch (error) {
        console.error('Error loading user progress:', error);
        // Handle cases where user is not logged in
        document.getElementById('lessonProgress').textContent = 'Увійдіть, щоб бачити прогрес';
    }
}

async function loadLesson(lessonId) {
    // We already have the lesson list, we just need to get the full content
    try {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) throw new Error('Lesson not found in the initial list');

        // We can assume the full content is loaded initially, 
        // or fetch it if it's too large. For now, assume it's pre-loaded.
        currentLessonData = lesson; 
        currentLessonId = lessonId;
        
        displayLesson(currentLessonData);
        updateLessonsNavigation();
        updateNavigationButtons();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error('Error loading lesson:', error);
        document.getElementById('lessonContent').innerHTML = '<p class="error">Помилка завантаження уроку.</p>';
    }
}

// --- UI Updates ---

function displayLesson(lesson) {
    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonContent').innerHTML = `
        <h2>${lesson.title}</h2>
        <p><strong>Тривалість:</strong> ${lesson.duration}</p>
        <div>${lesson.content}</div>
    `;

    const videoContainer = document.getElementById('videoContainer');
    const video = document.getElementById('lessonVideo');
    if (lesson.video_url) {
        video.src = lesson.video_url;
        videoContainer.style.display = 'block';
    } else {
        videoContainer.style.display = 'none';
    }

    const quizContainer = document.getElementById('quizContainer');
    if (lesson.quizzes && lesson.quizzes.length > 0) {
        displayQuiz(lesson.quizzes);
        quizContainer.style.display = 'block';
    } else {
        quizContainer.style.display = 'none';
    }
}

function displayQuiz(quizzes) {
    const quizQuestions = document.getElementById('quizQuestions');
    quizQuestions.innerHTML = '';
    quizzes.forEach((quiz, qIndex) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'quiz-question';
        questionDiv.innerHTML = `
            <h4>Питання ${qIndex + 1}: ${quiz.question}</h4>
            <div class="quiz-options">
                ${quiz.options.map((option, oIndex) => `
                    <div class="quiz-option" data-question="${qIndex}" data-option="${oIndex}">${option}</div>
                `).join('')}
            </div>
        `;
        quizQuestions.appendChild(questionDiv);
    });

    document.querySelectorAll('.quiz-option').forEach(option => {
        option.addEventListener('click', function() {
            const qIndex = this.dataset.question;
            document.querySelectorAll(`.quiz-option[data-question="${qIndex}"]`).forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

function updateLessonsNavigation() {
    const lessonItems = document.querySelectorAll('.lesson-nav-item');
    lessonItems.forEach(item => {
        const lessonId = item.dataset.lessonId;
        item.classList.remove('active', 'completed');
        if (completedLessons[lessonId]) {
            item.classList.add('completed');
        }
        if (lessonId === currentLessonId) {
            item.classList.add('active');
        }
    });
    const completedCount = Object.keys(completedLessons).length;
    document.getElementById('lessonProgress').textContent = `${completedCount} / ${lessons.length}`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevLesson');
    const nextBtn = document.getElementById('nextLesson');
    const currentIndex = findLessonIndex(currentLessonId);

    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === lessons.length - 1;

    prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
    nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
}

// --- Actions ---

async function completeLesson() {
    if (completedLessons[currentLessonId]) return;

    try {
        const response = await fetch('/api/progress/update', {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({
                courseId: courseId,
                lessonId: currentLessonId,
                completed: true
            })
        });
        if (!response.ok) throw new Error('Failed to save progress');
        
        completedLessons[currentLessonId] = true;
        updateLessonsNavigation();

        // Show success message
        const message = document.createElement('div');
        message.className = 'form-message success';
        message.textContent = 'Урок успішно завершено!';
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);

    } catch (error) {
        console.error('Error saving progress:', error);
        alert('Не вдалося зберегти прогрес. Будь ласка, увійдіть в акаунт.');
    }
}

function checkQuiz() {
    if (!currentLessonData.quizzes) return;
    let allCorrect = true;
    currentLessonData.quizzes.forEach((quiz, qIndex) => {
        const selected = document.querySelector(`.quiz-option[data-question="${qIndex}"].selected`);
        const options = document.querySelectorAll(`.quiz-option[data-question="${qIndex}"]`);
        
        options.forEach(opt => opt.classList.remove('correct', 'incorrect'));
        options[quiz.correct_answer].classList.add('correct');

        if (!selected || parseInt(selected.dataset.option) !== quiz.correct_answer) {
            allCorrect = false;
            if(selected) selected.classList.add('incorrect');
        }
    });

    if (allCorrect) {
        alert('Вітаємо! Ви правильно відповіли на всі питання!');
        completeLesson();
    } else {
        alert('Деякі відповіді неправильні. Спробуйте ще раз!');
    }
}

// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof courseId !== 'undefined') {
        await loadUserProgress();
        await loadLesson(currentLessonId);

        document.querySelectorAll('.lesson-nav-item').forEach(item => {
            item.addEventListener('click', () => loadLesson(item.dataset.lessonId));
        });

        document.getElementById('prevLesson').addEventListener('click', () => {
            const currentIndex = findLessonIndex(currentLessonId);
            if (currentIndex > 0) {
                loadLesson(lessons[currentIndex - 1].id);
            }
        });

        document.getElementById('nextLesson').addEventListener('click', () => {
            const currentIndex = findLessonIndex(currentLessonId);
            if (currentIndex < lessons.length - 1) {
                loadLesson(lessons[currentIndex + 1].id);
            }
        });

        document.getElementById('completeLesson').addEventListener('click', () => {
            if (currentLessonData.quizzes && currentLessonData.quizzes.length > 0) {
                const allAnswered = currentLessonData.quizzes.every((_, qIndex) => 
                    document.querySelector(`.quiz-option[data-question="${qIndex}"].selected`)
                );
                if (!allAnswered) {
                    alert('Будь ласка, дайте відповіді на всі питання тесту.');
                    return;
                }
                checkQuiz();
            } else {
                completeLesson();
            }
        });

        const checkQuizBtn = document.getElementById('checkQuiz');
        if(checkQuizBtn) checkQuizBtn.addEventListener('click', checkQuiz);
    }
});