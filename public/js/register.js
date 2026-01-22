// public/js/register.js
document.addEventListener('DOMContentLoaded', function () {
  const registerForm = document.getElementById('registerForm');
  const registerError = document.getElementById('registerError');
  const registerSuccess = document.getElementById('registerSuccess');

  if (!registerForm) return; // safety guard

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    registerError.style.display = 'none';
    registerSuccess.style.display = 'none';

    const fullName = document.getElementById('registerFullName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

    // Validation
    if (!fullName) {
      showError('Будь ласка, вкажіть ваше ім\'я');
      return;
    }

    if (!email) {
      showError('Будь ласка, вкажіть ваш email');
      return;
    }

    if (password.length < 6) {
      showError('Пароль повинен містити принаймні 6 символів');
      return;
    }

    if (password !== passwordConfirm) {
      showError('Паролі не збігаються');
      return;
    }

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          full_name: fullName,
          email: email, 
          password: password 
        })
      });

      if (!response.ok) {
        let errorMsg = 'Помилка реєстрації';
        try {
          const err = await response.json();
          errorMsg = err?.message || errorMsg;
        } catch (parseErr) {
          console.error('Failed to parse error response:', parseErr);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      // Show success message
      registerSuccess.textContent = 'Реєстрація успішна! Переходимо на сторінку входу...';
      registerSuccess.style.display = 'block';
      
      // Clear form
      registerForm.reset();

      // Redirect to login after 2 seconds
      setTimeout(() => {
        $('#registerModal').modal('hide');
        $('#loginModal').modal('show');
      }, 2000);

    } catch (err) {
      showError(err.message);
    }
  });

  function showError(message) {
    registerError.textContent = message;
    registerError.style.display = 'block';
  }
});
