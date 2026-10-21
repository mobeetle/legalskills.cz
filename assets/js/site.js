/* ==========================================================================
   LegalSkills.cz — site.js
   Theme, nav, filters, accordion, code copy/highlight, interactive demos.
   No dependencies. Language comes from <html lang>.
   ========================================================================== */
(function () {
  'use strict';

  var html = document.documentElement;
  var LANG = (html.getAttribute('lang') || 'cs').slice(0, 2);
  var T = {
    cs: {
      dark: 'Tmavý režim', light: 'Světlý režim',
      copied: 'Zkopírováno', copy: 'Kopírovat',
      noMatch: 'Nenalezeny žádné odpovídající položky',
      running: 'Probíhá analýza…', ready: 'Připraveno'
    },
    en: {
      dark: 'Dark mode', light: 'Light mode',
      copied: 'Copied', copy: 'Copy',
      noMatch: 'Nothing found',
      running: 'Running', ready: 'Ready'
    }
  }[LANG] || {};

  /* --- Theme ------------------------------------------------------------- */
  var saved = null;
  try { saved = localStorage.getItem('ls-theme'); } catch (e) {}
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  function applyTheme(theme) {
    if (theme === 'light') { html.classList.add('theme-light'); html.classList.remove('theme-dark'); }
    else { html.classList.add('theme-dark'); html.classList.remove('theme-light'); }
    document.querySelectorAll('[data-theme-label]').forEach(function (el) {
      el.textContent = theme === 'light' ? T.dark : T.light;
    });
    document.querySelectorAll('[data-theme-icon]').forEach(function (el) {
      el.innerHTML = theme === 'light'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
    });
  }
  // Default to the sand light theme; respect an explicit OS dark preference.
  // (This ternary previously resolved to 'dark' on both branches, so
  //  prefers-color-scheme was computed and then ignored.)
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  document.querySelectorAll('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var next = html.classList.contains('theme-light') ? 'dark' : 'light';
      try { localStorage.setItem('ls-theme', next); } catch (e) {}
      applyTheme(next);
    });
  });

  /* --- Mobile nav -------------------------------------------------------- */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var navLinks = document.querySelector('[data-nav-links]');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function (e) { e.stopPropagation(); navLinks.classList.toggle('open'); });
    document.addEventListener('click', function () { navLinks.classList.remove('open'); });
  }

  /* --- Footer year ------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* --- Copy buttons ------------------------------------------------------ */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var block = btn.closest('.code').querySelector('code');
      if (!block) return;
      navigator.clipboard.writeText(block.textContent).then(function () {
        var old = btn.textContent;
        btn.textContent = '✓ ' + T.copied;
        btn.classList.add('done');
        setTimeout(function () { btn.textContent = old; btn.classList.remove('done'); }, 1600);
      });
    });
  });

  /* --- Light syntax highlight ------------------------------------------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function highlight(code) {
    var re = /(\/\/[^\n]*|#(?![0-9a-fA-F]{3,6}\b)[^\n]*|--[^\n]*)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|(\b(?:import|export|from|const|let|var|function|class|return|if|else|for|of|await|async|new|def|as|with|in|and|or|not)\b)|(\b[A-Z][A-Z0-9_]{1,}\b)|(\b\d+(?:\.\d+)?\b)|(\$?\b[a-zA-Z_][a-zA-Z0-9_]*\b(?=\())/g;
    return esc(code).replace(re, function (m, c, s, k, n, num, f) {
      if (c) return '<span class="tok-c">' + m + '</span>';
      if (s) return '<span class="tok-s">' + m + '</span>';
      if (k) return '<span class="tok-k">' + m + '</span>';
      if (n) return '<span class="tok-n">' + m + '</span>';
      if (num) return '<span class="tok-v">' + m + '</span>';
      if (f) return '<span class="tok-f">' + m + '</span>';
      return m;
    });
  }
  document.querySelectorAll('.code pre code[data-raw]').forEach(function (el) {
    el.innerHTML = highlight(el.textContent.replace(/\s+$/, ''));
  });

  /* --- Skill / blog filter ---------------------------------------------- */
  function setupFilter(opts) {
    var input = document.querySelector(opts.input);
    var btns = Array.prototype.slice.call(document.querySelectorAll(opts.btn));
    var cards = Array.prototype.slice.call(document.querySelectorAll(opts.card));
    var empty = document.querySelector(opts.empty);
    if (!cards.length) return;
    var cat = 'all', q = '';
    function run() {
      var n = 0;
      cards.forEach(function (c) {
        var hay = ((c.dataset.title || '') + ' ' + (c.dataset.tags || '') + ' ' + c.textContent).toLowerCase();
        var ok = (cat === 'all' || c.dataset.cat === cat) && (!q || hay.indexOf(q) > -1);
        c.classList.toggle('hidden', !ok);
        if (ok) n++;
      });
      if (empty) empty.classList.toggle('hidden', n > 0);
    }
    if (input) input.addEventListener('input', function (e) { q = e.target.value.toLowerCase().trim(); run(); });
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        cat = b.dataset.filter || 'all';
        run();
      });
    });
  }
  setupFilter({ input: '#skill-search', btn: '[data-filter]', card: '[data-skill]', empty: '#skill-empty' });
  setupFilter({ input: '#blog-search', btn: '[data-bcat]', card: '[data-post]', empty: '#blog-empty' });

  /* --- Docs scrollspy ----------------------------------------------------- */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var secs = tocLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* --- Copy chips (command copy-to-clipboard) ----------------------------- */
  document.querySelectorAll('[data-copy-text]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      var txt = btn.getAttribute('data-copy-text');
      if (!txt) return;
      navigator.clipboard.writeText(txt).then(function () {
        btn.classList.add('done');
        setTimeout(function () { btn.classList.remove('done'); }, 1400);
      });
    });
  });

  /* --- Scroll reveal ----------------------------------------------------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }
  // Fail-safe: never leave content hidden if the observer is throttled or blocked.
  setTimeout(function () {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }, 1200);

  /* --- Cookie consent (ponytail: localStorage only, no libs) ---------------- */
  var KEY = 'ls-consent-v2';
  try { localStorage.removeItem('ls-consent'); } catch (e) {} // drop v1 choice, re-ask once
  var bar = document.querySelector('[data-cookie-bar]');
  if (bar) {
    var txt = bar.querySelector('[data-cookie-text]');
    var link = bar.querySelector('[data-cookie-link]');
    var lang2 = (document.documentElement.getAttribute('lang') || 'cs').slice(0, 2);
    var en2 = lang2 === 'en';
    if (txt) txt.textContent = en2
      ? 'We use necessary storage only until you agree. Analytics and marketing load only after OK.'
      : 'Bez vašeho „OK“ běží jen nezbytné úložiště. Analytika a marketing až po souhlasu.';
    if (link) { link.href = en2 ? '/en/cookies.html' : '/cookies.html'; link.textContent = en2 ? 'More' : 'Více'; }
    bar.querySelector('[data-cookie-accept]').textContent = 'OK';
    bar.querySelector('[data-cookie-reject]').textContent = en2 ? 'Reject' : 'Odmítnout';
    var stored = null;
    try { stored = localStorage.getItem(KEY); } catch (e) {}
    if (!stored) bar.classList.remove('hidden');
    function save(v) {
      try { localStorage.setItem(KEY, JSON.stringify({ necessary: true, analytics: v, marketing: v, ts: Date.now() })); } catch (e) {}
      window.LSConsent = { necessary: true, analytics: v, marketing: v };
      bar.classList.add('hidden');
    }
    bar.querySelector('[data-cookie-accept]').addEventListener('click', function () { save(true); });
    bar.querySelector('[data-cookie-reject]').addEventListener('click', function () { save(false); });
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (s) window.LSConsent = s;
    } catch (e) {}
  }
  document.querySelectorAll('[data-cookie-reset]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      location.reload();
    });
  });

  /* --- Download gate (ponytail: fetch + localStorage only, no libs) --------- */
  var DL_KEY = 'ls-dl-v1';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.querySelectorAll('[data-dl]').forEach(function (root) {
    var form = root.querySelector('[data-dl-form]');
    var nameEl = root.querySelector('[data-dl-name]');
    var emailEl = root.querySelector('[data-dl-email]');
    var consentEl = root.querySelector('[data-dl-consent]');
    var submit = root.querySelector('[data-dl-submit]');
    var err = root.querySelector('[data-dl-error]');
    var linksBox = root.querySelector('[data-dl-links]');
    var expEl = root.querySelector('[data-dl-expiry]');
    if (!form || !linksBox) return;
    var en = (document.documentElement.getAttribute('lang') || 'cs').slice(0, 2) === 'en';
    var MSG = en
      ? { name: 'Please enter your name.', email: 'Please check the e-mail address.',
          consent: 'Please tick the news consent.', server: 'Sending failed, please try again.' }
      : { name: 'Zadejte prosím jméno.', email: 'Zkontrolujte prosím e-mail.',
          consent: 'Prosím potvrďte souhlas s novinkami.', server: 'Odeslání se nezdařilo, zkuste to prosím znovu.' };
    function fail(msg) { if (err) { err.textContent = msg; err.classList.remove('hidden'); } }
    function hideErr() { if (err) err.classList.add('hidden'); }
    function render(data) {
      linksBox.querySelectorAll('[data-dl-file]').forEach(function (box) {
        var file = box.getAttribute('data-dl-file');
        var hit = (data.links || []).filter(function (l) { return l.file === file; })[0];
        var slot = box.querySelector('.btn');
        if (hit && slot) {
          var a = document.createElement('a');
          a.className = 'btn btn-primary btn-sm';
          a.href = hit.url;
          a.textContent = en ? 'Download' : 'Stáhnout';
          slot.replaceWith(a);
        } else if (slot) {
          slot.classList.add('dl-locked');
        }
      });
      root.classList.add('dl-open');
      if (expEl && data.expiresAt) {
        var d = new Date(data.expiresAt);
        expEl.textContent = (en ? 'Links valid until ' : 'Odkazy platí do ') + d.toLocaleString(en ? 'en-GB' : 'cs-CZ');
        expEl.classList.remove('hidden');
      }
    }
    try {
      var saved = JSON.parse(localStorage.getItem(DL_KEY) || 'null');
      if (saved && saved.expiresAt && new Date(saved.expiresAt).getTime() > Date.now()) render(saved);
      else if (saved) { try { localStorage.removeItem(DL_KEY); } catch (e) {} }
    } catch (e) {}
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      hideErr();
      if (nameEl.value.trim().length < 2) return fail(MSG.name);
      if (!EMAIL_RE.test(emailEl.value.trim())) return fail(MSG.email);
      if (!consentEl.checked) return fail(MSG.consent);
      submit.disabled = true;
      fetch('/api/request-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameEl.value.trim(), email: emailEl.value.trim(), consent: true, lang: en ? 'en' : 'cs' })
      }).then(function (r) { return r.json(); }).then(function (data) {
        if (data && data.ok) {
          try { localStorage.setItem(DL_KEY, JSON.stringify(data)); } catch (e) {}
          render(data);
        } else { fail(MSG.server); }
      }).catch(function () { fail(MSG.server); })
      .then(function () { submit.disabled = false; });
    });
  });
})();
