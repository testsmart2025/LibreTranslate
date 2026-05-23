// BorsaBrain Authentication
(function () {
  const CREDENTIALS = {
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
    window.location.href = 'login.html';
  }

  // If on login page and already logged in, redirect
  if (window.location.pathname.indexOf('login') !== -1 || window.location.pathname.endsWith('/')) {
    if (isLoggedIn()) {
      window.location.href = 'index.html';
      return;
    }
  }

  // If on dashboard and NOT logged in, redirect to login
  if (window.location.pathname.indexOf('index') !== -1) {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return;
    }
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
        window.location.href = 'index.html';
      } else {
        errEl.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
        errEl.style.animation = 'none';
        void errEl.offsetHeight;
        errEl.style.animation = 'shake 0.4s ease';
      }
    });
  }

  // Expose logout
  window.bbLogout = logout;
  window.bbIsLoggedIn = isLoggedIn;
})();

function togglePassword() {
  var inp = document.getElementById('password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// Shake animation
var style = document.createElement('style');
style.textContent = '@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}';
document.head.appendChild(style);
