// public/js/main.js

// Function to close mobile menu
function closeMenu() {
  const burgerMenu = document.getElementById('burgerMenu');
  const mobileNav = document.getElementById('mobileNav');
  const navOverlay = document.getElementById('navOverlay');
  
  if (burgerMenu) burgerMenu.classList.remove('active');
  if (mobileNav) mobileNav.classList.remove('active');
  if (navOverlay) navOverlay.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  // Burger menu functionality
  const burgerMenu = document.getElementById('burgerMenu');
  const mobileNav = document.getElementById('mobileNav');
  const navOverlay = document.getElementById('navOverlay');
  
  if (burgerMenu && mobileNav && navOverlay) {
    // Toggle menu on burger click
    burgerMenu.addEventListener('click', () => {
      burgerMenu.classList.toggle('active');
      mobileNav.classList.toggle('active');
      navOverlay.classList.toggle('active');
    });

    // Close menu when clicking on a link
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        // setTimeout to ensure menu closes after click event completes
        setTimeout(closeMenu, 100);
      });
    });

    // Close menu when clicking on overlay
    navOverlay.addEventListener('click', () => {
      closeMenu();
    });

    // Swipe functionality to close menu
    let touchStartX = 0;
    let touchEndX = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });

    function handleSwipe() {
      const swipeDistance = touchStartX - touchEndX;
      
      // Swipe left (closing menu)
      if (swipeDistance > 50 && mobileNav.classList.contains('active')) {
        burgerMenu.classList.remove('active');
        mobileNav.classList.remove('active');
      }
    }
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Animation observer
  const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
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
  
  // --- NEW LOGIN FORM LOGIC ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = e.target.email.value;
      const password = e.target.password.value;
      const messageEl = document.querySelector('.auth-form .form-message');

      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();

        if (response.ok) {
          localStorage.setItem('authToken', data.token);
          window.location.href = '/'; // Redirect to homepage
        } else {
          throw new Error(data.message || 'Login failed');
        }
      } catch (error) {
        if (messageEl) {
            messageEl.textContent = error.message;
            messageEl.className = 'form-message error';
        } else {
            alert(error.message);
        }
      }
    });
  }
  
  
  // --- UPDATED ENROLLMENT FORM LOGIC ---
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
        // The new architecture does not specify an enrollment route. 
        // For now, this is a placeholder. A new route and service will be needed.
        const response = await fetch('/api/enrollments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // If authentication is required for enrollment:
            // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          formMessage.textContent = data.message;
          formMessage.className = 'form-message success';
          enrollmentForm.reset();
        } else {
          throw new Error(data.message || 'Помилка відправки заявки');
        }
      } catch (error) {
        formMessage.textContent = 'Помилка: ' + error.message;
        formMessage.className = 'form-message error';
      }
    });
  }

});