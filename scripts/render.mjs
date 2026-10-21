// LegalSkills.cz static site renderer — Node.js ESM port of scripts/build_site.py.
// Byte-for-byte identical HTML output. Stdlib only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const SITE = "https://legalskills.cz";
// Asset cache-buster, derived from the asset bytes at module load so it can
// never go stale after a CSS/JS change (a hand-maintained string already bit us).
const ASSET_V = (() => {
  const h = crypto.createHash('sha1');
  for (const f of ['assets/css/aurora.css', 'assets/js/site.js']) {
    try { h.update(fs.readFileSync(new URL('../' + f, import.meta.url))); } catch (e) { h.update(f); }
  }
  return h.digest('hex').slice(0, 8);
})();

// --------------------------------------------------------------------------- //
// html.escape(s, quote=True) — exact Python semantics and order                //
// --------------------------------------------------------------------------- //
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// --------------------------------------------------------------------------- //
// Icons (24x24 stroke)                                                        //
// --------------------------------------------------------------------------- //
const ICONS = {
  "scale": '<path d="M12 3v18M7 21h10M6 7h12M6 7 3 13h6zM18 7l-3 6h6z"/>',
  "eye": '<circle cx="12" cy="12" r="3"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>',
  "pen": '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  "redteam": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 9 6 6M15 9l-6 6"/>',
  "verify": '<path d="M9 12l2 2 4-4"/><path d="M12 2 4 5v6c0 6 8 11 8 11s8-5 8-11V5z"/>',
  "book": '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  "map": '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
  "tag": '<path d="M20.6 13.4 12 22l-9-9V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.4"/>',
  "route": '<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h6a4 4 0 0 0 4-4V7"/>',
  "bolt": '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  "building": '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01"/>',
  "lock": '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  "terminal": '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
  "layers": '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  "cpu": '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
  "folder": '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "shield": '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  "spark": '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  "check": '<path d="M20 6 9 17l-5-5"/>',
  "x": '<path d="M18 6 6 18M6 6l12 12"/>',
  "chev": '<path d="m6 9 6 6 6-6"/>',
  "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
  "bookopen": '<path d="M12 7v14M3 5h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H3zM21 5h-6a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h6z"/>',
  "target": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
  "globe": '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z"/>',
  "compass": '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
  "sun": '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  "moon": '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
};


