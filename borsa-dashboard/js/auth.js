// BorsaBrain Authentication
(function () {
  var CREDENTIALS = {
    u: [104,97,122,101,109],
    p: [66,111,114,115,97,64,50,48,50,54]
  };

  function decode(arr) {
    return arr.map(function(c) { return String.fromCharCode(c); }).join('');
  }

  function isLoggedIn() {
    var s = sessionStorage.getItem('bb_session');
    if (!s) return false;
    try {
      var d = JSON.parse(atob(s));
      return d.t && (Date.now() - d.t) < 86400000;
    } catch (e) { return false; }
  }

  function setSession() {
    var token = btoa(JSON.stringify({ t: Date.now(), v: 1 }));
    sessionStorage.setItem('bb_session', token);
  }

  function logout() {
    sessionStorage.removeItem('bb_session');
    window.location.href = 'index.html';
  }

  var path = window.location.pathname;
  var isLoginPage = path.endsWith('/') || path.endsWith('/index.html') || path.endsWith('/index.htm') || path === '/';
  var isDashboard = path.indexOf('dashboard') !== -1;

  // On login page and already logged in -> go to dashboard
  if (isLoginPage && isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // On dashboard and NOT logged in -> go to login
  if (isDashboard && !isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  // Login form handler
  var form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = document.getElementById('username').value.trim();
      var p = document.getElementById('password').value;
      var errEl = document.getElementById('loginError');

      if (u === decode(CREDENTIALS.u) && p === decode(CREDENTIALS.p)) {
        setSession();
        window.location.href = 'dashboard.html';
      } else {
        errEl.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        errEl.style.animation = 'none';
        void errEl.offsetHeight;
        errEl.style.animation = 'shake 0.4s ease';
      }
    });
  }

  window.bbLogout = logout;
  window.bbIsLoggedIn = isLoggedIn;
})();

function togglePassword() {
  var inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

var style = document.createElement('style');
style.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
document.head.appendChild(style);
