const users = { Nuno: '123!', Martijn: '123!' };
const form = document.getElementById('login-form');
form.addEventListener('submit', e => {
  e.preventDefault();
  const u = document.getElementById('username').value;
  const p = document.getElementById('password').value;
  const err = document.getElementById('error');
  if (users[u] === p) {
    localStorage.setItem('user', u);
    window.location.href = 'home/';
  } else err.textContent = 'Ongeldige login.';
});