function icon(name, cls = "") {
  const body = ICONS[name] || "";
  const c = cls ? ` class="${cls}"` : "";
  return `<svg${c} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}


// --------------------------------------------------------------------------- //
// Localisation of shared chrome                                                //
// --------------------------------------------------------------------------- //
const NAV = {
  "cs": [["skills.html", "Dovednosti"], ["how-it-works.html", "Jak to funguje"],
         ["playbooks.html", "Rozšíření a služby"], ["marketplace.html", "Katalog"],
         ["docs.html", "Stažení"], ["blog.html", "Blog"]],
  "en": [["skills.html", "Skills"], ["how-it-works.html", "How it works"],
         ["playbooks.html", "Extensions and Services"], ["marketplace.html", "Catalogue"],
         ["docs.html", "Download"], ["blog.html", "Blog"]],
};
const FOOT = {
  "cs": {
    "product": "Produkt", "res": "Zdroje", "company": "Společnost",
    "tagline": "Sada právních dovedností pro vašeho AI agenta. Funguje s jakýmkoli agentem s podporou skills. Ušetří večery, pohlídá rizika.",
    "motto": "Usnadňujeme právníkům život.",
    "download": "Stažení",
    "skills": "Dovednosti", "how": "Jak to funguje", "playbooks": "Rozšíření a služby",
    "marketplace": "Katalog",
    "blog": "Blog", "about": "O projektu",
    "contact": "Kontakt", "terms": "Podmínky užívání", "privacy": "Ochrana soukromí",
    "cookies": "Cookies",
    "disclaimer": "Nástroj pro přípravu podkladů. Nenahrazuje právníka — konečné slovo máte vždy vy.",
    "rights": "Obsah webu — všechna práva vyhrazena. Stažitelná sada je pod licencí Apache 2.0.",
  },
  "en": {
    "product": "Product", "res": "Resources", "company": "Company",
    "tagline": "A set of legal skills for your AI agent. Works with any agent supporting skills. Fewer late nights, fewer risks.",
    "motto": "We make lawyers' lives easier.",
    "download": "Download",
    "skills": "Skills", "how": "How it works", "playbooks": "Extensions and Services",
    "marketplace": "Catalogue",
    "blog": "Blog", "about": "About",
    "contact": "Contact", "terms": "Terms", "privacy": "Privacy",
    "cookies": "Cookies",
    "disclaimer": "A preparation tool. Not legal advice — you always have the final word.",
    "rights": "Site content — all rights reserved. The downloadable suite is licensed under Apache 2.0.",
  },
};

// Provider / operator (single source of truth for company + contact details).
const PROVIDER = {
  "cs": {
    "name": "Metropolitan advisory s.r.o.",
    "address": "Kaprova 42/14, Staré Město, 110 00 Praha 1",
    "ico": "028 57 626",
    "registry": "Zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 224578.",
    "director": "Jednatel: JUDr. Lukáš Michna, LL.M., Ph.D.",
    "email": "hello@legalskills.cz",
    "web": "legalskills.cz",
    "label": "Provozovatel",
    "controller": "Správce osobních údajů",
  },
  "en": {
    "name": "Metropolitan advisory s.r.o.",
    "address": "Kaprova 42/14, Staré Město, 110 00 Prague 1, Czech Republic",
    "ico": "028 57 626",
    "registry": "Registered in the Commercial Register kept by the Municipal Court in Prague, Section C, Insert 224578.",
    "director": "Managing director: JUDr. Lukáš Michna, LL.M., Ph.D.",
    "email": "hello@legalskills.cz",
    "web": "legalskills.cz",
    "label": "Operator",
    "controller": "Data controller",
  },
};


function L(lang, p) {
  // Root-relative link for a page slug such as 'skills.html' ('' = home).
  const prefix = lang === "en" ? "/en" : "";
  if (p === "" || p === "index.html") return (prefix + "/") || "/";
  return `${prefix}/${p}`;
}


function head(lang, title, desc, slug) {
  const cn = SITE + (slug === "" || slug === "index.html" ? "" : "/" + slug.split(".html").join(""));
  const en = SITE + "/en" + (slug === "" || slug === "index.html" ? "" : "/" + slug.split(".html").join(""));
  const css = "/assets/css/aurora.css?v=" + ASSET_V;
  return `<!DOCTYPE html>
<html lang="${(lang === 'cs' ? 'cs' : 'en')}" class="theme-dark">
<head>
<meta charset="utf-8">
<script>document.documentElement.classList.add('js')</script>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${cn}">
<link rel="alternate" hreflang="cs" href="${cn}">
<link rel="alternate" hreflang="en" href="${en}">
<link rel="alternate" hreflang="x-default" href="${cn}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${cn}">
<meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0a0e1a" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/images/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${css}">
</head>
<body>
<div class="aurora-bg" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>
`;
}


function nav(lang, active) {
  const t = {"cs": {"cta": "Začít", "menu": "Menu", "theme": "Světlý režim"},
             "en": {"cta": "Get started", "menu": "Menu", "theme": "Light mode"}}[lang];
  let links = "";
  for (const [href, label] of NAV[lang]) {
    const cls = href === active ? "nav-link active" : "nav-link";
    links += `<a class="${cls}" href="${L(lang, href)}">${label}</a>`;
  }
  // language toggle, same page both languages
  const here = active || "";
  const cs_on = lang === "cs" ? "on" : "";
  const en_on = lang === "en" ? "on" : "";
  return `<header class="nav">
  <div class="wrap nav-inner">
    <a class="brand" href="${L(lang, '')}">
      <img src="/assets/images/logo.svg" alt="" class="brand-mark">
      <span>Legal<b>Skills</b> <span class="cz">.cz</span></span>
    </a>
    <nav class="nav-links" data-nav-links>
      ${links}
    </nav>
    <div class="nav-actions">
      <span class="lang-toggle" role="group" aria-label="Language">
        <a class="${cs_on}" href="${L('cs', here || '')}" hreflang="cs">CS</a>
        <a class="${en_on}" href="${L('en', here || '')}" hreflang="en">EN</a>
      </span>
      <button class="icon-btn" data-theme-toggle aria-label="${(lang === 'cs' ? 'Přepnout motiv' : 'Toggle theme')}"><span data-theme-icon><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg></span></button>
      <a class="btn btn-primary btn-sm" href="${L(lang, 'docs.html')}">${t['cta']}</a>
      <button class="icon-btn nav-toggle" data-nav-toggle aria-label="${t['menu']}">${icon('menu')}</button>
    </div>
  </div>
</header>
`;
}


function footer(lang) {
  const f = FOOT[lang];
  const p = PROVIDER[lang];
  return `<footer class="footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <a class="brand" href="${L(lang, '')}">
          <img src="/assets/images/logo.svg" alt="" class="brand-mark">
          <span>Legal<b>Skills</b> <span class="cz">.cz</span></span>
        </a>
        <p class="motto">${f['motto']}</p>
        <p>${f['tagline']}</p>
        <p class="small muted mt-2">${f['disclaimer']}</p>
      </div>
      <div>
        <h4>${f['product']}</h4>
        <a href="${L(lang, 'skills.html')}">${f['skills']}</a>
        <a href="${L(lang, 'how-it-works.html')}">${f['how']}</a>
        <a href="${L(lang, 'playbooks.html')}">${f['playbooks']}</a>
        <a href="${L(lang, 'marketplace.html')}">${f['marketplace']}</a>
      </div>
      <div>
        <h4>${f['res']}</h4>
        <a href="${L(lang, 'docs.html')}">${f['download']}</a>
        <a href="${L(lang, 'blog.html')}">${f['blog']}</a>
      </div>
      <div>
        <h4>${f['company']}</h4>
        <a href="${L(lang, 'about.html')}">${f['about']}</a>
        <a href="${L(lang, 'contact.html')}">${f['contact']}</a>
        <a href="${L(lang, 'terms.html')}">${f['terms']}</a>
        <a href="${L(lang, 'privacy.html')}">${f['privacy']}</a>
        <a href="${L(lang, 'cookies.html')}">${f['cookies']}</a>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <span data-year>2026</span> ${p['name']} · ${p['web']} · ${p['address']} · ${(lang === 'cs' ? 'IČO' : 'Company No.')} ${p['ico']}<br>${p['registry']}</span>
      <span>${(lang === 'cs' ? 'Nenahrazuje právní službu' : 'Not legal advice')} · ${f['rights']}</span>
    </div>
  </div>
</footer>
<div class="cookie-bar hidden" data-cookie-bar role="dialog" aria-live="polite" aria-label="Cookies">
  <p class="cookie-title"><strong>🍪 Cookies</strong></p>
  <p class="cookie-text"><span data-cookie-text></span> <a data-cookie-link href="#">Více</a></p>
  <div class="cookie-actions">
    <button class="btn btn-primary btn-sm" data-cookie-accept>OK</button>
    <button class="btn btn-glass btn-sm" data-cookie-reject>Odmítnout</button>
  </div>
</div>
<script src="/assets/js/site.js?v=${ASSET_V}"></script>
</body>
</html>
`;
}


function pageStr(lang, slug, title, desc, body, active) {
  // Render one page string (Python's page() minus the disk write).
  return head(lang, title, desc, slug) + nav(lang, active !== null && active !== undefined ? active : slug) + body + footer(lang);
}


// --------------------------------------------------------------------------- //
// Reusable content chunks                                                      //
// --------------------------------------------------------------------------- //
function checks(lang, items, variant = "gain") {
  const ic = variant === "gain" ? "check" : "x";
  const li = items.map(x => `<li>${icon(ic)}<span>${x}</span></li>`).join("");
  return `<ul class="check-list is-${variant}">${li}</ul>`;
}


function sec_head(kicker, h2, lead = "") {
  const lead_html = lead ? `<p class="lead">${lead}</p>` : "";
  return `<div class="section-head reveal"><span class="kicker">${kicker}</span><h2 class="h2">${h2}</h2>${lead_html}</div>`;
}


function sec_head2(h2, lead = "", badge = "") {
  // Section head where the name itself is the attractor (no dim eyebrow).
  const lead_html = lead ? `<p class="lead">${lead}</p>` : "";
  const badge_html = badge ? `<p class="mt-2"><span class="badge is-gold">${badge}</span></p>` : "";
  return `<div class="section-head reveal"><h2 class="h2">${h2}</h2>${lead_html}${badge_html}</div>`;
}


function sec_split(kicker, h2, lead, body, badge = "") {
  // Two-column section: name + lead left (sticky), content right.
  const k = kicker ? `<span class="kicker">${kicker}</span>` : "";
  const l = lead ? `<p class="lead">${lead}</p>` : "";
  const b = badge ? `<p class="mt-2"><span class="badge is-gold">${badge}</span></p>` : "";
  return `<div class="split reveal"><div class="section-head">${k}<h2 class="h2">${h2}</h2>${l}${b}</div><div class="split-body">${body}</div></div>`;
}


function cta_band(lang) {
  let h, p, b1, b2;
  if (lang === "cs") {
    [h, p, b1, b2] = ["Zkuste to na nejbližší smlouvě", "Uvidíte rizika během pár minut. Zdarma, bez závazků, soubory zůstávají u vás.",
                      "Stáhnout zdarma", "Jak to funguje"];
  } else {
    [h, p, b1, b2] = ["Try it on your next contract", "See the risks in minutes. Free, no commitment, your files stay with you.",
                      "Download free", "How it works"];
  }
  return `<section class="section-sm"><div class="wrap"><div class="cta-band glass reveal">
  <h2 class="h2">${h}</h2>
  <p class="lead" style="max-width:640px;margin:1rem auto 0">${p}</p>
  <div class="hero-cta">
    <a class="btn btn-primary btn-lg" href="${L(lang, 'docs.html')}">${b1} ${icon('arrow')}</a>
    <a class="btn btn-glass btn-lg" href="${L(lang, 'how-it-works.html')}">${b2}</a>
  </div>
</div></div></section>`;
}


function code_block(name, text, lang) {
  const label = lang === "cs" ? "Kopírovat" : "Copy";
  return `<div class="code"><div class="code-head"><div class="code-dots"><span></span><span></span><span></span></div><span class="code-name">${name}</span><button class="copy-btn" data-copy>${label}</button></div><pre><code data-raw>${esc(text)}</code></pre></div>`;
}


function card(iconname, color, title, body) {
  const cls = "card card-hover";
  return `<div class="${cls}"><div class="icon ${color}">${icon(iconname)}</div><h3>${title}</h3><p>${body}</p></div>`;
}


// --------------------------------------------------------------------------- //
// Downloads widget (single source of truth: files, consent, licence)           //
// Links are NOT in static HTML — the API mints /downloads/<token>/ links       //
// (symlinks to the bundle dir, 48h TTL) after name + e-mail + consent.         //
// --------------------------------------------------------------------------- //
const DOWNLOAD_FILES = ["legalsuite.tar.gz"];

const DL_COPY = {
  "cs": {
    "kick": "Stažení",
    "title": "Odemkněte si stažení",
    "lead": "Nechte nám jméno a e-mail a souhlas s novinkami — odkazy se odemknou hned a platí 48 hodin.",
    "name": "Jméno a příjmení",
    "email": "E-mail",
    "consent": ("Souhlasím, aby mi Metropolitan advisory s.r.o. na můj e-mail zasílala "
                + "obchodní sdělení o novinkách legalskills.cz (cca 1× měsíčně), po dobu 3 let. "
                + "Souhlas je dobrovolný a mohu jej kdykoli odvolat na hello@legalskills.cz."),
    "more": "Více v Ochraně soukromí",
    "submit": "Odemknout stažení",
    "lic": ("Balíčky jsou pod licencí <strong>Apache License 2.0</strong>: smíte je "
            + "<strong>používat, upravovat i šířit</strong> (i komerčně), pokud přiložíte "
            + "kopii licence, označíte upravené soubory a zachováte oznámení z NOTICE. "
            + "Podporu, záruky i napojení do vašich systémů licence nepokrývá — "
            + "řešíme je jako službu, kontaktujte nás."),
    "lic_full": "Plné znění licence",
    "file_note": "Odemkne formulář výše.",
    "err": "Zkontrolujte jméno, e-mail a souhlas, prosím.",
    "exp": "Odkazy platí do",
    "a_d": "rozbalte a spusťte install.sh (na Windows install.ps1)",
  },
  "en": {
    "kick": "Download",
    "title": "Unlock your download",
    "lead": "Leave your name and e-mail and agree to news — links unlock instantly and stay live for 48 hours.",
    "name": "Name",
    "email": "Email",
    "consent": ("I agree that Metropolitan advisory s.r.o. may send me commercial communications "
                + "about legalskills.cz news (approx. 1× a month) to my email, for 3 years. "
                + "Consent is voluntary and I may withdraw it anytime at hello@legalskills.cz."),
    "more": "More in Privacy",
    "submit": "Unlock download",
    "lic": ("Bundles are licensed under the <strong>Apache License 2.0</strong>: you may "
            + "<strong>use, modify and redistribute</strong> them (including commercially), "
            + "as long as you include a copy of the licence, mark changed files and keep the "
            + "NOTICE attributions. Support, warranties and integration into your systems "
            + "are not covered by the licence — we deliver them as a service; contact us."),
    "lic_full": "Full licence text",
    "file_note": "Unlocks via the form.",
    "err": "Please check the name, e-mail and consent.",
    "exp": "Links valid until",
    "a_d": "unpack and run install.sh (install.ps1 on Windows)",
  },
};


function download_widget(lang) {
  const t = DL_COPY[lang];
  const [f] = DOWNLOAD_FILES;
  return `<div id="download" class="dl-wrap card reveal" data-dl>
  <span class="kicker">${t['kick']}</span><h3 class="h3">${t['title']}</h3>
  <p class="muted mt-1">${t['lead']}</p>
  <div class="dl-grid mt-2">
    <form data-dl-form novalidate>
      <div class="feature-list">
        <label class="f-label">${t['name']}<input class="aurora-input" name="name" autocomplete="name" required data-dl-name></label>
        <label class="f-label">${t['email']}<input class="aurora-input" type="email" name="email" autocomplete="email" required data-dl-email></label>
        <label class="f-label small" style="display:flex;gap:.5rem;align-items:flex-start;font-weight:400"><input type="checkbox" required data-dl-consent style="margin-top:.3rem"><span>${t['consent']} <a href="${L(lang, 'privacy.html')}">${t['more']}</a>.</span></label>
      </div>
      <button class="btn btn-primary mt-3" type="submit" data-dl-submit>${t['submit']} ${icon('arrow')}</button>
      <p class="small mt-2 hidden" data-dl-error style="color:var(--danger)">${t['err']}</p>
      <noscript><p class="small muted mt-2">JavaScript je vypnutý — napište na hello@legalskills.cz a pošleme odkaz.</p></noscript>
    </form>
    <div data-dl-links>
      <div class="dl-box">
        <div class="dl-row" data-dl-file="${f}"><span class="small muted"><code>${f}</code> · ${t['a_d']}</span><span class="btn btn-glass btn-sm" aria-disabled="true">${icon('lock')} ${t['file_note']}</span></div>
      </div>
      <p class="tiny muted mt-2">${t['lic']} <a href="https://www.apache.org/licenses/LICENSE-2.0">${t['lic_full']}</a> · <a href="${L(lang, 'terms.html')}">${(lang === 'cs' ? 'Podmínky' : 'Terms')}</a>.</p>
      <p class="small mt-1 hidden" data-dl-expiry></p>
    </div>
  </div>
</div>`;
}


function trio(lang) {
  // Playbook / Workflow / Skill — one card each, in the site's card language.
  let items;
  if (lang === "cs") {
    items = [
      ["book", "ic-gold", "Playbook", "Vaše vyjednávací standardy",
       ["Pozice Preferred / Fallback / Walk-away + schvalovatel a doložková knihovna",
        "Dostanete .md ke schválení + .docx matici + test na vzorku smluv",
        "Příklad: NDA, SaaS či SOW — vše draft do vašeho schválení"],
       "od 29 000 Kč"],
      ["route", "ic-teal", "Workflow", "Váš postup krok za krokem",
       ["Gate Plan + checklisty spisu + schvalovací brány",
        "Dostanete .md + nastavení profilu + pilot na jednom spisu",
        "Příklad: NIS2 prověrka dodavatele, closing checklist"],
       "od 39 000 Kč"],
      ["cpu", "ic-violet", "Skill", "Nová dovednost vašeho agenta",
       ["SKILL.md + postupy + deterministické skripty + evaly",
        "Dostanete instalaci + dokumentaci + datum kontroly",
        "Příklad: employment-cz, lease-cz"],
       "od 59 000 Kč"],
    ];
  } else {
    items = [
      ["book", "ic-gold", "Playbook", "Your negotiation standard",
       ["Preferred / Fallback / Walk-away positions + approver and clause library",
        "You get an .md for approval + a .docx matrix + a sample test",
        "Example: NDA, SaaS or SOW — all draft until you approve"],
       "from €1,200"],
      ["route", "ic-teal", "Workflow", "Your step-by-step run",
       ["Gate Plan + matter checklists + approval gates",
        "You get a .md + profile setup + a pilot on one matter",
        "Example: NIS2 supplier review, closing checklist"],
       "from €1,600"],
      ["cpu", "ic-violet", "Skill", "A new skill for your agent",
       ["SKILL.md + procedures + deterministic scripts + evals",
        "You get installation + docs + a review date",
        "Example: employment-cz, lease-cz"],
       "from €2,400"],
    ];
  }
  const contact = lang === "cs" ? "Napsat" : "Contact us";
  const out = [];
  for (const [ic, cls, title, sub, feats, price] of items) {
    out.push(
      `<div class="card card-hover reveal"><div class="icon ${cls}">${icon(ic)}</div>`
      + `<h3>${title}</h3><p class="muted small mt-1">${sub}</p>`
      + `<div class="mt-2">${checks(lang, feats)}</div>`
      + `<div class="mt-3 flex between items-c"><span class="chip">${price}</span>`
      + `<a class="btn btn-outline btn-sm" href="${L(lang, "contact.html")}">${contact}</a></div></div>`);
  }
  return out.join("");
}


// --------------------------------------------------------------------------- //
// The five skills / doors (single source for home + skills page)               //
// Promo copy only: light, motivating, no tech jargon.                           //
// --------------------------------------------------------------------------- //
const SKILLS = [
  {slug: "legal", ic: "cpu", cls: "", cat: "start",
   cs: ["legal", "Zde začněte", "Popíšete vlastními slovy, co potřebujete — i chaotické zadání. Srovná cíle, navrhne Gate Plan ke schválení a doptá se, když něco chybí."],
   en: ["legal", "Start here", "Describe in your own words what you need — even a messy brief. It tidies the goals, proposes a Gate Plan to approve and asks when something is missing."]},
  {slug: "legal-intake", ic: "compass", cls: "", cat: "start",
   cs: ["legal-intake", "Nová poptávka bez chaosu", "Posoudí, zda je věc pro vás — rozsah, střet zájmů, ekonomika, kapacita, spěch. Příběh rozloží na fakta, strany a lhůty a spis otevře."],
   en: ["legal-intake", "New inquiry without chaos", "Checks if the matter fits — scope, conflicts, economics, capacity, urgency. Turns the story into facts, parties and deadlines and opens the file."]},
  {slug: "legal-research", ic: "globe", cls: "ic-violet", cat: "start",
   cs: ["legal-research", "Odpověď se zdroji", "Vypracuje právní rešerši s oporou v předpisech a judikatuře — vše s citační stopou."],
   en: ["legal-research", "Answers with sources", "Produces legal research grounded in statutes and case law — all with a citation trail."]},
  {slug: "legal-review", ic: "eye", cls: "ic-violet", cat: "work",
   cs: ["legal-review", "Smlouvy, návrhy i prověrky", "Draftuje a reviduje dokumenty. Vyzná se v průběžných verzích z několika kol vyjednávání, včetně komentářů a redlajnů. Popíše rizika, navrhne řešení a vysvětlí je i srozumitelně."],
   en: ["legal-review", "Contracts, drafts and checks", "Drafts and reviews documents. Tracks working versions across negotiation rounds, including comments and redlines. Describes risks, proposes fixes and explains them plainly."]},
  {slug: "legal-dispute", ic: "redteam", cls: "ic-danger", cat: "stakes",
   cs: ["legal-dispute", "Když přijde spor", "Zanalyzuje podklady, připraví chronologii, argumenty. Hlídá lhůty a propadnutí, upozorní na chybějící důkazy, odhalí slabá místa. Odhadne i argumentaci protistrany a jak na ni reagovat."],
   en: ["legal-dispute", "When a dispute lands", "Analyses the file, prepares timeline and arguments. Watches deadlines and preclusion, flags missing evidence, exposes weak spots. Anticipates the other side's case and how to answer it."]},
  {slug: "legal-project", ic: "folder", cls: "ic-teal", cat: "order",
   cs: ["legal-project", "Pořádek ve spisu", "Velkou věc rozloží na úkoly, hlídá jejich plnění a průběžný stav. Spis předá kolegovi i uzavře."],
   en: ["legal-project", "Stay organized", "Breaks a big matter into tasks, tracks completion and live status. Hands the file over and closes it."]},
];

const CATLABEL = {
  "cs": {"all": "Vše", "start": "Začátek", "work": "Smlouvy",
         "stakes": "Když jde o hodně", "order": "Pořádek ve spisu", "standards": "Placené"},
  "en": {"all": "All", "start": "Getting started", "work": "Contracts",
         "stakes": "High stakes", "order": "Matter in order", "standards": "Paid"},
};

// Chip colour per /legal-* command (page-theme vars, work in light + dark).
const CMD_CHIP = {
  "/legal": "chip-primary",
  "/legal-intake": "chip-gold",
  "/legal-research": "chip-info",
  "/legal-review": "chip-violet",
  "/legal-drafting": "chip-teal",
  "/legal-dispute": "chip-danger",
  "/legal-project": "chip-success",
};


function skill_card(s, lang) {
  const [name, tag, desc] = s[lang];
  const paid = s.paid ? `<span class="badge is-gold">${(lang === "cs" ? "Placený" : "Paid")}</span>` : "";
  let preview = "";
  if (s["slug"] === "legal") {
    const ex = lang === "cs" ? "/legal Připomínkování NDA…" : "/legal Review this NDA…";
    preview = `<div class="mt-2"><button class="chip ${CMD_CHIP["/legal"]}" data-copy-text="${ex}" `
      + `title="${(lang === "cs" ? "Kopírovat" : "Copy")}"><code>${ex}</code></button></div>`;
  }
  return `<article class="card card-hover reveal" data-skill data-cat="${s["cat"]}" `
    + `data-title="${name} ${tag}" data-tags="${s["slug"]} ${tag}">`
    + `<div class="flex between items-c mb-2">`
    + `<div class="icon ${s["cls"]}">${icon(s["ic"])}</div>${paid}</div>`
    + `<h3>/${name}</h3><p>${desc}</p>${preview}`
    + `<div class="mt-2"><span class="chip">${tag}</span></div></article>`;
}


// --------------------------------------------------------------------------- //
// HOME                                                                         //
// --------------------------------------------------------------------------- //
function home(lang) {
  let eyebrow, h1, sub, pills, b1, b2, pipe, is_h, is_p, is_yes, is_no, sk_head,
    srv_head, srv, diff_k, diff_h, diff_l, diffs, pr_k, pr_h, pr_l2, plans;
  if (lang === "cs") {
    eyebrow = "Právní dovednosti zdarma · pro vašeho AI agenta";
    h1 = 'Večer bez smlouvy na klíně. <span class="grad">Podepište s klidem.</span>';
    sub = ("LegalSkills není další agent — je to sada právních dovedností. "
           + "Funguje s jakýmkoli agentem s podporou skills. "
           + "<br><b>Zdarma</b> v bohatém základu s placenými rozšířeními. "
           + "<br>Pomůže s jakoukoli rešerší, smlouvou, či sporem: "
           + "najde rizika a navrhne úpravy. Vy jen projdete výsledek a rozhodnete.");
    pills = ["Základ zdarma", "Rozšíření na míru", "Vaše soubory zůstávají u vás"];
    [b1, b2] = ["Stáhnout zdarma", "Jak to funguje"];
    pipe = [["01", "Přidáte do agenta", "Pár minut — žádný nový nástroj"],
            ["02", "Předáte dokument", "Smlouva, spor, předpis — i celá věc"],
            ["03", "Odešlete s klidem", "Rizika, návrhy i další krok"]];
    [is_h, is_p] = ["Jak se budete cítit", "Co vás dnes trápí"];
    is_yes = ["Večer končíte včas, ne nad paragrafy",
              "Ráno víte, kde jsou rizika — na jedné stránce",
              "U jednání máte jasno, kam až můžete ustoupit",
              "Mladší kolegové jedou podle vašich standardů",
              "Podepisujete s klidem, ne se staženým žaludkem"];
    is_no = ["Pátek večer: na stole 40stránková smlouva v cizím jazyce",
             "Strach, že přehlédnete lhůtu nebo částku",
             "Protistrana argumentuje lépe, než jste čekali",
             "Každá smlouva se řeší znovu od nuly",
             "AI píše hezky, ale vymýšlí si paragrafy"];
    sk_head = ["Co sada umí", "Právní dovednosti do vašeho agenta",
               "Základní sada je zdarma — od prvního čtení po klidný podpis. Na míru vám vyrobíme playbook, workflow i skill."];
    srv_head = ["Když chcete pomoc", "Zdarma — a když chcete, pomůžeme",
                "Doplňky dostanete zdarma. Někteří potřebují pomoc s instalací, jiní úpravu na míru, další zcela nový oborový skill."];
    srv = [["shield", "ic-success", "Instalace a podpora", "Nainstalujeme a pomůžeme na první smlouvě."],
           ["layers", "ic-teal", "Workflow na míru", "Váš postup krok za krokem: brány, checklisty a schvalování."],
           ["book", "ic-gold", "Playbook na míru", "Vaše vyjednávací standardy, hotové za vás."],
           ["cpu", "ic-violet", "Nový oborový skill", "Zcela nová dovednost pro vaši specializaci."]];
    [diff_k, diff_h] = ["Proč to funguje", "Co jinde zadarmo nedostanete"];
    diff_l = "Ne sliby o umělé inteligenci. Praktické jistoty pro váš den.";
    diffs = [
      ["compass", "", "Vyjasní zadání a připraví podklady", "Pošlete, co máte — e-mail, hlasovku, půl věty. Zbytek přípravy nechte na agentovi; vy jen zkontrolujete."],
      ["eye", "", "Analýza rizik během pár minut", "Předáte dokument svému agentovi a hned vidíte, co je nebezpečné a co změnit."],
      ["redteam", "", "Oponentura očima protistrany", "Než to odešlete, podíváme se na to očima druhé strany. Překvapení u soudu nechcete."],
      ["verify", "", "Faktické údaje pod kontrolou", "Částky, lhůty a data pohlídáme i po deseti úpravách. Co zmizelo, hned uvidíte."],
    ];
    [pr_k, pr_h] = ["Zdarma a služby", "Zdarma — a pomoc, když ji chcete"];
    pr_l2 = "Základní sadu dovedností máte zdarma napořád; práci na klíč děláme jako službu.";
    plans = [["Základní sada", "0 Kč", "Jádro dovedností zdarma napořád.", false],
             ["Služby na klíč", "od 29 000 Kč", "Playbook, workflow, skill i zavedení.", true]];
  } else {
    eyebrow = "Free legal skills · for your AI agent";
    h1 = 'No more contracts <span class="grad">on your Friday evening.</span>';
    sub = ("LegalSkills is not another agent — it is a set of legal skills. "
           + "Works with any agent supporting skills. "
           + "<br><b>Free</b> in a rich core with paid extensions. "
           + "<br>Helps with any research, contract or dispute: "
           + "flags risks and drafts fixes. You just review and decide.");
    pills = ["Free core", "Tailored extensions", "Your files stay with you"];
    [b1, b2] = ["Download free", "How it works"];
    pipe = [["01", "Add to your agent", "A few minutes — no new tool"],
            ["02", "Hand over a document", "Contract, dispute, policy — or a whole matter"],
            ["03", "Send with calm", "Risks, fixes and next step"]];
    [is_h, is_p] = ["How you will feel", "What hurts today"];
    is_yes = ["Evenings end on time, not over paragraphs",
              "Risks on one page in the morning",
              "You know how far you can concede",
              "Juniors follow your standards",
              "You sign calmly, not anxiously"];
    is_no = ["Friday evening: a 40-page contract in a foreign language lands",
             "Fear of missing a deadline or amount",
             "The other side argues better than expected",
             "Every contract starts from zero",
             "AI writes nicely but invents paragraphs"];
    sk_head = ["What the set does", "Legal skills for your agent",
               "The core is free — from first read to calm signature. Tailored playbooks, workflows and skills on request."];
    srv_head = ["When you want help", "Free — and we help when you want",
                "The plugins are free. Some need install help, others a tailored set-up, others a brand-new domain skill."];
    srv = [["shield", "ic-success", "Install & support", "We install and help on your first contract."],
           ["layers", "ic-teal", "Tailored workflow", "Your step-by-step run: gates, checklists and approvals."],
           ["book", "ic-gold", "Tailored playbook", "Your negotiation standards, made for you."],
           ["cpu", "ic-violet", "New domain skill", "A brand-new skill for your specialisation."]];
    [diff_k, diff_h] = ["Why it works", "What you can't get elsewhere for free"];
    diff_l = "Not AI promises. Practical certainties for your day.";
    diffs = [
      ["compass", "", "Clarifies the brief and prepares the file", "Forward whatever you have — an email, a voice note, half a sentence. The agent does the prep; you just review."],
      ["eye", "", "Risk analysis in minutes", "Hand a document to your agent and see what is dangerous and what to change."],
      ["redteam", "", "Opponent review through the other side's eyes", "Before you send it, we look at it through their eyes."],
      ["verify", "", "Facts and figures under control", "Amounts and dates are watched even after ten edits."],
    ];
    [pr_k, pr_h] = ["Free & services", "Free — and help when you want it"];
    pr_l2 = "The core skills are free forever; done-for-you work is a service.";
    plans = [["Core set", "€0", "Free core forever.", false],
             ["Tailored services", "from €1,200", "Playbook, workflow, skill and rollout.", true]];
  }

  let pipe_html = "";
  for (const [n, t, d] of pipe) {
    pipe_html += `<div class="pipe-step reveal"><div class="n">${n}</div>`
      + `<div class="t">${t}</div><div class="d">${d}</div></div>`;
  }

  const skills_html = SKILLS.map(s => skill_card(s, lang)).join("");
  const srv_html = srv.map(([ic, cls, t, d]) =>
    `<div class="card card-hover reveal"><div class="icon ${cls}">${icon(ic)}</div>`
    + `<h3>${t}</h3><p>${d}</p>`
    + `<div class="mt-2"><a class="btn btn-outline btn-sm" href="${L(lang, "contact.html")}">`
    + `${(lang === "cs" ? "Napsat" : "Contact us")}</a></div></div>`).join("");
  const diffs_html = diffs.map(([ic, cls, t, d], i) => card(ic, cls, t, d, i === 0)).join("");

  let plans_html = "";
  for (const [name, price, desc, feat] of plans) {
    plans_html += `<div class="card card-hover reveal${(feat ? " price-card featured" : "")}">`
      + `<div class="plan-name">${name}</div><div class="price">${price}</div>`
      + `<p class="mt-2">${desc}</p></div>`;
  }

  let aw_title, aw_g1, aw_g2, aw_g3, aw_sev, aw_ft, aw_doc, aw_why, aw_fix, aw_verd, aw_opp, trust;
  if (lang === "cs") {
    [aw_title, aw_g1, aw_g2, aw_g3] = ["NDA_counterparty_v3.docx — /legal-review", "1. Plán ✓", "2. Nálezy ●", "3. Oponentura ○"];
    [aw_sev, aw_ft] = ["[HIGH]", "Chybí limit odpovědnosti"];
    [aw_doc, aw_why] = ['doc: "odpovídá za veškerou škodu"', "why: přesahuje hodnotu smlouvy; tržní limit je 100 % odměny"];
    [aw_fix, aw_verd, aw_opp] = ["fix: limit 100 % odměny + výjimka pro úmysl", "CONTESTED", "Protistrana: „neobstojí u soudu — navrhujeme bezpečnější znění.“"];
    trust = ["Základ zdarma", "Běží lokálně", "Claude / Codex / OpenCode"];
  } else {
    [aw_title, aw_g1, aw_g2, aw_g3] = ["NDA_counterparty_v3.docx — /legal-review", "1. Plan ✓", "2. Findings ●", "3. Challenge ○"];
    [aw_sev, aw_ft] = ["[HIGH]", "Liability cap missing"];
    [aw_doc, aw_why] = ['doc: "liable for any and all damages"', "why: exceeds contract value; market cap is 100% of fees"];
    [aw_fix, aw_verd, aw_opp] = ["fix: cap at 100% of fees + wilful-misconduct carve-out", "CONTESTED", "Other side: “would not survive in court — safer wording proposed.”"];
    trust = ["Free core", "Runs locally", "Claude / Codex / OpenCode"];
  }
  const trust_html = trust.map(t => `<span class="trust">${icon("check")}<span>${t}</span></span>`).join("");
  const sub_clean = sub.split("<br>").join(" ");
  const appwin = `<div class="appwin reveal" role="img" aria-label="${aw_title}">`
    + `<div class="appwin-bar"><div class="appwin-dots"><span></span><span></span><span></span></div>`
    + `<span class="appwin-title">${aw_title}</span></div><div class="appwin-body">`
    + `<div class="gatebar"><span class="g done">${aw_g1}</span><span>→</span>`
    + `<span class="g now">${aw_g2}</span><span>→</span><span class="g todo">${aw_g3}</span></div>`
    + `<div class="finding"><div class="frow"><span class="sev sev-high">${aw_sev}</span>`
    + `<b>${aw_ft}</b><span class="chip chip-doc">DOC</span></div>`
    + `<div class="fl">${aw_doc}</div><div class="fl">${aw_why}</div><div class="fl"><b>${aw_fix}</b></div></div>`
    + `<div class="opoline"><span class="sev sev-high">${aw_verd}</span><span>${aw_opp}</span></div>`
    + `</div></div>`;

  let claim;
  if (lang === "cs") {
    claim = ('Z každého AI agenta udělá <span class="grad">právního experta</span>. '
             + 'Z každého právního agenta udělá <span class="grad">právnickou superstar</span>.');
  } else {
    claim = ('Turn any AI agent into a <span class="grad">legal expert</span>. '
             + 'Turn any legal agent into a <span class="grad">legal superstar</span>.');
  }

  return `<main>
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="badge mb-3"><span class="dot"></span>${eyebrow}</span>
      <h1 class="hero-title">${h1}</h1>
      <p class="hero-sub">${sub_clean}</p>
      <p class="hero-motto">${(lang === 'cs' ? 'Usnadňujeme právníkům život.' : "We make lawyers' lives easier.")}</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="${L(lang, 'docs.html')}">${b1} ${icon('arrow')}</a>
        <a class="btn btn-glass btn-lg" href="${L(lang, 'how-it-works.html')}">${b2}</a>
      </div>
      <div class="hero-meta">${trust_html}</div>
    </div>
    <div class="hero-visual">${appwin}</div>
  </div>
</section>

<section class="section-sm claim"><div class="wrap">
  <p class="reveal">${claim}</p>
</div></section>

<section class="section-sm" id="pipeline"><div class="wrap">
  <div class="pipeline">${pipe_html}</div>
</div></section>

<section class="section" id="what"><div class="wrap">
  <div class="grid grid-2" style="align-items:stretch">
    <div class="card card-pain reveal"><div class="icon ic-danger">${icon('redteam')}</div><h3>${is_p}</h3>${checks(lang, is_no, "pain")}</div>
    <div class="card card-hi reveal"><div class="icon ic-success">${icon('check')}</div><h3>${is_h}</h3>${checks(lang, is_yes)}</div>
  </div>
</div></section>

<section class="section" id="skills"><div class="wrap">
  ${sec_split(sk_head[0], sk_head[1], sk_head[2], `<div class="grid grid-3 grid-bento">${skills_html}</div>`)}
</div></section>

<section class="section" id="pricing"><div class="wrap">
  ${sec_split(pr_k, pr_h, pr_l2, `<div class="grid grid-2">${plans_html}</div><div class="svc-strip reveal mt-3">${srv.map(x => `<span class="chip">${x[2]}</span>`).join("")}</div>`)}
</div></section>

<section class="section" id="why"><div class="wrap">
  ${sec_split(diff_k, diff_h, diff_l, `<div class="grid grid-4">${diffs_html}</div>`)}
</div></section>

${cta_band(lang)}
</main>`;
}


const COMMANDS = [
  ["/legal", "Route it through the engine: classify, Gate Plan to approve, then the matching door.",
              "Směruje přes jádro: roztřídí úkol, navrhne Gate Plan ke schválení, pak zapne správné dveře."],
  ["/legal-intake", "Qualify a lead (scope, conflicts, economics, capacity, urgency), capture and open.",
                    "Posoudí poptávku (rozsah, střet, ekonomika, kapacita, spěch), vytěží fakta a otevře spis."],
  ["/legal-research", "Answers with law and case law sources and a citation ledger.",
                       "Odpoví se zdroji v zákoně a judikatuře — vše s citační stopou."],
  ["/legal-review", "Review, draft, negotiation, diligence, compliance or plain-language explain — mode by argument.",
                     "Revize, návrh, vyjednávání, prověrka, soulad či srozumitelné vysvětlení — režim zvolíte argumentem."],
  ["/legal-drafting", "Drafting-first entry to the same legal-review door: write or revise text, precedent first.",
                       "Vstup pro psaní do stejné revizní brány: napíše či upraví text, prvně dle precedentu."],
  ["/legal-dispute", "Deadlines first: timeline, claims matrix, strategy, submissions and hearing.",
                      "Nejdřív lhůty: chronologie, matice nároků, strategie, podání i jednání."],
  ["/legal-project", "Runs, hands over and closes the matter — mode by argument.",
                      "Vede spis, předá kolegovi a uzavře — režim zvolíte argumentem."],
];


function skills_page(lang) {
  let h, cmd_k, cmd_h, cmd_l;
  if (lang === "cs") {
    h = ["Co za vás udělá", "Dovednosti (skills):",
         "Základní sada dovedností (skill set) pokrývá smluvní a spornou agendu a vedení spisu — od prvotního zadání po kompletní vyřízení. Postup je stejný v každém právním řádu; konkrétní právo a pozice dodá váš playbook. Další dovednosti a rozšíření (skill, workflow, playbook) vám rádi připravíme na míru."];
    [cmd_k, cmd_h] = ["Jak se ptát", "Prostě napište, co potřebujete"];
    cmd_l = "Nemusíte se učit příkazy. Stačí věta jako „projdi tohle NDA“. Pro pokročilé jsou tu i zkratky níže.";
  } else {
    h = ["What it does", "Skills:",
         "The core skill set covers contract and dispute work and matter management — from the first brief to complete resolution. The method is the same in any legal system; your playbook supplies the positions. Further skills and extensions (skill, workflow, playbook) we're happy to tailor for you."];
    [cmd_k, cmd_h] = ["How to ask", "Just write what you need"];
    cmd_l = "No commands to learn. A sentence like “review this NDA” is enough.";
  }

  const cards = SKILLS.map(s => skill_card(s, lang)).join("");
  const rows = COMMANDS.map(([c, en, cs]) =>
    `<tr><td><button class="chip ${CMD_CHIP[c] || "chip-doc"}" data-copy-text="${c}" title="${(lang === "cs" ? "Kopírovat" : "Copy")}"><code>${c}</code></button></td><td>${(lang !== "cs" ? en : cs)}</td></tr>`).join("");
  const fbar = lang === "cs" ? "Hledat dovednost…" : "Search skills…";
  const chips = ["all", "start", "work", "stakes", "order"].map(c =>
    `<button class="chipbtn${(c === "all" ? " on" : "")}" data-filter="${c}">${CATLABEL[lang][c]}</button>`).join("");
  const empty = lang === "cs" ? "Nenalezeny žádné odpovídající položky" : "Nothing found";

  return `<main>
<section class="section-sm"><div class="wrap">
  ${sec_split(h[0], h[1], h[2], `<div class="filter-bar reveal"><input type="search" id="skill-search" placeholder="${fbar}" aria-label="${fbar}">
    <div class="filters">${chips}</div></div>
  <div class="grid grid-3 grid-bento">${cards}</div>
  <div id="skill-empty" class="empty hidden">${empty}</div>`)}
</div></section>

<section class="section"><div class="wrap">
  ${sec_split(cmd_k, cmd_h, cmd_l, `<div class="table-wrap reveal"><table><thead><tr><th>${(lang === 'cs' ? 'Příkaz' : 'Command')}</th><th>${(lang === 'cs' ? 'Co dělá' : 'What it does')}</th></tr></thead><tbody>${rows}</tbody></table></div>`)}
</div></section>

${cta_band(lang)}
</main>`;
}


function how_page(lang) {
  let ax_k, ax_h, ax_l, axes, gm_k, gm_h, gm, ep_h, ep_l, ck_h, ck_l, mf_h, mf_l,
    pv_h, pv_l, pv, pt_h, pt;
  if (lang === "cs") {
    [ax_k, ax_h] = ["Jak to funguje", "Dovednosti do vašeho agenta"];
    ax_l = "Žádný nový nástroj. Dovednosti přidáte do agenta, kterého už používáte.";
    axes = [
      ["bookopen", "", "1. Přidáte dovednosti", "Sada dovedností do agenta s podporou skills — třeba Claude, Codex či OpenCode. Každá práce začíná Gate Planem ke schválení."],
      ["eye", "ic-violet", "2. Předáte dokument", "Smlouva, podání, předpis — i celá věc. Nejdřív vytěží váš kontext a slovník, pak jede po krocích ve spisu .legal/."],
      ["redteam", "ic-danger", "3. Odešlete s klidem", "Rizika, návrhy i pohled protistrany na jedné stránce. Hotové i jako .docx — s FILES a Progress boxem."],
      ["lock", "ic-success", "Vaše soubory zůstávají u vás", "Soubory zůstávají u vás. Rešerše jdou do vyhledávání s anonymizovanými dotazy."],
    ];
    [gm_k, gm_h] = ["Pro techniky", "Podrobnosti najdete v dokumentaci"];
    gm = [["Rychlá smlouva", "Výsledek hned, bez zdržování."],
          ["Velký obchod", "Postup po krocích, vše schvalujete vy."]];
    ep_h = "Nemusíte nic studovat";
    ep_l = "Asistent se zeptá, když něco potřebuje. Vy jen schválíte pokračování.";
    ck_h = "Vše na jedné stránce";
    ck_l = "Stručný souhrn pro zaneprázdněného právníka.";
    mf_h = "Pořádek bez práce navíc";
    mf_l = "Vše zůstane přehledně uložené u vás.";
    [pv_h, pv_l] = ["Odkud se vzalo každé tvrzení", "U každého bodu vidíte zdroj. Žádné vymyšlené paragrafy."];
    pv = [["DOC", "chip-doc", "Přímo z vaší smlouvy", "citace"],
          ["AUTH", "chip-auth", "Ze zákona či judikatury", "odkaz"],
          ["INFER", "chip-infer", "Odvozené zdůvodnění", "vyvození"],
          ["USER", "chip-user", "Od vás", "zadání"],
          ["ASSUMED", "chip-assumed", "Předpoklad k ověření", "upozornění"]];
    pt_h = "Malá smlouva i velký obchod";
    pt = [["Běžná smlouva", ["Výsledek během pár minut", "Přehled na jedné stránce", "Hned můžete odeslat", "Ideální na NDA a dodatky"], ""],
          ["Klíčový obchod", ["Postup po krocích", "Vše schvalujete vy", "Kontrola i očima protistrany", "Pro smlouvy, kde jde o hodně"], "featured"]];
  } else {
    [ax_k, ax_h] = ["How it works", "Skills for your agent"];
    ax_l = "No new tool. Add the skills to the agent you already use.";
    axes = [
      ["bookopen", "", "1. Add the skills", "The skill set drops into any agent supporting skills — e.g. Claude, Codex or OpenCode. Every run starts with a Gate Plan to approve."],
      ["eye", "ic-violet", "2. Hand over a document", "Contract, filing, policy — or a whole matter. It sweeps your house context and reuse vocabulary first, then works in .legal/."],
      ["redteam", "ic-danger", "3. Send calmly", "Risks, fixes and the other-side view on one page. Finished work ships as .docx too — with FILES and a Progress box."],
      ["lock", "ic-success", "Your files stay with you", "Your files stay with you. Research queries leave anonymised."],
    ];
    [gm_k, gm_h] = ["For technicians", "Details live in the docs"];
    gm = [["Quick contract", "Result immediately."],
          ["Big deal", "Step by step, you approve."]];
    ep_h = "Nothing to study";
    ep_l = "The assistant asks when it needs you. You just approve.";
    ck_h = "Everything on one page";
    ck_l = "A brief summary for a busy lawyer.";
    mf_h = "Order without extra work";
    mf_l = "Everything stays neatly stored with you.";
    [pv_h, pv_l] = ["Where each point comes from", "Every point shows its source. No invented paragraphs."];
    pv = [["DOC", "chip-doc", "From your contract", "quote"],
          ["AUTH", "chip-auth", "From law and cases", "reference"],
          ["INFER", "chip-infer", "Derived reasoning", "inference"],
          ["USER", "chip-user", "From you", "brief"],
          ["ASSUMED", "chip-assumed", "To verify", "notice"]];
    pt_h = "Small contract or big deal";
    pt = [["Routine contract", ["Result in minutes", "One-page list", "Send right away", "Great for NDAs"], ""],
          ["Key deal", ["Step by step", "You approve everything", "Other-side check", "For high stakes"], "featured"]];
  }

  const axes_html = axes.map(([ic, cls, t, d], i) =>
    `<div class="tstep reveal"><div class="tdot">${i + 1}</div><h3>${t}</h3><p class="muted small mt-1">${d}</p></div>`).join("");
  const gm_rows = gm.map(([k, v]) => `<tr><td><code>${k}</code></td><td>${v}</td></tr>`).join("");
  const pv_cells = pv.map(([k, cls, v, chk]) =>
    `<div class="prov-cell reveal"><span class="chip ${cls}">${k}</span><strong>${v}</strong><span class="small muted">${chk}</span></div>`).join("");

  let paths_html = "";
  for (const [name, items, feat] of pt) {
    const gate = lang === "cs" ? "Gate Plan · plán ke schválení → práce po krocích → oponentura + kontrola" : "Gate Plan · plan to approve → gated work → challenge + verify";
    paths_html += `<div class="card reveal${(feat ? " price-card featured" : "")}">`
      + `<div class="plan-name">${name}</div><div class="mt-2">${checks(lang, items)}</div>`
      + `<div class="mt-3"><span class="chip chip-wrap">${gate}</span></div></div>`;
  }

  return `<main>
<section class="section-sm"><div class="wrap">
  ${sec_split(ax_k, ax_h, ax_l, `<div class="timeline">${axes_html}</div>`)}
</div></section>

<section class="section"><div class="wrap">
  ${sec_split(pt_h, {'cs': 'Vyberte si tempo', 'en': 'Pick your pace'}[lang], "", `<div class="grid grid-2">${paths_html}</div>`)}
</div></section>

<section class="section-sm"><div class="wrap">
  ${sec_split(pv_h, pv_l, "", `<div class="prov-grid">${pv_cells}</div>
  <p class="small muted mt-3">${(lang === 'cs'
      ? 'A žádné „žádná rizika“ bez doložené kontroly: každý závěr nese zdroj a každé „nic jsme nenašli“ nese záznam o tom, kde jsme hledali.'
      : 'And no “no risk” without a recorded check: every conclusion carries its source, and every “nothing found” carries the record of where we looked.')}</p>
  <p class="small muted mt-3">${(lang === 'cs' ? 'Technické podrobnosti pro IT a nadšence: ' : 'Technical details for IT: ')}<a href="${L(lang, 'docs.html')}">${(lang === 'cs' ? 'Dokumentace' : 'Docs')}</a></p>`)}
</div></section>
${cta_band(lang)}
</main>`;
}


function playbooks_page(lang) {
  // Sales page. The opener explains what extensions are and how we help, then
  // the four streams we sell: the premade catalogue, professional services
  // (bespoke builds + integrations), support services and trainings. Trust +
  // CTA close the page. Each stream's name is its own heading (the attractor).
  let open_h, open_l;
  let cat_h, cat_l, cat_badge;
  let pb_h, pb_l, layer, mx, mx_h;
  let ps_h, ps_l, int_h, int_l;
  let sp_h, sp_l, sp_items;
  let tr_h, tr_l, tr_items;
  let cap_h, guard_h, guards, cta_h;
  if (lang === "cs") {
    open_h = "Playbooky, workflow a skilly";
    open_l = "Váš AI agent je ve výchozím stavu obecný — nezná standard vaší kanceláře. "
      + "Rozšíření z něj udělají nástroj, který se drží toho, jak skutečně vyjednáváte, revidujete a vedete spis. "
      + "My z vaší praxe vytěžíme playbook, workflow nebo skill a udržujeme je aktuální. Vše schvalujete vy.";
    [cat_h, cat_badge] = ["Skilly, workflow a playbooky", "Již brzy"];
    cat_l = "Hotová rozšíření pro sadu: vyjednávací playbook, workflow spisu a dovednosti agenta. "
      + "Zatím na nich pracujeme — nejsou k dispozici. Nechte nám e-mail a dáme vám vědět, jakmile vyjdou.";
    pb_h = "Jednou nastavíte, pořád se to hodí";
    pb_l = "Playbook je váš vyjednávací standard v písemné podobě: pro každé ujednání znění, které předložíte první, "
      + "kompromis, který přijmete, a mez, za kterou už nejdete. Nastavíte ho jednou — asistent ho uplatní u každé další smlouvy, i za juniory.";
    layer = [["Kam až ustoupíte", "Jasně vidíte ideál, přijatelný kompromis i čáru, za kterou už nejdete."],
             ["Jednotný jazyk", "Stejné pojmy ve všech smlouvách. Žádný chaos."],
             ["Červené čáry", "Co nikdy nepodepíšete — asistent to pohlídá za vás."],
             ["Méně dohadování", "Tým ví, co pustit první a co držet. Jednání je kratší."]];
    mx = [["Preferovaná varianta", "Ideální znění, které předkládáte první.", "pos-pref"],
          ["Akceptovatelný kompromis", "Ústupová pozice, když protistrana odmítne.", "pos-fall"],
          ["Nepřekročitelná mez", "Za touto hranicí smlouvu nepodepíšete.", "pos-walk"]];
    mx_h = "Tři hladiny každé pozice";
    [ps_h, ps_l] = ["Profesionální služby",
      "Vyrobíme vám to na míru — agenta, skill, workflow i playbook z vašich vlastních podkladů. "
      + "Vše podložené vašimi dokumenty a schválené vámi, než to jde do provozu."];
    [int_h, int_l] = ["Integrace",
      "Napojíme agenta na vaše systémy — dokumenty, DMS, e-mail, CRM — aby práce tekla tam, kde už jste."];
    [sp_h, sp_l] = ["Servisní služby",
      "Podpora pro vše, co dodáme — jak to používat, udržet v provozu a aktuální. "
      + "Podporu nabízíme i jako placenou službu k našim skvělým skillům zdarma."];
    sp_items = ["Údržba playbooků — mění-li se právo nebo vaše praxe, pozice aktualizujeme a znovu verzujeme.",
                "Rychlá pomoc — odpovíme, když si tým neví rady s použitím.",
                "Pravidelné revize — průběžná kontrola rozšíření proti vašim aktuálním standardům.",
                "Prioritní kontakt — přímá linka, když hoří zakázka."];
    [tr_h, tr_l] = ["Školení",
      "Praktická školení pro váš tým: jak zadat agentovi práci, jak vést revizi a jak pracovat s playbooky a workflow. Na místě i online."];
    tr_items = ["Základy agenta — jak ho zadat a kde pomůže (a kde ne).",
                "Revize a vyjednávání — práce s playbooky, pozicemi a redlajny.",
                "Workflow a hygiena spisu — vedení věci od začátku do konce.",
                "Školení na vašich dokumentech — postavíme ho na vašich vzorech."];
    cap_h = "Z jedné smlouvy standard pro příště";
    guard_h = "Vše schvalujete vy";
    guards = ["Nový standard platí až po vašem schválení.",
              "Vše je verzované — víte, kdo a kdy co změnil.",
              "Staré verze zůstávají, nic se nepřepíše potají."];
    cta_h = "Chcete mít svoje standardy bez práce?";
  } else {
    open_h = "Playbooks, workflows and skills";
    open_l = "Your AI agent is generic by default — it does not know your firm's standard. "
      + "Extensions turn it into a tool that follows how you actually negotiate, review and run a matter. "
      + "We distil that practice into a playbook, workflow or skill and keep it current. You approve everything.";
    [cat_h, cat_badge] = ["Skills, workflows and playbooks", "Coming soon"];
    cat_l = "Ready-made extensions for the suite: the negotiation playbook, matter workflows and agent skills. "
      + "They are still in the works — not available yet. Leave your e-mail and we'll tell you the moment they ship.";
    pb_h = "Set once, reuse forever";
    pb_l = "A playbook is your negotiation standard in writing: for each clause the wording you table first, "
      + "the compromise you accept and the line you never cross. Define it once — the assistant applies it on every deal, even for juniors.";
    layer = [["Where you concede", "You see the ideal, the compromise and the line you never cross."],
             ["One language", "Same terms in every contract."],
             ["Red lines", "What you never sign — watched for you."],
             ["Less haggling", "The team knows what to hold. Deals close faster."]];
    mx = [["Preferred", "The ideal wording you table first.", "pos-pref"],
          ["Fallback", "The compromise when they push back.", "pos-fall"],
          ["Walk-away", "Beyond this line you do not sign.", "pos-walk"]];
    mx_h = "Three tiers per position";
    [ps_h, ps_l] = ["Professional services",
      "We build it for you — a bespoke agent, skill, workflow or playbook from your own inputs. "
      + "Everything grounded in your documents and approved by you before it goes live."];
    [int_h, int_l] = ["Integrations",
      "We wire the agent into your systems — documents, DMS, email, CRM — so the work flows where you already are."];
    [sp_h, sp_l] = ["Support services",
      "Support for everything we deliver — how to use it, keep it running and keep it current. "
      + "We also offer paid support for our free skills."];
    sp_items = ["Playbook upkeep — as law or your practice changes, we update the positions and re-version.",
                "How-to help — answers when your team gets stuck using what we delivered.",
                "Scheduled reviews — a periodic check of your extensions against your current standards.",
                "Priority contact — a direct line when a live matter needs an answer."];
    [tr_h, tr_l] = ["Trainings",
      "Hands-on sessions for your team: how to brief the agent, run a review and work with playbooks and workflows. On-site or remote."];
    tr_items = ["Agent basics — how to brief it, and where it helps (and where it doesn't).",
                "Review and negotiation — working with playbooks, positions and redlines.",
                "Workflows and matter hygiene — running a matter from start to finish.",
                "A session on your own documents — built around your templates."];
    cap_h = "From one deal to a standard";
    guard_h = "You approve everything";
    guards = ["A new standard applies only after your approval.",
              "Everything is versioned — you know who changed what.",
              "Old versions stay, nothing is overwritten secretly."];
    cta_h = "Want your standards without the work?";
  }

  const layerIcons = ["target", "bookopen", "redteam", "route"];
  const layer_html = layerIcons.map((ic, i) => card(ic, "", layer[i][0], layer[i][1])).join("");
  const mx_html = mx.map(([t, d, cls]) =>
    `<div class="pos-row ${cls}"><span><strong>${t}</strong><br><span class="small muted">${d}</span></span></div>`).join("");
  const contact = lang === 'cs' ? 'Napište nám' : 'Contact us';

  return `<main>
<section class="section-sm"><div class="wrap">${sec_head2(open_h, open_l)}</div></section>

<section class="section-sm"><div class="wrap">${sec_split("", cat_h, cat_l, `
  <div class="section-head reveal" style="margin-bottom:1.5rem"><h3 class="h3">${pb_h}</h3><p class="lead">${pb_l}</p></div>
  <div class="card reveal"><span class="kicker">${mx_h}</span><div class="mt-2">${mx_html}</div></div>
  <div class="grid grid-2 mt-3">${layer_html}</div>`, cat_badge)}</div></section>

<section class="section-sm"><div class="wrap">${sec_split("", ps_h, ps_l, `
  <div class="grid grid-3">${trio(lang)}</div>
  <div class="card reveal mt-3"><div class="icon ic-teal">${icon('route')}</div><h3>${int_h}</h3><p>${int_l}</p></div>`)}</div></section>

<section class="section-sm"><div class="wrap">${sec_split("", sp_h, sp_l, `
  <div class="card reveal">${checks(lang, sp_items)}
    <div class="mt-3"><a class="btn btn-outline btn-sm" href="${L(lang, 'contact.html')}">${contact}</a></div>
  </div>`)}</div></section>

<section class="section-sm"><div class="wrap">${sec_split("", tr_h, tr_l, `
  <div class="card reveal">${checks(lang, tr_items)}
    <div class="mt-3"><a class="btn btn-outline btn-sm" href="${L(lang, 'contact.html')}">${contact}</a></div>
  </div>`)}</div></section>

<section class="section-sm"><div class="wrap">
  <div class="card reveal"><span class="kicker">${cap_h} · ${guard_h}</span>${checks(lang, guards)}</div>
</div></section>

<section class="section-sm"><div class="wrap"><div class="cta-band glass reveal">
  <h2 class="h2">${cta_h}</h2>
  <div class="hero-cta"><a class="btn btn-gold btn-lg" href="${L(lang, 'contact.html')}">${contact} ${icon('arrow')}</a></div>
</div></div></section>
</main>`;
}


function marketplace_page(lang) {
  // Catalogue. We sell ready-made extensions ourselves; we do not run a
  // third-party marketplace — the discovery and trust layer already exists
  // (Anthropic's legal-builder-hub, Lawve, Agensi). Until the catalogue
  // ships, the same extensions are built to order as a service.
  let open_h, open_l, soon_badge;
  let what_h, what_l, items;
  let now_h, now_l, now_items, now_btn;
  let cta_h;
  if (lang === "cs") {
    open_h = "Katalog rozšíření";
    open_l = "Hotová rozšíření — skilly, workflow a playbooky — připravujeme. Katalog bude "
      + "verzovaný a zkontrolovaný, takže u každé položky uvidíte, co přesně dostanete "
      + "a v jaké verzi.";
    soon_badge = "Již brzy";
    what_h = "Co v katalogu bude";
    what_l = "Každé rozšíření projde revizí a je verzované, takže víte, co a v jaké verzi používáte.";
    items = [["cpu", "ic-violet", "Skilly", "Nové dovednosti pro vašeho agenta — hotové a připravené vložit."],
             ["route", "ic-teal", "Workflow", "Postupy a checklisty pro opakované činnosti — vedení spisu, revize, prověrky."],
             ["book", "ic-gold", "Playbooky", "Vyjednávací standardy pro běžné smlouvy — NDA, SaaS, SOW."]];
    cta_h = "Chcete mít své standardy bez práce?";
    now_h = "Do té doby je to služba";
    now_l = "Rozšíření umíme vyrobit na míru — stejnou metodou, na vašich vlastních podkladech. "
      + "Základní sada dovedností je přitom zdarma napořád.";
    now_items = ["Certifikace vašeho AI právního nástroje — mechanické kontroly, nalezené chyby, návrh opravy.",
                 "Příprava dat pro agenta — vyčištěný soubor smluv, inventář pojmů a registr smluv.",
                 "Napojení na vaše systémy — DMS, e-mail, CLM, sdílené disky, redliny jako sledované změny.",
                 "Playbook na míru — vyjednávací standardy vytižené z vašich podepsaných smluv.",
                 "Školení týmu — vést agenta, kontrolovat revizi, udržovat playbooky."];
    now_btn = "Rozšíření a služby";
  } else {
    open_h = "Extensions catalogue";
    open_l = "Ready-made extensions — skills, workflows and playbooks — are on their way. "
      + "The catalogue will be versioned and reviewed, so every entry tells you exactly what "
      + "you get and at which version.";
    soon_badge = "Coming soon";
    what_h = "What the catalogue will hold";
    what_l = "Every extension is reviewed and versioned, so you know what you are running and which version.";
    items = [["cpu", "ic-violet", "Skills", "New capabilities for your agent — ready to drop in."],
             ["route", "ic-teal", "Workflows", "Procedures and checklists for repeat work — running matters, reviews, diligence."],
             ["book", "ic-gold", "Playbooks", "Negotiation standards for the usual contracts — NDA, SaaS, SOW."]];
    cta_h = "Want your standards without the work?";
    now_h = "Until then, it is a service";
    now_l = "We build extensions to order — same method, on your own material. "
      + "The core skill set stays free, forever.";
    now_items = ["Certification of your AI legal tooling — mechanical checks, defects found, fixes proposed.",
                 "Data preparation for the agent — a cleaned contract corpus, a defined-terms inventory, a contract register.",
                 "Integration with your systems — DMS, e-mail, CLM, shared drives, redlines as tracked changes.",
                 "A playbook built for you — negotiation positions mined from your own signed agreements.",
                 "Training for the team — steering the agent, checking a review, maintaining playbooks."];
    now_btn = "Extensions and services";
  }
  const contact = lang === 'cs' ? 'Napište nám' : 'Contact us';
  const cards_html = items.map(([ic, cls, t, d]) => card(ic, cls, t, d)).join("");

  return `<main>
<section class="section-sm"><div class="wrap">${sec_head2(open_h, open_l, soon_badge)}</div></section>

<section class="section-sm"><div class="wrap">${sec_split("", what_h, what_l, `
  <div class="grid grid-3">${cards_html}</div>`)}</div></section>

<section class="section-sm"><div class="wrap">${sec_split("", now_h, now_l, `
  <div class="card reveal">${checks(lang, now_items)}
    <div class="mt-3"><a class="btn btn-gold btn-sm" href="${L(lang, 'playbooks.html')}">${now_btn} ${icon('arrow')}</a></div>
  </div>`)}</div></section>

<section class="section-sm"><div class="wrap"><div class="cta-band glass reveal">
  <h2 class="h2">${cta_h}</h2>
  <div class="hero-cta"><a class="btn btn-gold btn-lg" href="${L(lang, 'contact.html')}">${contact} ${icon('arrow')}</a></div>
</div></div></section>
</main>`;
}


function docs_page(lang) {
  // Simplified Download page: unlock the bundle, drop it into the agent, done.
  let h, lead, step_h, step_l;
  if (lang === "cs") {
    h = "Stažení";
    lead = "Odemknete balíček, hodíte ho agentovi — a je hotovo.";
    step_h = "Instalace jedním krokem";
    step_l = "Ukažte agentovi cestu ke staženému balíčku (archiv .tar.gz nebo .zip) a vložte tuto větu — agent balíček rozbalí, spustí instalátor a nainstaluje se sám:";
  } else {
    h = "Download";
    lead = "Unlock the bundle, drop it into your agent — done.";
    step_h = "Install in one step";
    step_l = "Point your agent at the downloaded bundle (a .tar.gz or .zip archive) and paste this — the agent unpacks it, runs the installer and installs itself:";
  }
  const agent_prompt = (lang === "cs"
    ? "Toto je stažený balíček legalsuite (legalsuite.tar.gz). Rozbal si ho "
      + "a nainstaluj legalsuite podle přiloženého instalátoru (install.sh, na Windows install.ps1). "
      + "Na prefix se mě zeptej a nic nepřepisuj bez zálohy."
    : "This is the downloaded legalsuite bundle (legalsuite.tar.gz). Unpack it "
      + "and install legalsuite using the bundled installer (install.sh, install.ps1 on Windows). "
      + "Ask me for the prefix and don't overwrite anything without a backup.");

  return `<main>
<section class="section-sm"><div class="wrap">${sec_split("", h, lead, `${download_widget(lang)}
  <div class="mt-4">
    <h3 class="h3">${step_h}</h3>
    <p class="muted mt-1">${step_l}</p>
    <div class="mt-2">${code_block('agent', agent_prompt, lang)}</div>
  </div>`)}</div></section>
${cta_band(lang)}
</main>`;
}
function about_page(lang) {
  let h, thesis_h, thesis, origin_h, origin, care_h, care, disc_h, disc;
  if (lang === "cs") {
    h = ["O nás", "Děláme to pro klidné večery právníků",
         "Sami jsme trávili večery nad dokumenty. Proto jsme postavili sadu dovedností, která pomůže vašemu agentovi s dokumentem, workflow i revizí."];
    thesis_h = "Naše víra";
    thesis = "Méně opisování a hledání rizik. Více času na klienty, strategii — a na život po šesté večer.";
    origin_h = "Pro koho to je";
    origin = [["Advokáti", "Večerní revize NDA a smluv během pár minut."],
              ["Podnikové právní týmy", "Stejné standardy pro celou firmu."],
              ["Koncipienti", "Učí se na hotových standardech, ne na chybách."],
              ["Majitelé firem", "Podepisují s klidem, ne se strachem."]];
    care_h = "Na čem nám záleží";
    care = ["Srozumitelně, ne právnickou hatmatilkou.",
            "Poctivě — když něco nevíme, řekneme to.",
            "Vaše soubory zůstávají u vás.",
            "Vy rozhodujete, my jen šetříme čas."];
    disc_h = "Upozornění";
    disc = "Jsme pomocník, ne právník. Konečné rozhodnutí je vždy na vás.";
  } else {
    h = ["About", "We build it for calm evenings",
         "We spent evenings over documents ourselves. So we built a skill set that helps your agent with documents, workflows and reviews."];
    thesis_h = "Our belief";
    thesis = "Less copying and risk-hunting. More time for clients, strategy — and for life after 6pm.";
    origin_h = "Who it is for";
    origin = [["Lawyers", "Evening NDA reviews in minutes."],
              ["In-house teams", "Same standards across the company."],
              ["Juniors", "Learn on ready standards, not on mistakes."],
              ["Owners", "Sign calmly, not anxiously."]];
    care_h = "What we care about";
    care = ["Plainly, not in legalese.",
            "Honestly — when we do not know, we say so.",
            "Your files stay with you.",
            "You decide, we just save time."];
    disc_h = "Notice";
    disc = "We are a helper, not a lawyer. The final decision is always yours.";
  }

  const originIcons = ["cpu", "route", "shield", "book"];
  const origin_html = originIcons.map((ic, i) => card(ic, "", origin[i][0], origin[i][1])).join("");
  const careIcons = ["target", "tag", "redteam", "globe"];
  const care_html = careIcons.map((ic, i) =>
    `<div class="card card-hover reveal"><div class="icon">${icon(ic)}</div>`
    + `<p class="mt-2">${care[i]}</p></div>`).join("");

  return `<main>
<section class="section-sm"><div class="wrap">${sec_split(h[0], h[1], h[2], `
  <div class="card reveal">
    <span class="kicker">${thesis_h}</span>
    <p class="tagline">${thesis}</p>
  </div>`)}
</div></section>

<section class="section"><div class="wrap">${sec_split("", origin_h, "", `<div class="grid grid-4">${origin_html}</div>`)}
</div></section>

<section class="section"><div class="wrap">${sec_split("", care_h, "", `<div class="grid grid-4">${care_html}</div>`)}
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="notice reveal"><strong>${disc_h}.</strong> ${disc}</div>
</div></section>
${cta_band(lang)}
</main>`;
}


function contact_page(lang) {
  const p = PROVIDER[lang];
  let h, name, email, org, topic, msg, topics, send, direct, ack, mkt, id_k, id_h, id_rows, id_note;
  if (lang === "cs") {
    h = ["Kontakt", "Napište nám, ozveme se"];
    [name, email, org, topic, msg] = ["Jméno a příjmení", "E-mail", "Kancelář / Společnost", "Co vás zajímá", "Zpráva"];
    topics = ["Playbook na míru", "Workflow na míru", "Skill na míru", "NIS2 / AI Act balíček", "Kancelář na klíč", "Jiný dotaz"];
    send = "Odeslat zprávu";
    direct = "Přímo";
    ack = "Odesláním beru na vědomí zpracováním údajů pro vyřízení poptávky.";
    mkt = "Souhlasím, aby mi Metropolitan advisory s.r.o. na můj e-mail zasílala obchodní sdělení o novinkách legalskills.cz (cca 1× měsíčně), po dobu 3 let. Souhlas mohu kdykoli odvolat na hello@legalskills.cz.";
    [id_k, id_h] = ["Kontakty a identifikační údaje", "Kdo za legalskills.cz stojí"];
    id_rows = [["Provozovatel", p['name']], ["Sídlo", p['address']],
               ["IČO", p['ico']], ["Rejstřík", p['registry']],
               ["Jednatel", "JUDr. Lukáš Michna, LL.M., Ph.D."],
               ["E-mail", `<a href="mailto:${p["email"]}">${p["email"]}</a>`],
               ["Web", p['web']]];
    id_note = "Jsme nástroj pro přípravu podkladů, nikoli poskytovatel právních služeb. Konečné rozhodnutí má vždy právník.";
  } else {
    h = ["Contact", "Get in touch"];
    [name, email, org, topic, msg] = ["Name", "Email", "Organization", "Topic", "Message"];
    topics = ["Tailored playbook", "Tailored workflow", "Tailored skill", "NIS2 / AI Act pack", "Team rollout", "Other"];
    send = "Send";
    direct = "Or directly";
    ack = "By sending I acknowledge the processing of my details to handle the enquiry.";
    mkt = "I agree that Metropolitan advisory s.r.o. may send me news about legalskills.cz (approx. 1× a month) to my email, for 3 years. I may withdraw anytime at hello@legalskills.cz.";
    [id_k, id_h] = ["Contacts and company details", "Who runs legalskills.cz"];
    id_rows = [["Operator", p['name']], ["Registered office", p['address']],
               ["Company No. (IČO)", p['ico']], ["Register", p['registry']],
               ["Managing director", "JUDr. Lukáš Michna, LL.M., Ph.D."],
               ["Email", `<a href="mailto:${p["email"]}">${p["email"]}</a>`],
               ["Web", p['web']]];
    id_note = "We are a preparation tool, not a provider of legal services. The final decision always rests with a lawyer.";
  }

  const opts = topics.map(t => `<option>${t}</option>`).join("");
  const id_rows_html = id_rows.map(([k, v]) =>
    `<div class="flex between gap" style="padding:.45rem 0;border-bottom:1px solid var(--border);align-items:flex-start">`
    + `<span class="plan-name" style="flex:0 0 9rem">${k}</span><span style="text-align:right">${v}</span></div>`).join("");
  return `<main>
<section class="section-sm"><div class="wrap">${sec_head(h[0], h[1], h[2])}
  <div class="grid grid-2" style="align-items:start">
    <form class="card reveal" action="mailto:hello@legalskills.cz" method="post" enctype="text/plain">
      <div class="feature-list">
        <label class="f-label">${name}<input class="aurora-input" required name="name"></label>
        <label class="f-label">${email}<input class="aurora-input" required type="email" name="email"></label>
        <label class="f-label">${org}<input class="aurora-input" name="org"></label>
        <label class="f-label">${topic}<select class="aurora-select" name="topic">${opts}</select></label>
        <label class="f-label">${msg}<textarea class="aurora-textarea" name="message" rows="5"></textarea></label>
        <label class="f-label small" style="display:flex;gap:.5rem;align-items:flex-start;font-weight:400"><input type="checkbox" name="marketing" value="yes" style="margin-top:.3rem">${mkt}</label>
        <label class="f-label small" style="display:flex;gap:.5rem;align-items:flex-start;font-weight:400"><input type="checkbox" required name="ack" value="yes" style="margin-top:.3rem"><span>${ack}</span></label>
      </div>
      <button class="btn btn-primary mt-3" type="submit">${send} ${icon('arrow')}</button>
    </form>
    <div class="card reveal">
      <div class="icon ic-gold">${icon('globe')}</div>
      <h3>${direct}</h3>
      <p class="mt-2"><a href="mailto:${p['email']}">${p['email']}</a></p>
    </div>
  </div>
</div></section>

<section class="section-sm"><div class="wrap">
  <div class="card reveal">
    <span class="kicker">${id_k}</span><h3 class="h3">${id_h}</h3>
    <div class="mt-3">${id_rows_html}</div>
    <p class="small muted mt-3">${id_note}</p>
  </div>
</div></section>
</main>`;
}


// --------------------------------------------------------------------------- //
// Blog                                                                         //
// --------------------------------------------------------------------------- //
const POSTS = [
  {slug: "gate-plan", cat: "method", date: "2026-09-12",
   cs: ["Proč musí mít právní práce jasný plán dříve, než začne", "Kontrolní plán (Gate Plan) mění práci s AI z nepředvídatelné černé skříňky v řízený proces s jasnými milníky a lidskou kontrolou.", "Metodika", "gate plan kontrola milniky hitl plan"],
   en: ["Why plan before the work", "The Gate Plan turns legal work into something you can pause, check and approve — not a black box.", "Method", "gate plan checkpoint hitl plan"],
   body_cs: `<p>Většina generativních nástrojů začne psát okamžitě po zadání promptu. U běžného textu to nevadí, ale v právní praxi je to ten nejhorší možný výchozí přístup. Zadání bývá neúplné, smluvní strany sledují protichůdné zájmy a přehlédnutá chyba se projeví až ve chvíli, kdy způsobí reálnou škodu.</p>
<p>LegalSkills proto nikdy nezačíná bezhlavým generováním textu. Řídicí jádro nejprve zanalyzuje povahu případu a předloží vám <strong>fázový kontrolní plán (Gate Plan)</strong> — jasný rozpad práce do logických etap zakončených kontrolními body (milníky). U komplexních a rizikových smluv systém čeká na vaše výslovné schválení. Bez vašeho pokynu neudělá krok navíc.</p>
<h2>Čtyři pojmy, které dávají procesu řád</h2>
<ul><li><strong>Fáze (phase)</strong> — ucelený dílčí úkol (např. vstupní analýza, strukturní mapa dokumentu, formulace nálezů či návrh redline).</li>
<li><strong>Milník (checkpoint)</strong> — zastavení s účastí člověka (HITL), kde asistent shrne zjištění, předloží návrhy a vyčká na vaše pokyny.</li>
<li><strong>Prověrka (check)</strong> — strojově spustitelný test s jednoznačným výsledkem splněno / nesplněno (např. kontrola zachování čísel a citací).</li>
<li><strong>Autorizace (approval)</strong> — výslovný souhlas vyžadovaný před jakýmkoli nevratným krokem.</li></ul>
<blockquote>Zrychlený režim pro rutinní dotaz a hloubkový postup pro stomilionovou transakci nejsou dva různé programy. Jsou to jen dva různé výstupy téhož kontrolního plánu.</blockquote>
<p>U jednoduchého dotazu předloží asistent plán kompaktně a odpověď doručí v témže kroku. U složité akviziční smlouvy naopak zastaví po každé fázi a nechá vás zkontrolovat mezivýsledky. Vždy přesně víte, kde se nacházíte a co bude následovat.</p>`,
   body_en: `<p>Most tools for working with text start writing immediately. For legal work that is the wrong default: scope is ambiguous, parties have opposing interests, and mistakes surface late.</p>
<p>So the engine always proposes a <strong>Gate Plan</strong> before the work — a decomposition into phases, clustered into checkpoints. On the architect path it waits for your “approved”. Nothing runs before that.</p>
<h2>Phase, checkpoint, check, approval</h2>
<ul><li><strong>phase</strong> — an atomic unit of work.</li>
<li><strong>checkpoint</strong> — a HITL pause where phases cluster.</li>
<li><strong>check</strong> — an executable pass/fail.</li>
<li><strong>approval</strong> — a block on an irreversible act.</li></ul>
<blockquote>Turn-by-turn gating and cluster-and-run are not two policies. They are two outputs of the same plan.</blockquote>
<p>A simple matter gets a compact inline plan and delivers in the same turn. A complex one gets a checkpoint per phase. Same machine, different calibration — and you see it before anything happens.</p>`},
  {slug: "provenance", cat: "method", date: "2026-09-26",
   cs: ["Značky původu: Proč musí mít každé právní tvrzení dohledatelný zdroj", "Pět jednoduchých značek odděluje autentický text smlouvy, zákonná ustanovení, právní dedukce a klientská fakta.", "Metodika", "provenance puvod citace prameny argumentace"],
   en: ["Provenance tags: the audit trail", "Five tags separate what is in the document, what is authority, what is inferred and what you said.", "Method", "provenance grounding auth doc assumed tagging"],
   body_cs: `<p>K nejnebezpečnějším selháním AI v právu dochází ve chvíli, kdy asistent nerozezná, co je doslovný text smlouvy, co je platný právní předpis, co je jeho vlastní dedukce a co mu sdělil uživatel. Vzniká líbivý text, který však stojí na vodě.</p>
<p>V LegalSkills má každé tvrzení, každý zjištěný nález i každý navržený odstavec jasně přiznanou značku původu:</p>
<ul><li><span class="chip chip-doc">DOC</span> <strong>Doslovná citace ze zkoumaného dokumentu</strong> — přísně hlídána kontrolou věcné podstaty.</li>
<li><span class="chip chip-auth">AUTH</span> <strong>Externí právní pramen</strong> (zákonné ustanovení, judikatura, směrnice) — musí být přesně dohledatelný a ověřitelný.</li>
<li><span class="chip chip-infer">INFER</span> <strong>Právní úsudek a dedukce</strong> — asistent musí výslovně pojmenovat premisy, ze kterých závěr vyvodil.</li>
<li><span class="chip chip-user">USER</span> <strong>Skutková okolnost</strong> zadaná přímo vámi.</li>
<li><span class="chip chip-assumed">ASSUMED</span> <strong>Pracovní předpoklad</strong> — neověřená výchozí domněnka, na kterou vás systém sám upozorní.</li></ul>
<h2>Proč to není jen formální cvičení</h2>
<p>Značky původu přímo řídí validační mechanismy. Pokud asistent zmíní zákonný paragraf či judikát, ale nedokáže jej doložit konkrétním pramenem, systém jej nepustí dál jako hotový fakt, nýbrž jej sníží na <code>ASSUMED</code> a výslovně vás na to upozorní.</p>
<blockquote>Základní pravidlo naší metodiky: Nikdy nevymýšlet paragrafy, citace ani judikaturu. Nedoložené tvrzení je pouhou hypotézou, nikoli argumentem.</blockquote>`,
   body_en: `<p>Legal work fails when what is in the document, what the law says and what the model guessed get mixed together. The suite forbids that: every claim and every map node carries a provenance tag.</p>
<ul><li><span class="chip chip-doc">DOC</span> verbatim from the source document — checked by substance-preservation.</li>
<li><span class="chip chip-auth">AUTH</span> external authority — must resolve, or it is a grounding failure.</li>
<li><span class="chip chip-infer">INFER</span> derived reasoning — name the premises.</li>
<li><span class="chip chip-user">USER</span> a fact supplied by the user.</li>
<li><span class="chip chip-assumed">ASSUMED</span> an unverified default — surfaced at a checkpoint.</li></ul>
<h2>Why it is not cosmetic</h2>
<p>The tags drive the checks. An unresolved authority is <em>downgraded</em> to <code>ASSUMED</code> and surfaced — never silently passed. A claim with no provenance is visible at a glance, even in someone else's work.</p>
<blockquote>Never invent provisions, citations or case law. An unsourced claim is a claim, not a fact.</blockquote>`},
  {slug: "oponentura", cat: "practice", date: "2026-10-03",
   cs: ["Právní oponentura před podpisem: Zátěžový test z pohledu protistrany", "Než odešlete finální znění smlouvy či podání, podrobte svou argumentaci nekompromisnímu testu z pohledu protistrany.", "Praxe", "oponentura redteam verdikt proverka protistrana"],
   en: ["Opponent review before sign-off", "The strongest case against your position, with a verdict per point — before the final output.", "Practice", "opponent review redteam verdict steelman adversarial"],
   body_cs: `<p>Každý zkušený advokát to zná: když hodiny pracujete na složité smlouvě či žalobním návrhu, snadno získáte tunelové vidění. Vlastní argumenty vám připadají neprůstřelné, zatímco možná protiargumentace protistrany vám unikne. Oponentura před odesláním je proto tou nejcennější kontrolou kvality.</p>
<p>Oponentura v <code>/legal-review</code> se neptá, co je ve smlouvě po formální stránce špatně — to řeší samotná revize. Oponentura se ptá na zásadnější otázku: <strong>Obstojí naše právní konstrukce, pokud ji protistrana napadne u soudu či v arbitráži?</strong></p>
<h2>Jasný verdikt místo neurčitých dojmů</h2>
<p>Oponentura běží v čistém kontextu (ideálně v odděleném sezení), aby kritik nebyl zatížen předchozím průběhem konverzace. Asistent zaujme roli nekompromisního právního zástupce protistrany a u každého klíčového bodu vynese jednoznačný verdikt:</p>
<ul><li><code>CONFIRMED</code> — pozice je pevná a argumentačně bezchybná.</li>
<li><code>REVISED</code> — pozice obstojí, ale vyžaduje formulační zpřesnění, aby neponechávala prostor pro odlišný výklad.</li>
<li><code>REJECTED</code> — ujednání či argument je neudržitelný (např. pro rozpor s kogentním ustanovením zákona).</li>
<li><code>CONTESTED</code> — obě strany mají legitimní argumenty; u každé asistent přesně popíše, jaké skutkové či právní okolnosti by misku vah převážily.</li></ul>
<p>Poctivá oponentura nesmí být jen zdvořilým přitakáváním. Pokud oponentura nenajde žádné slabiny, musí doložit, jaké útoky na dokument vyzkoušela a proč neuspěly.</p>
<blockquote>U významných a rizikových transakcí je oponentura navrhována jako povinný krok před kompletací výstupu.</blockquote>`,
   body_en: `<p>Colleagues keep saying the same thing: they would welcome a well-founded opponent review before the final output goes out. Not “what is wrong with the document” — that is review — but <strong>does our position survive?</strong></p>
<p>It runs read-only and ideally in fresh context, so the critic is not the author. It steelmans the counter-case and attacks the load-bearing evidence and reasoning.</p>
<h2>A verdict, not an impression</h2>
<ul><li><code>confirmed</code> — the position held.</li>
<li><code>revised</code> — it held after adjustment.</li>
<li><code>rejected</code> — it did not hold.</li>
<li><code>contested</code> — both sides are honest; for each we state what would change the verdict.</li></ul>
<p>An opponent review that finds nothing must show the attempts. Rejected and dismissed objections are recorded too — otherwise it is theatre, not a check.</p>
<blockquote>For high-risk matters, opponent review is always proposed before the final output.</blockquote>`},
  {slug: "playbooks-vs-templates", cat: "playbooks", date: "2026-10-07",
   cs: ["Playbook není jen další vzor smlouvy: Od textu k vyjednávací strategii", "Běžný vzor vám dá předepsaný odstavec. Playbook vám řekne, jak ujednání obhájit, kdy ustoupit a kde leží nepřekročitelná mez.", "Rozšíření a služby", "playbook vzor strategie fallback walkaway standard"],
   en: ["Playbooks are not templates", "A template holds text. A playbook holds a position — preferred, fallback and the walk-away line.", "Extensions and Services", "playbook template preferred fallback walkaway standard"],
   body_cs: `<p>Statický vzor smlouvy vám dá předpřipravený text odstavce. Neřekne vám však, co dělat, když protistrana navrhne jeho vypuštění. Nepoví vám, jaká alternativa je pro vaši společnost ještě přijatelná a kde leží červená linie, za kterou už smlouvu nesmíte podepsat. To je zásadní rozdíl mezi pasivní šablonou a vyjednávacím playbookem.</p>
<p>Právní playbook zachycuje živou strategii vaší organizace. Pro každé podstatné ujednání definuje tři jasné hladiny:</p>
<ul><li><strong>Preferovaná varianta (Preferred)</strong> — ideální znění, které předkládáte v prvním návrhu.</li>
<li><strong>Akceptovatelný kompromis (Fallback)</strong> — vyvážená ústupová pozice pro případ, že protistrana vaše preferované znění odmítne.</li>
<li><strong>Nepřekročitelná mez (Walk-away)</strong> — hranice, za kterou ujednání představuje neakceptovatelné podnikatelské či právní riziko.</li></ul>
<h2>Destilace zkušeností namísto psaní od nuly</h2>
<p>Kvalitní playbook nemusíte psát týdny na zelené louce. Vzniká destilací reálných vyjednávání: asistent projde historii vašich připomínek a smluv, odstraní konverzační balast, anonymizuje klientské údaje a vytáhne podstatu vyjednaných kompromisů.</p>
<blockquote>Nově vytvořený playbook má vždy status <strong>draft</strong>. Stává se závazným standardem až ve chvíli, kdy jej schválí vedoucí právník — protože playbook definuje právní politiku vaší společnosti.</blockquote>
<p>Výsledkem je firemní standard, který mohou bezpečně používat mladší kolegové i nákupní týmy. Asistent pak při každé revizi okamžitě pozná, zda protinávrh protistrany nepřekročil vaše stanovené mantinely.</p>`,
   body_en: `<p>A template gives you a paragraph. It does not tell you when to concede, what is still acceptable, or where the line is that you will not cross. That is the job of a playbook.</p>
<p>A playbook carries three positions for every clause or issue: <strong>preferred</strong>, <strong>fallback</strong> and <strong>walk-away</strong>. Review then tags a finding with its stance and offers the compromise; opponent review checks whether a position breached the walk-away.</p>
<h2>Capture is distillation</h2>
<p>A playbook is not built by hand from zero. It is captured from a negotiation: compaction, substantiation, universalization, structure and a privilege scrub. Names, dates and amounts disappear — the rule remains and can be shared safely.</p>
<blockquote>A captured playbook is <strong>draft</strong> until a lawyer approves it. It encodes legal policy — and policy does not change by accident.</blockquote>
<p>Precedence is simple: the more specific wins (a client overlay over a matter-type base). And every conflict between a position and the document is surfaced, not silently overridden.</p>`},
];


function blog_index(lang) {
  let h, search, read;
  if (lang === "cs") {
    h = ["Odborný blog", "Metodika, praxe a vyjednávací strategie",
         "Praktické postupy a zamyšlení nad moderní právní prací: kontrolní brány, auditní stopa argumentů, oponentura a tvorba playbooků."];
    search = "Hledat článek…";
    read = "Číst článek";
  } else {
    h = ["Blog", "Method, practice, playbooks",
         "Short pieces on how the suite thinks: plan before the work, provenance, opponent review and playbooks."];
    search = "Search articles…";
    read = "Read";
  }
  const cats = {"cs": {"all": "Všechny", "method": "Metodika", "practice": "Praxe", "playbooks": "Rozšíření a služby"},
                "en": {"all": "All", "method": "Method", "practice": "Practice", "playbooks": "Extensions and Services"}}[lang];
  const chips = Object.entries(cats).map(([c, v]) => `<button class="chipbtn${(c === "all" ? " on" : "")}" data-bcat="${c}">${v}</button>`).join("");
  let cards = "";
  for (const p of POSTS) {
    const [title, excerpt, catlabel, tags] = p[lang];
    cards += `<a class="card card-hover reveal" data-post data-cat="${p["cat"]}" `
      + `data-title="${title} ${tags}" data-tags="${tags}" href="${L(lang, "blog/" + p["slug"] + ".html")}">`
      + `<div class="flex between items-c mb-2"><span class="chip">${catlabel}</span>`
      + `<span class="small muted">${p["date"]}</span></div>`
      + `<h3>${title}</h3><p>${excerpt}</p>`
      + `<div class="mt-3 small" style="color:var(--primary-500)">${read} ${icon("arrow")}</div></a>`;
  }
  return `<main>
<section class="section-sm"><div class="wrap">${sec_split(h[0], h[1], h[2], `<div class="filter-bar reveal"><input type="search" id="blog-search" placeholder="${search}" aria-label="${search}">
    <div class="filters">${chips}</div></div>
  <div class="grid grid-3">${cards}</div>
  <div id="blog-empty" class="empty hidden">${(lang === 'cs' ? 'Nic nenalezeno.' : 'Nothing found.')}</div>`)}</div></section>
${cta_band(lang)}
</main>`;
}


function post_page(post, lang) {
  const [title, excerpt, catlabel, tags] = post[lang];
  const body = lang === "cs" ? post["body_cs"] : post["body_en"];
  const back = lang === "cs" ? "Zpět na blog" : "Back to blog";
  return `<main>
<section class="section-sm"><div class="wrap"><article class="prose article">
  <a class="chip" href="${L(lang, 'blog.html')}">← ${back}</a>
  <div class="article-meta mt-2"><span class="chip">${catlabel}</span><span>${post['date']}</span></div>
  <h1 class="hero-title" style="font-size:clamp(1.9rem,4.4vw,2.8rem);margin:1rem 0">${title}</h1>
  <p class="lead">${excerpt}</p>
  <hr class="divider mt-3 mb-3">
  ${body}
</article></div></section>
${cta_band(lang)}
</main>`;
}


function legal_page(lang, kind) {
  const op = PROVIDER[lang];
  const cs = lang === "cs";
  let title, desc, body, heading;
  if (kind === "terms") {
    title = cs ? "Podmínky užívání" : "Terms of use";
    desc = cs ? "Podmínky užívání webu a stažení legalskills.cz." : "Terms for using the site and downloads.";
    if (cs) {
      body = `<h2>1. Rozsah a provozovatel</h2><p>Tyto podmínky upravují užívání webu legalskills.cz a balíčku ke stažení (<code>legalsuite.tar.gz</code>). Provozovatelem je Metropolitan advisory s.r.o. (viz níže).</p>
<h2>2. Není to právní služba</h2><p>Web i sada LegalSkills jsou pracovní nástroje pro přípravu, analýzu a verifikaci textů. Nejde o právní službu ve smyslu zákona č. 85/1996 Sb., o advokacii. Každý výstup před použitím zkontrolujte a autorizujte — za rozhodnutí a jejich důsledky odpovídáte vy.</p>
<h2>3. Web smíte užívat</h2><p>Web smíte prohlížet a citovat s uvedením zdroje. Nesmíte jej přetěžovat, obcházet zabezpečení ani vydávat jeho obsah za vlastní.</p>
<h2>4. Stažení: licence Apache License 2.0</h2><p>Balíčky ke stažení se poskytují pod <a href="https://www.apache.org/licenses/LICENSE-2.0">licencí Apache License, verze 2.0</a>. Smíte je <strong>používat, upravovat i šířit</strong>, a to i komerčně, za těchto podmínek: <strong>přiložte kopii licence</strong>, <strong>označte upravené soubory</strong> a <strong>zachovejte oznámení z NOTICE</strong>. Změněné verze tedy smíte šířit dál. Podporu, záruky ani propojení s vašimi systémy licence nepokrývá — řešíme je jako službu na základě samostatné dohody; kontaktujte nás. Instalaci a rozmnoženinu pro vlastní potřebu licence umožňuje; podmínky instalace (záloha před přepsáním) viz <a href="/docs.html">Dokumentace</a>. Plné znění licence má přednost před tímto shrnutím.</p>
<h2>5. Bez záruky</h2><p>Vše se poskytuje „jak je“ (as-is), bez záruk jakéhokoli druhu. Neodpovídáme za to, že výstup bude bezchybný či vhodný pro váš případ — proto platí povinnost kontroly dle čl. 2.</p>
<h2>6. Omezení odpovědnosti</h2><p>V maximálním rozsahu přípustném právem (vč. § 2898 občanského zákoníku) neneseme odpovědnost za újmu z užití webu, balíčků či jejich výstupů.</p>
<h2>7. Právo a změny</h2><p>Platí právo České republiky. Spory řeší obecné soudy ČR. Podmínky můžeme přiměřeně měnit; aktuální znění je vždy zde. Účinné od zveřejnění.</p>`;
    } else {
      body = `<h2>1. Scope and operator</h2><p>These terms cover the legalskills.cz website and the downloadable bundle (<code>legalsuite.tar.gz</code>). The operator is Metropolitan advisory s.r.o. (see below).</p>
<h2>2. Not a legal service</h2><p>The site and the LegalSkills suite are working tools for drafting, analysis and verification. They are not a legal service and do not replace a qualified lawyer. Always review and authorise output before use — you are responsible for decisions and their consequences.</p>
<h2>3. Using the site</h2><p>You may browse and quote the site with attribution. Do not overload it, bypass security, or pass its content off as your own.</p>
<h2>4. Downloads: Apache License 2.0</h2><p>Downloadable bundles are provided under the <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache License, Version 2.0</a>. You may <strong>use, modify and redistribute</strong> them, including commercially, provided that you <strong>include a copy of the licence</strong>, <strong>mark changed files</strong> and <strong>keep the NOTICE attributions</strong>. Adapted versions may therefore be distributed further. Support, warranties and integration with your systems are not covered by the licence — we deliver them as a service under a separate agreement; contact us. Installing and copying for your own use is allowed; see <a href="/en/docs.html">Docs</a> for the installer (backup before overwrite). The full licence text prevails over this summary.</p>
<h2>5. No warranty</h2><p>Everything is provided “as is”, without warranties of any kind. We do not warrant that output is error-free or fit for your matter — hence the review duty in § 2.</p>
<h2>6. Liability</h2><p>To the maximum extent permitted by law we are not liable for loss arising from use of the site, bundles or their output.</p>
<h2>7. Law and changes</h2><p>Czech law applies. Disputes go to the general courts of the Czech Republic. We may update these terms; the version published here applies. Effective on publication.</p>`;
    }
    heading = op["label"];
  } else if (kind === "privacy") {
    title = cs ? "Zásady ochrany soukromí" : "Privacy policy";
    desc = cs ? "Jak na webu legalskills.cz nakládáme s osobními údaji." : "How legalskills.cz handles personal data.";
    if (cs) {
      body = `<h2>1. Jaké údaje zpracováváme</h2><p><strong>Poptávka:</strong> údaje, které nám sami dáte (jméno, e-mail, kancelář/společnost, text zprávy). <strong>Marketing:</strong> e-mail + záznam o souhlasu, jen pokud jej udělíte. <strong>Technická data:</strong> analytiku a marketingová úložiště ukládáme jen s vaším souhlasem (viz <a href="/cookies.html">Zásady cookies</a>).</p>
<h2>2. Účely a právní základy (GDPR)</h2><p>Poptávku vyřizujeme pro jednání o smlouvě (čl. 6 odst. 1 písm. b)). Obchodní sdělení posíláme jen s vaším souhlasem (čl. 6 odst. 1 písm. a), § 7 zákona č. 480/2004 Sb.). Analytiku měříme jen s vaším souhlasem (čl. 6 odst. 1 písm. a)). Zabezpečení webu chráníme z oprávněného zájmu (čl. 6 odst. 1 písm. f)).</p>
<h2>3. Souhlas s obchodními sděleními</h2><p>Znění: „Souhlasím, aby mi Metropolitan advisory s.r.o. na můj e-mail zasílala obchodní sdělení o novinkách legalskills.cz (cca 1× měsíčně), po dobu 3 let. Souhlas je dobrovolný a mohu jej kdykoli odvolat na hello@legalskills.cz.“ Odvolání je stejně snadné jako udělení. Záznam o souhlasu/odvolání uchováváme 3 roky pro prokázání.</p>
<h2>4. Doba uchování</h2><p>Poptávku držíme po dobu vyřízení + 3 roky (promlčecí lhůta). Marketingové údaje do odvolání, nejdéle 3 roky od udělení. Pak mažeme, ledaže zákon ukládá déle.</p>
<h2>5. Příjemci</h2><p>Údaje neprodáváme. Předáváme je jen poskytovateli hostingu a nástrojům, které jste odsouhlasili (analytika, rozesílka). Žádné automatizované rozhodování ani profilování s právními účinky.</p>
<h2>6. Vaše práva</h2><p>Máte právo na přístup, opravu, výmaz, omezení, přenositelnost a námitku, a právo odvolat souhlas. Napište na hello@legalskills.cz — odpovíme do měsíce. Stížnost můžete podat u ÚOOU (uoou.cz).</p>
<h2>7. Lokální běh sady</h2><p>Sada LegalSkills běží lokálně ve vašem AI agentovi a sama o sobě nám nic neposílá. Platí též podmínky vašeho AI agenta.</p>`;
    } else {
      body = `<h2>1. What we process</h2><p><strong>Enquiries:</strong> details you give us (name, email, organisation, message). <strong>Marketing:</strong> email + consent record, only if you opt in. <strong>Technical data:</strong> analytics and marketing storage only with your consent (see <a href="/en/cookies.html">Cookie policy</a>).</p>
