// ===== AUTH =====
const Auth = {
  init() {
    // View toggles
    document.getElementById('goto-signup').onclick = () => Auth.show('signup');
    document.getElementById('goto-login').onclick = () => Auth.show('login');
    document.getElementById('goto-forgot').onclick = () => Auth.show('forgot');
    document.getElementById('goto-login2').onclick = () => Auth.show('login');

    // Forms
    document.getElementById('login-form').onsubmit = Auth.handleLogin;
    document.getElementById('signup-form').onsubmit = Auth.handleSignup;
    document.getElementById('forgot-form').onsubmit = Auth.handleForgot;
  },

  show(view) {
    ['login', 'signup', 'forgot'].forEach(v => {
      document.getElementById(`${v}-view`).classList.toggle('hidden', v !== view);
    });
  },

  async handleLogin(e) {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Logging in...';

    try {
      const data = await Api.login({
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value,
      });
      Api.setSession(data.token, data.userId);
      App.showApp();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Login';
    }
  },

  async handleSignup(e) {
    e.preventDefault();
    const errEl = document.getElementById('signup-error');
    const okEl = document.getElementById('signup-success');
    errEl.classList.add('hidden');
    okEl.classList.add('hidden');

    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    if (password !== confirm) {
      errEl.textContent = 'Passwords do not match';
      errEl.classList.remove('hidden');
      return;
    }

    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Creating...';

    try {
      const data = await Api.register({
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        password,
      });
      okEl.textContent = data.message + ' Please login.';
      okEl.classList.remove('hidden');
      e.target.reset();
      setTimeout(() => Auth.show('login'), 1500);
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    } finally {
      btn.disabled = false; btn.textContent = 'Sign Up';
    }
  },

  async handleForgot(e) {
    e.preventDefault();
    const msgEl = document.getElementById('forgot-msg');
    try {
      const data = await Api.forgotPassword(document.getElementById('forgot-email').value);
      msgEl.textContent = data.message;
      msgEl.classList.remove('hidden');
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.classList.remove('hidden');
    }
  },
};
