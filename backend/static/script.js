/* =============================================
   1. BUBBLES CANVAS ANIMATION
============================================= */
(function() {
  const canvas = document.getElementById('bubble-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, bubbles = [];

  const COLORS = [
    'rgba(255,45,120,',
    'rgba(183,33,255,',
    'rgba(0,212,255,',
    'rgba(255,110,180,',
    'rgba(0,255,204,',
    'rgba(255,179,71,'
  ];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function mkBubble() {
    return {
      x: Math.random() * W,
      y: H + Math.random() * 200,
      r: 8 + Math.random() * 30,
      dx: (Math.random() - 0.5) * 0.8,
      dy: -(0.4 + Math.random() * 1.2),
      col: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: 0.05 + Math.random() * 0.2,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02
    };
  }

  for (let i = 0; i < 55; i++) {
    const b = mkBubble();
    b.y = Math.random() * H; // scatter on load
    bubbles.push(b);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const b of bubbles) {
      b.wobble += b.wobbleSpeed;
      b.x += b.dx + Math.sin(b.wobble) * 0.5;
      b.y += b.dy;
      if (b.y < -100) {
        Object.assign(b, mkBubble());
      }

      // Draw bubble with shine
      const grad = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.1, b.x, b.y, b.r);
      grad.addColorStop(0, b.col + (b.alpha * 1.8) + ')');
      grad.addColorStop(0.5, b.col + b.alpha + ')');
      grad.addColorStop(1, b.col + '0.02)');

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Outline
      ctx.strokeStyle = b.col + (b.alpha * 1.5) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Shine dot
      ctx.beginPath();
      ctx.arc(b.x - b.r*0.28, b.y - b.r*0.28, b.r*0.18, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* =============================================
   2. TYPING ANIMATION
============================================= */
(function() {
  const phrases = [
    'Student 📚',
    'Future Data Analyst 📊',
    'Technology Enthusiast 💻',
    'Problem Solver 🧩',
    'Dream Builder ✨'
  ];
  const el = document.getElementById('typed');
  let pi = 0, ci = 0, deleting = false;

  function type() {
    const phrase = phrases[pi];
    if (!deleting) {
      ci++;
      el.textContent = phrase.slice(0, ci);
      if (ci === phrase.length) {
        deleting = true;
        setTimeout(type, 1600);
        return;
      }
    } else {
      ci--;
      el.textContent = phrase.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
      }
    }
    setTimeout(type, deleting ? 55 : 90);
  }
  type();
})();

/* =============================================
   3. SCROLL REVEAL
============================================= */
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (i % 4) * 0.08 + 's';
      e.target.classList.add('visible');
      revealObserver.unobserve(e.target);
      // Animate bars if inside this element
      e.target.querySelectorAll('.bar-fill').forEach(b => {
        b.style.width = b.dataset.width + '%';
      });
      e.target.querySelectorAll('.skill-mini-fill').forEach(b => {
        b.style.width = b.dataset.width + '%';
      });
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => revealObserver.observe(el));

// Also observe parent sections for bars in grouped reveals
document.querySelectorAll('.bar-fill, .skill-mini-fill').forEach(b => {
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      b.style.width = b.dataset.width + '%';
      obs.disconnect();
    }
  }, { threshold: 0.3 });
  obs.observe(b);
});

/* =============================================
   4. DARK / LIGHT MODE TOGGLE
============================================= */
const toggleBtn = document.getElementById('theme-toggle');
const label = document.getElementById('theme-label');
let dark = true;
toggleBtn.addEventListener('click', () => {
  dark = !dark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  toggleBtn.textContent = '';
  toggleBtn.innerHTML = (dark ? '🌙' : '☀️') + ' <span id="theme-label">' + (dark ? 'Dark' : 'Light') + '</span>';
});

/* =============================================
   5. HAMBURGER MENU
============================================= */
const ham = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
ham.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

/* =============================================
   6. RIPPLE EFFECT ON BUTTONS
============================================= */
document.querySelectorAll('.btn, .btn-sm').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    const rect = btn.getBoundingClientRect();
    ripple.style.left = (e.clientX - rect.left - 30) + 'px';
    ripple.style.top = (e.clientY - rect.top - 30) + 'px';
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 700);
  });
});

/* =============================================
   7. CONTACT FORM HANDLER (wired to backend)
============================================= */
function _getStatusEl() {
  return document.getElementById('cstat') || document.getElementById('form-status');
}

function submitForm() {
  const name = document.getElementById('fname').value.trim();
  const email = document.getElementById('femail').value.trim();
  const msg = document.getElementById('fmsg').value.trim();
  const status = _getStatusEl();

  if (!name || !email || !msg) {
    status.textContent = '⚠️ Please fill in all fields!';
    status.style.color = '#ff8888';
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    status.textContent = '⚠️ Please enter a valid email!';
    status.style.color = '#ff8888';
    return;
  }

  const btn = document.getElementById('send-btn');
  btn.textContent = '✨ Sending...';
  btn.disabled = true;

  fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message: msg })
  })
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        const msg = (data && data.error) ? data.error : 'Something went wrong. Please try again.';
        throw new Error(msg);
      }
      status.textContent = '💖 Message sent! I\'ll get back to you soon~';
      status.style.color = 'var(--mint)';
      document.getElementById('fname').value = '';
      document.getElementById('femail').value = '';
      document.getElementById('fmsg').value = '';
    })
    .catch((err) => {
      status.textContent = '⚠️ ' + (err && err.message ? err.message : 'Failed to send message.');
      status.style.color = '#ff8888';
    })
    .finally(() => {
      btn.textContent = '✦ Send Message';
      btn.disabled = false;
    });
}

/* Increment visitor counter once per page load */
fetch('/api/visit', { method: 'POST' }).catch(() => {});

/* =============================================
   8. SMOOTH SCROLL FOR NAV
============================================= */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