<h2>2. Purposes and legal bases (GDPR)</h2><p>Enquiries: pre-contractual steps (Art. 6(1)(b)). Newsletters: only with consent (Art. 6(1)(a), § 7 of Act No. 480/2004 Coll.). Analytics: only with consent (Art. 6(1)(a)). Site security: legitimate interest (Art. 6(1)(f)).</p>
<h2>3. Marketing consent</h2><p>Wording: “I agree that Metropolitan advisory s.r.o. may send me commercial communications about legalskills.cz news (approx. 1× a month) to my email for 3 years. Consent is voluntary and I may withdraw it anytime at hello@legalskills.cz.” Withdrawal is as easy as giving consent. We keep the consent record for 3 years as proof.</p>
<h2>4. Retention</h2><p>Enquiries: handling + 3 years (limitation period). Marketing data: until withdrawal, max 3 years. Then deleted unless the law requires longer.</p>
<h2>5. Recipients</h2><p>We never sell data. We share it only with our hosting provider and tools you consented to (analytics, mailing). No automated decision-making or profiling with legal effects.</p>
<h2>6. Your rights</h2><p>Access, rectification, erasure, restriction, portability, objection, and withdrawal of consent. Write to hello@legalskills.cz — we reply within a month. You may complain to the Czech DPA (uoou.cz).</p>
<h2>7. Local run</h2><p>The LegalSkills suite runs locally inside your AI agent and sends us nothing by itself. Your AI agent's terms apply too.</p>`;
    }
    heading = op["controller"];
  } else { // cookies
    title = cs ? "Zásady cookies" : "Cookie policy";
    desc = cs ? "Jaké cookies a úložiště web legalskills.cz používá." : "What cookies and storage legalskills.cz uses.";
    if (cs) {
      body = `<h2>1. Co ukládáme</h2><div class="table-wrap"><table><thead><tr><th>Kategorie</th><th>Příklad</th><th>Souhlas?</th></tr></thead><tbody><tr><td><strong>Nezbytné</strong> (motiv, volba cookies)</td><td><code>ls-theme</code>, <code>ls-consent</code> v localStorage</td><td>ne — nutné pro web</td></tr><tr><td><strong>Analytické</strong> (návštěvnost)</td><td>měření zobrazení, jen po kliknutí „OK“</td><td>ano — § 89 ZZES + GDPR</td></tr><tr><td><strong>Marketingové</strong></td><td>měření kampaní, jen po kliknutí „OK“</td><td>ano</td></tr></tbody></table></div><p>Bez vašeho „OK“ běží web jen s nezbytným úložištěm. Analytika a marketing se bez souhlasu neukládají ani nenačítají.</p>
<h2>2. Třetí strany</h2><p>Písmo načítáme z Google Fonts (při načtení se Google dozví vaši IP adresu). Po kliknutí „OK“ mohou data zpracovávat i poskytovatelé analytiky či rozesílky — vždy jen v rozsahu souhlasu.</p>
<h2>3. Jak volbu změnit</h2><p>Souhlas odvoláte smazáním klíče <code>ls-consent-v2</code> v prohlížeči (web se pak znovu zeptá) nebo jedním klikem zde:</p><p><button class="btn btn-outline btn-sm" data-cookie-reset>Zobrazit lištu znovu</button></p><p class="small muted">Cookies dále řídíte v nastavení prohlížeče.</p>`;
    } else {
      body = `<h2>1. What we store</h2><div class="table-wrap"><table><thead><tr><th>Category</th><th>Example</th><th>Consent?</th></tr></thead><tbody><tr><td><strong>Strictly necessary</strong> (theme, cookie choice)</td><td><code>ls-theme</code>, <code>ls-consent</code> in localStorage</td><td>no — required</td></tr><tr><td><strong>Analytics</strong> (visits)</td><td>page-view measurement, only after “OK”</td><td>yes</td></tr><tr><td><strong>Marketing</strong></td><td>campaign measurement, only after “OK”</td><td>yes</td></tr></tbody></table></div><p>Without your “OK” the site runs on necessary storage only. Analytics and marketing never load without consent.</p>
<h2>2. Third parties</h2><p>Fonts load from Google Fonts (Google sees your IP on load). After “OK”, analytics or mailing providers may process data — only within your consent.</p>
<h2>3. How to change your choice</h2><p>Withdraw by deleting the <code>ls-consent-v2</code> key in your browser (the site asks again) or in one click here:</p><p><button class="btn btn-outline btn-sm" data-cookie-reset>Show the banner again</button></p><p class="small muted">Cookies can also be managed in your browser settings.</p>`;
    }
    heading = op["controller"];
  }
  let op_block;
  if (cs) {
    op_block = `<h2>${heading}</h2><p><strong>${op["name"]}</strong>, ${op["address"]}, `
      + `IČO ${op["ico"]}. ${op["registry"]} ${op["director"]} `
      + `Kontakt: <a href="mailto:${op["email"]}">${op["email"]}</a>.</p>`;
  } else {
    op_block = `<h2>${heading}</h2><p><strong>${op["name"]}</strong>, ${op["address"]}, `
      + `Company No. ${op["ico"]}. ${op["registry"]} ${op["director"]} `
      + `Contact: <a href="mailto:${op["email"]}">${op["email"]}</a>.</p>`;
  }
  return `<main><section class="section-sm"><div class="wrap"><div class="prose">
  <h1 class="hero-title" style="font-size:clamp(1.9rem,4.4vw,2.8rem)">${title}</h1>
  <p class="lead">${desc}</p><hr class="divider mt-3 mb-3">${body}${op_block}
  </div></div></section></main>`;
}


