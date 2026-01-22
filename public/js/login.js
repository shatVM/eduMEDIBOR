// public/js/login.js
document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');

  if (!loginForm) return; // safety guard

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    loginError.style.display = 'none';
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        let errorMsg = 'Login failed';
        try {
          const err = await response.json();
          errorMsg = err?.message || errorMsg;
        } catch (parseErr) {
          console.error('Failed to parse error response:', parseErr);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      // Store token (you may want to use httpOnly cookies instead)
      localStorage.setItem('authToken', data.token);
      // Close modal
      $('#loginModal').modal('hide');
      // Optionally reload or update UI
      location.reload();
    } catch (err) {
      loginError.textContent = err.message;
      loginError.style.display = 'block';
    }
  });
});
