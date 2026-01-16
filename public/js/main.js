// public/js/main.js

// Форма запису на курс
document.addEventListener('DOMContentLoaded', () => {
  const enrollmentForm = document.getElementById('enrollmentForm');
  const formMessage = document.getElementById('formMessage');
  
  if (enrollmentForm) {
    enrollmentForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        name: e.target.name.value,
        phone: e.target.phone.value,
        email: e.target.email.value,
        courseId: e.target.courseId.value
      };
      
      try {
        const response = await fetch('/api/enrollment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success) {
          formMessage.textContent = data.message;
          formMessage.className = 'form-message success';
          enrollmentForm.reset();
          
          setTimeout(() => {
            formMessage.style.display = 'none';
          }, 5000);
        } else {
          throw new Error(data.message || 'Помилка відправки заявки');
        }
      } catch (error) {
        formMessage.textContent = 'Помилка: ' + error.message;
        formMessage.className = 'form-message error';
      }
    });
  }
  
  // Плавна прокрутка до секції
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
  
  // Анімація появи елементів при прокрутці
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  document.querySelectorAll('.course-card, .advantage-card, .stat-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  // Certificate modal logic
  const certificateImages = document.querySelectorAll('.certificate-item img');
  const modalImage = document.getElementById('modalCertificateImage');

  if (modalImage) {
    certificateImages.forEach(image => {
      image.addEventListener('click', () => {
        const imgSrc = image.getAttribute('data-img-src');
        modalImage.setAttribute('src', imgSrc);
      });
    });
  }
});