function terms_page(lang) { return legal_page(lang, "terms"); }
function privacy_page(lang) { return legal_page(lang, "privacy"); }
function cookies_page(lang) { return legal_page(lang, "cookies"); }


// --------------------------------------------------------------------------- //
// Page table (mirrors build() in the Python original)                          //
// --------------------------------------------------------------------------- //
const PAGES = [
  ['', '', 'LegalSkills — sada dovedností pro vašeho agenta', 'Pomoc s jakýmkoli právním dokumentem, workflow i revizí. Funguje s jakýmkoli agentem s podporou skills.',
   'LegalSkills — skill set for your agent', 'Help with any legal document, workflow or review. Works with any agent supporting skills.', home],
  ['skills.html', 'skills.html', 'Co za vás udělá — LegalSkills', 'Právní dovednosti zdarma a placené playbooky, workflow a skilly.',
   'What it does — LegalSkills', 'Legal skills free, plus paid playbooks, workflows and skills.', skills_page],
  ['how-it-works.html', 'how-it-works.html', 'Jak to funguje — LegalSkills', 'Pošlete smlouvu, dostanete přehled, odešlete s klidem.',
   'How it works — LegalSkills', 'Send, review, send calmly.', how_page],
  ['playbooks.html', 'playbooks.html', 'Playbooky, workflow a skilly — LegalSkills', 'Rozšíření a služby: playbooky, workflow a skilly na klíč, profesionální i servisní služby pro vaši kancelář.',
   'Playbooks, workflows and skills — LegalSkills', 'Extensions and services: tailored playbooks, workflows and skills, plus professional and support services for the firm.', playbooks_page],
  ['marketplace.html', 'marketplace.html', 'Katalog rozšíření — LegalSkills', 'Hotová rozšíření připravujeme: skilly, workflow a playbooky. Do té doby je vyrobíme na míru.',
   'Extensions catalogue — LegalSkills', 'Ready-made extensions are on their way: skills, workflows and playbooks. Until then we build them to order.', marketplace_page],
  ['docs.html', 'docs.html', 'Stažení — LegalSkills', 'Odemkněte balíček a hoďte ho svému agentovi.',
   'Download — LegalSkills', 'Unlock the bundle and drop it into your agent.', docs_page],
  ['about.html', 'about.html', 'O nás — LegalSkills', 'Děláme to pro klidné večery právníků.',
   'About — LegalSkills', 'Built for calm evenings.', about_page],
  ['contact.html', 'contact.html', 'Kontakt — LegalSkills', 'Napište nám, ozveme se do dvou dnů.',
   'Contact — LegalSkills', 'Write us, we reply in two days.', contact_page],
  ['blog.html', 'blog.html', 'Blog — LegalSkills', 'Praktické tipy pro smlouvy a vyjednávání.',
   'Blog — LegalSkills', 'Practical tips for contracts.', blog_index],
  ['terms.html', 'terms.html', 'Podmínky užívání — LegalSkills', 'Podmínky užívání webu a asistenční sady.',
   'Terms — LegalSkills', 'Terms of use.', terms_page],
  ['privacy.html', 'privacy.html', 'Ochrana soukromí — LegalSkills', 'Informace o zpracování a ochraně osobních údajů.',
   'Privacy — LegalSkills', 'How we handle personal data.', privacy_page],
  ['cookies.html', 'cookies.html', 'Zásady cookies — LegalSkills', 'Jaké cookies a úložiště web používá.',
   'Cookies — LegalSkills', 'What cookies and storage we use.', cookies_page],
];

