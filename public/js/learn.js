// public/js/learn.js

let completedLessons = [];
let currentLessonData = null;

// Завантаження прогресу користувача
async function loadUserProgress() {
  try {
    const response = await fetch(`/api/progress/${userId}/${courseId}`);
    const progress = await response.json();
    completedLessons = progress.completedLessons || [];
    updateLessonsNavigation();
  } catch (error) {
    console.error('Помилка завантаження прогресу:', error);
  }
}

// Оновлення навігації уроків
function updateLessonsNavigation() {
  const lessonItems = document.querySelectorAll('.lesson-nav-item');
  lessonItems.forEach((item, index) => {
    if (completedLessons.includes(index)) {
      item.classList.add('completed');
    }
    if (index === currentLesson) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Оновлення прогресу
  document.getElementById('lessonProgress').textContent = 
    `${completedLessons.length} / ${totalLessons}`;
}

// Завантаження уроку
async function loadLesson(lessonIndex) {
  try {
    const response = await fetch(`/api/course/${courseId}/lesson/${lessonIndex}`);
    currentLessonData = await response.json();
    
    // Оновлення заголовка
    document.getElementById('lessonTitle').textContent = currentLessonData.title;
    
    // Оновлення контенту
    document.getElementById('lessonContent').innerHTML = `
      <h2>${currentLessonData.title}</h2>
      <p><strong>Тривалість:</strong> ${currentLessonData.duration}</p>
      <div style="margin-top: 20px;">
        ${currentLessonData.content}
      </div>
    `;
    
    // Відображення відео якщо є
    const videoContainer = document.getElementById('videoContainer');
    const video = document.getElementById('lessonVideo');
    if (currentLessonData.videoUrl) {
      video.src = currentLessonData.videoUrl;
      videoContainer.style.display = 'block';
    } else {
      videoContainer.style.display = 'none';
    }
    
    // Відображення тесту якщо є
    const quizContainer = document.getElementById('quizContainer');
    if (currentLessonData.quiz && currentLessonData.quiz.length > 0) {
      displayQuiz(currentLessonData.quiz);
      quizContainer.style.display = 'block';
    } else {
      quizContainer.style.display = 'none';
    }
    
    // Оновлення кнопок навігації
    updateNavigationButtons();
    
    // Прокрутка до верху
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('Помилка завантаження уроку:', error);
    document.getElementById('lessonContent').innerHTML = 
      '<p style="color: red;">Помилка завантаження уроку. Спробуйте пізніше.</p>';
  }
}

// Відображення тесту
function displayQuiz(quiz) {
  const quizQuestions = document.getElementById('quizQuestions');
  quizQuestions.innerHTML = '';
  
  quiz.forEach((question, qIndex) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'quiz-question';
    questionDiv.innerHTML = `
      <h4>Питання ${qIndex + 1}: ${question.question}</h4>
      <div class="quiz-options">
        ${question.options.map((option, oIndex) => `
          <div class="quiz-option" data-question="${qIndex}" data-option="${oIndex}">
            ${option}
          </div>
        `).join('')}
      </div>
    `;
    quizQuestions.appendChild(questionDiv);
  });
  
  // Додавання обробників для опцій
  document.querySelectorAll('.quiz-option').forEach(option => {
    option.addEventListener('click', function() {
      const questionIndex = this.dataset.question;
      // Видалення попереднього вибору
      document.querySelectorAll(`.quiz-option[data-question="${questionIndex}"]`).forEach(opt => {
        opt.classList.remove('selected');
      });
      // Вибір нової опції
      this.classList.add('selected');
    });
  });
}

// Перевірка тесту
function checkQuiz() {
  if (!currentLessonData || !currentLessonData.quiz) return;
  
  let allCorrect = true;
  
  currentLessonData.quiz.forEach((question, qIndex) => {
    const selectedOption = document.querySelector(`.quiz-option[data-question="${qIndex}"].selected`);
    const options = document.querySelectorAll(`.quiz-option[data-question="${qIndex}"]`);
    
    options.forEach((option, oIndex) => {
      option.classList.remove('correct', 'incorrect');
      if (oIndex === question.correct) {
        option.classList.add('correct');
      }
    });
    
    if (!selectedOption || parseInt(selectedOption.dataset.option) !== question.correct) {
      allCorrect = false;
      if (selectedOption) {
        selectedOption.classList.add('incorrect');
      }
    }
  });
  
  if (allCorrect) {
    alert('Вітаємо! Ви правильно відповіли на всі питання!');
    completeLesson();
  } else {
    alert('Деякі відповіді неправильні. Спробуйте ще раз!');
  }
}

// Завершення уроку
async function completeLesson() {
  if (completedLessons.includes(currentLesson)) {
    return; // Урок вже завершено
  }
  
  try {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        courseId,
        lessonIndex: currentLesson,
        completed: true
      })
    });
    
    const data = await response.json();
    if (data.success) {
      completedLessons = data.progress.completedLessons;
      updateLessonsNavigation();
      
      // Показати повідомлення
      const message = document.createElement('div');
      message.className = 'form-message success';
      message.textContent = 'Урок успішно завершено!';
      message.style.position = 'fixed';
      message.style.top = '20px';
      message.style.right = '20px';
      message.style.zIndex = '10000';
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.remove();
      }, 3000);
    }
  } catch (error) {
    console.error('Помилка збереження прогресу:', error);
  }
}

// Оновлення кнопок навігації
function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevLesson');
  const nextBtn = document.getElementById('nextLesson');
  
  prevBtn.disabled = currentLesson === 0;
  nextBtn.disabled = currentLesson === totalLessons - 1;
  
  prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
  nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
}

// Обробники подій
document.addEventListener('DOMContentLoaded', async () => {
  await loadUserProgress();
  await loadLesson(currentLesson);
  
  // Навігація по урокам в сайдбарі
  document.querySelectorAll('.lesson-nav-item').forEach((item, index) => {
    item.addEventListener('click', async () => {
      currentLesson = index;
      updateLessonsNavigation();
      await loadLesson(currentLesson);
    });
  });
  
  // Попередній урок
  document.getElementById('prevLesson').addEventListener('click', async () => {
    if (currentLesson > 0) {
      currentLesson--;
      updateLessonsNavigation();
      await loadLesson(currentLesson);
    }
  });
  
  // Наступний урок
  document.getElementById('nextLesson').addEventListener('click', async () => {
    if (currentLesson < totalLessons - 1) {
      currentLesson++;
      updateLessonsNavigation();
      await loadLesson(currentLesson);
    }
  });
  
  // Завершити урок
  document.getElementById('completeLesson').addEventListener('click', async () => {
    // Якщо є тест, перевірити його
    if (currentLessonData && currentLessonData.quiz && currentLessonData.quiz.length > 0) {
      const allAnswered = currentLessonData.quiz.every((_, qIndex) => {
        return document.querySelector(`.quiz-option[data-question="${qIndex}"].selected`) !== null;
      });
      
      if (!allAnswered) {
        alert('Будь ласка, дайте відповіді на всі питання тесту перед завершенням уроку.');
        return;
      }
      
      checkQuiz();
    } else {
      await completeLesson();
    }
  });
  
  // Перевірка тесту
  const checkQuizBtn = document.getElementById('checkQuiz');
  if (checkQuizBtn) {
    checkQuizBtn.addEventListener('click', checkQuiz);
  }
});