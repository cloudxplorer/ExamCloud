document.addEventListener('DOMContentLoaded', () => {
  checkAuthState();

  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
      document.getElementById(`${tabName}-form`).classList.add('active');
    });
  });

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleLogin();
  });

  document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSignup();
  });
});

async function checkAuthState() {
  try {
    const { data: { user } } = await window.AUTH.getCurrentUser();
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name
      }));
      window.location.href = 'index.html';
    }
  } catch (error) {}
}

async function handleLogin() {
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const messageEl = document.getElementById('login-message');

  try {
    messageEl.textContent = 'Logging in...';
    messageEl.style.color = 'var(--muted)';
    await window.AUTH.signIn(email, password);
    messageEl.textContent = 'Login successful! Redirecting...';
    messageEl.style.color = 'var(--success)';
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.style.color = 'var(--danger)';
  }
}

async function handleSignup() {
  const fullName = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const messageEl = document.getElementById('signup-message');

  try {
    messageEl.textContent = 'Creating account...';
    messageEl.style.color = 'var(--muted)';
    const { user } = await window.AUTH.signUp(email, password, fullName);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: fullName
      }));
    }
    messageEl.textContent = 'Account created! Please login.';
    messageEl.style.color = 'var(--success)';
    document.querySelector('[data-tab="login"]').click();
    document.getElementById('login-email').value = email;
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.style.color = 'var(--danger)';
  }
}