export const PAGE_META = {};
for (const [slug, active, tc, dc, te, de] of PAGES) {
  PAGE_META[slug] = { titleCs: tc, titleEn: te, descCs: dc, descEn: de, active };
}
for (const p of POSTS) {
  const slug = 'blog/' + p.slug + '.html';
  PAGE_META[slug] = { titleCs: p.cs[0] + ' — LegalSkills', titleEn: p.en[0] + ' — LegalSkills',
                      descCs: p.cs[1], descEn: p.en[1], active: 'blog.html' };
}

export const SLUGS = [
  ...PAGES.map(p => p[0]),
  ...POSTS.map(p => 'blog/' + p.slug + '.html'),
];


export function renderPage(lang, slug) {
  const pg = PAGES.find(p => p[0] === slug);
  if (pg) {
    const [, active, tc, dc, te, de, fn] = pg;
    const title = lang === 'cs' ? tc : te;
    const desc = lang === 'cs' ? dc : de;
    return pageStr(lang, slug, title, desc, fn(lang), active);
  }
  const post = POSTS.find(p => 'blog/' + p.slug + '.html' === slug);
  if (post) {
    const title = (lang === 'cs' ? post.cs[0] : post.en[0]) + ' — LegalSkills';
    const desc = lang === 'cs' ? post.cs[1] : post.en[1];
    return pageStr(lang, slug, title, desc, post_page(post, lang), 'blog.html');
  }
  throw new Error('unknown slug: ' + slug);
}


export function build(outRoot) {
  let n = 0;
  for (const slug of SLUGS) {
    for (const lang of ['cs', 'en']) {
      const html = renderPage(lang, slug);
      const rel = slug || 'index.html';
      const outPath = lang === 'en' ? path.join(outRoot, 'en', rel) : path.join(outRoot, rel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html, 'utf8');
      n += 1;
    }
  }
  return n;
}
