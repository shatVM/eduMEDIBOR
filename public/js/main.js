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
  const animatedElements = document.querySelectorAll('.course-card, .advantage-card, .stat-item, .value-item, .benefit-item, .certificate-item, .addresses-list');

  if (animatedElements.length > 0) {
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // Stop observing after animation
      }
    });
    }, observerOptions);

    animatedElements.forEach(el => {
      el.classList.add('animate-on-scroll');
      observer.observe(el);
    });
  }
  
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
        
        let data;
        try {
          data = await response.json();
        } catch (parseErr) {
          console.error('Failed to parse response:', parseErr);
          data = {};
        }

        if (response.ok) {
          localStorage.setItem('authToken', data.token);
          window.location.href = '/'; // Redirect to homepage
        } else {
          throw new Error(data?.message || 'Login failed');
        }
      } catch (error) {
        if (messageEl) {
            messageEl.textContent = error?.message || 'An error occurred';
            messageEl.className = 'form-message error';
        } else {
            alert(error?.message || 'An error occurred');
        }
      }
    });
  }

  // Certificate modal image swap: set modal image src from thumbnail data
  document.querySelectorAll('.certificate-item img[data-img-src]').forEach(img => {
    img.addEventListener('click', (e) => {
      const src = img.getAttribute('data-img-src') || img.src;
      const modalImg = document.getElementById('modalCertificateImage');
      if (modalImg) modalImg.src = src;
    });
  });

});