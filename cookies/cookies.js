/* =========================================================================
   PIC Assistance: cookie consent (GDPR / ePrivacy), no dependency.
   Adapted from the Pinnoydesign module (prefix pd-cookie -> pic-cookie).

   Audit (October 2026): the site sets no cookie and uses no analytics tool.
   Storage used by the site, both strictly necessary / functional:
   - localStorage "pic-cookie-consent": this choice (6 months, versioned);
   - sessionStorage "pic-chat-teaser": the chat teaser was shown this visit
     (set by chatbot/chatbot.js).

   API for future scripts:
     window.picCookies.has('analytics')   -> true/false
     window.picCookies.get()              -> { necessary, analytics, date, expires } | null
     window.picCookies.open()             -> reopens the preferences
     document.addEventListener('pic-consent-change', e => e.detail.analytics ...)
   Or, without code: <script type="text/plain" data-pic-cookie="analytics" data-src="...">
   is only loaded once the visitor consents to that category.
   Footer buttons: any element with [data-pic-cookie-open] opens the preferences.
   ========================================================================= */
(function () {
  'use strict';

  var KEY = 'pic-cookie-consent';
  var VERSION = 1; // bump (and name the tool in the texts + privacy pages) when a real analytics tool is added
  var DURATION_MS = 182 * 24 * 60 * 60 * 1000; // ~6 months
  var OPTIONAL = ['analytics'];

  var T = {
    fr: {
      title: 'Cookies et vie privée',
      intro: 'Ce site n’utilise aucun cookie publicitaire ni de suivi. Avec votre accord, une mesure d’audience respectueuse pourra être activée plus tard pour améliorer le site. Vous pouvez changer d’avis à tout moment via « Gérer les cookies » en bas de page.',
      more: 'En savoir plus',
      accept: 'Accepter',
      refuse: 'Refuser',
      customize: 'Personnaliser',
      save: 'Enregistrer mes choix',
      prefsTitle: 'Préférences cookies',
      necessary: 'Nécessaires',
      necessaryDesc: 'Indispensables au fonctionnement du site : mémoriser votre choix de cookies (6 mois) et l’affichage du message d’accueil du chat (le temps de la visite). Aucun suivi.',
      alwaysOn: 'Toujours actifs',
      analytics: 'Mesure d’audience',
      analyticsDesc: 'Statistiques de fréquentation anonymes pour savoir quelles pages sont utiles. Aucun outil de ce type n’est actif pour le moment.'
    },
    en: {
      title: 'Cookies and privacy',
      intro: 'This site uses no advertising or tracking cookies. With your consent, privacy-friendly audience measurement may be enabled later to improve the site. You can change your mind at any time via “Manage cookies” at the bottom of the page.',
      more: 'Learn more',
      accept: 'Accept',
      refuse: 'Decline',
      customize: 'Customize',
      save: 'Save my choices',
      prefsTitle: 'Cookie preferences',
      necessary: 'Necessary',
      necessaryDesc: 'Required for the site to work: remembering your cookie choice (6 months) and whether the chat welcome message was shown (for the visit). No tracking.',
      alwaysOn: 'Always on',
      analytics: 'Audience measurement',
      analyticsDesc: 'Anonymous visit statistics to understand which pages are useful. No such tool is active at the moment.'
    },
    nl: {
      title: 'Cookies en privacy',
      intro: 'Deze site gebruikt geen advertentie- of trackingcookies. Met uw toestemming kan later een privacyvriendelijke bezoekersmeting worden ingeschakeld om de site te verbeteren. U kunt uw keuze altijd wijzigen via “Cookies beheren” onderaan de pagina.',
      more: 'Meer info',
      accept: 'Accepteren',
      refuse: 'Weigeren',
      customize: 'Aanpassen',
      save: 'Mijn keuzes opslaan',
      prefsTitle: 'Cookievoorkeuren',
      necessary: 'Noodzakelijk',
      necessaryDesc: 'Onmisbaar voor de werking van de site: uw cookiekeuze onthouden (6 maanden) en of het welkomstbericht van de chat al getoond werd (tijdens het bezoek). Geen tracking.',
      alwaysOn: 'Altijd actief',
      analytics: 'Bezoekersmeting',
      analyticsDesc: 'Anonieme bezoekersstatistieken om te begrijpen welke pagina’s nuttig zijn. Er is momenteel geen dergelijke tool actief.'
    }
  };

  /* ---------- Language + paths ---------- */
  var script = document.currentScript;
  var scriptSrc = (script && script.src) || '';
  var path = location.pathname;
  var htmlLang = (document.documentElement.getAttribute('lang') || '').slice(0, 2).toLowerCase();
  var lang = T[htmlLang] ? htmlLang : (/\/en(\/|$)/.test(path) ? 'en' : (/\/nl(\/|$)/.test(path) ? 'nl' : 'fr'));
  var t = T[lang];

  // Site root = parent of /cookies/ (the script always lives at <root>/cookies/cookies.js)
  function siteRoot() {
    var src = scriptSrc;
    if (!src) {
      var s = document.querySelector('script[src*="cookies/cookies.js"]');
      if (s) src = s.src;
    }
    try { return new URL('../', src || location.href).href; } catch (e) { return '/'; }
  }
  var legalHref = siteRoot() + (lang === 'fr' ? '' : lang + '/') + 'pages/confidentialite.html#cookies';

  /* ---------- Storage ---------- */
  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      if (!c || c.v !== VERSION || !c.expires || Date.parse(c.expires) < Date.now()) {
        localStorage.removeItem(KEY);
        return null;
      }
      return c;
    } catch (e) { return null; }
  }

  var consent = read();

  function snapshot() {
    if (!consent) return null;
    return { necessary: true, analytics: !!consent.analytics, date: consent.date, expires: consent.expires };
  }

  function save(choices) {
    var now = new Date();
    consent = {
      v: VERSION,
      necessary: true,
      analytics: !!choices.analytics,
      date: now.toISOString(),
      expires: new Date(now.getTime() + DURATION_MS).toISOString()
    };
    try { localStorage.setItem(KEY, JSON.stringify(consent)); } catch (e) { /* private mode: the choice lasts for this page */ }
    activateScripts();
    var ev;
    try { ev = new CustomEvent('pic-consent-change', { detail: snapshot() }); }
    catch (e) { ev = document.createEvent('CustomEvent'); ev.initCustomEvent('pic-consent-change', false, false, snapshot()); }
    document.dispatchEvent(ev);
  }

  function has(cat) {
    if (cat === 'necessary') return true;
    return !!(consent && OPTIONAL.indexOf(cat) !== -1 && consent[cat]);
  }

  // Runs the allowed <script type="text/plain" data-pic-cookie="...">
  function activateScripts() {
    var nodes = document.querySelectorAll('script[type="text/plain"][data-pic-cookie]');
    for (var i = 0; i < nodes.length; i++) {
      var old = nodes[i];
      if (!has(old.getAttribute('data-pic-cookie'))) continue;
      var s = document.createElement('script');
      for (var j = 0; j < old.attributes.length; j++) {
        var a = old.attributes[j];
        if (a.name === 'type' || a.name === 'data-src' || a.name === 'data-pic-cookie') continue;
        s.setAttribute(a.name, a.value);
      }
      if (old.getAttribute('data-src')) s.src = old.getAttribute('data-src');
      else s.text = old.text;
      old.parentNode.replaceChild(s, old);
    }
  }

  /* ---------- UI ---------- */
  var root, mainView, prefsView, analyticsInput, lastFocus;

  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    return n;
  }

  function btn(label, action) {
    return el('button', { type: 'button', 'class': 'pic-cookie-btn', 'data-pic-cookie-action': action }, label);
  }

  function build() {
    root = el('div', {
      id: 'pic-cookie-banner',
      'class': 'pic-cookie-banner',
      role: 'dialog',
      'aria-modal': 'false',
      'aria-labelledby': 'pic-cookie-title',
      'aria-describedby': 'pic-cookie-desc',
      tabindex: '-1',
      hidden: ''
    });

    // Main view
    mainView = el('div', { 'class': 'pic-cookie-view', id: 'pic-cookie-main' });
    mainView.appendChild(el('h2', { id: 'pic-cookie-title', 'class': 'pic-cookie-title' }, t.title));
    var p = el('p', { id: 'pic-cookie-desc', 'class': 'pic-cookie-text' }, t.intro + ' ');
    p.appendChild(el('a', { href: legalHref, 'class': 'pic-cookie-link' }, t.more));
    mainView.appendChild(p);
    var actions = el('div', { 'class': 'pic-cookie-actions' });
    actions.appendChild(btn(t.refuse, 'refuse'));
    actions.appendChild(btn(t.accept, 'accept'));
    actions.appendChild(btn(t.customize, 'customize'));
    mainView.appendChild(actions);

    // Preferences view
    prefsView = el('div', { 'class': 'pic-cookie-view', id: 'pic-cookie-prefs', hidden: '' });
    prefsView.appendChild(el('h2', { id: 'pic-cookie-prefs-title', 'class': 'pic-cookie-title', tabindex: '-1' }, t.prefsTitle));

    var list = el('ul', { 'class': 'pic-cookie-cats' });
    var li1 = el('li', { 'class': 'pic-cookie-cat' });
    var h1 = el('div', { 'class': 'pic-cookie-cat-head' });
    h1.appendChild(el('span', { 'class': 'pic-cookie-cat-name' }, t.necessary));
    h1.appendChild(el('span', { 'class': 'pic-cookie-always' }, t.alwaysOn));
    li1.appendChild(h1);
    li1.appendChild(el('p', { 'class': 'pic-cookie-cat-desc' }, t.necessaryDesc));
    list.appendChild(li1);

    var li2 = el('li', { 'class': 'pic-cookie-cat' });
    var h2 = el('div', { 'class': 'pic-cookie-cat-head' });
    h2.appendChild(el('label', { 'class': 'pic-cookie-cat-name', 'for': 'pic-cookie-analytics' }, t.analytics));
    var sw = el('span', { 'class': 'pic-cookie-switch' });
    sw.appendChild(el('input', { type: 'checkbox', role: 'switch', id: 'pic-cookie-analytics', 'aria-describedby': 'pic-cookie-analytics-desc' }));
    sw.appendChild(el('span', { 'class': 'pic-cookie-slider', 'aria-hidden': 'true' }));
    h2.appendChild(sw);
    li2.appendChild(h2);
    li2.appendChild(el('p', { 'class': 'pic-cookie-cat-desc', id: 'pic-cookie-analytics-desc' }, t.analyticsDesc));
    list.appendChild(li2);
    prefsView.appendChild(list);

    var pActions = el('div', { 'class': 'pic-cookie-actions' });
    pActions.appendChild(btn(t.refuse, 'refuse'));
    pActions.appendChild(btn(t.accept, 'accept'));
    pActions.appendChild(btn(t.save, 'save'));
    prefsView.appendChild(pActions);

    root.appendChild(mainView);
    root.appendChild(prefsView);
    document.body.appendChild(root);

    analyticsInput = root.querySelector('#pic-cookie-analytics');

    root.addEventListener('click', function (e) {
      var target = e.target.closest ? e.target.closest('[data-pic-cookie-action]') : null;
      if (!target) return;
      var action = target.getAttribute('data-pic-cookie-action');
      if (action === 'accept') { save({ analytics: true }); hide(); }
      else if (action === 'refuse') { save({ analytics: false }); hide(); }
      else if (action === 'save') { save({ analytics: analyticsInput.checked }); hide(); }
      else if (action === 'customize') { showPrefs(); }
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (consent) { e.preventDefault(); hide(); }
        else if (!prefsView.hidden) { e.preventDefault(); show(false); }
      }
      else if (e.key === 'Tab' && !prefsView.hidden) trapFocus(e); // the first-load banner stays non-blocking
    });
  }

  function focusables() {
    var view = prefsView.hidden ? mainView : prefsView;
    return Array.prototype.filter.call(
      view.querySelectorAll('a[href], button, input'),
      function (n) { return !n.disabled && n.offsetParent !== null; }
    );
  }

  function trapFocus(e) {
    var f = focusables();
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    var active = document.activeElement;
    var outside = !root.contains(active) || active === root || active.id === 'pic-cookie-prefs-title';
    if (e.shiftKey && (active === first || outside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  function focusEl(n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }

  function show(prefs, noFocus) {
    if (!root) build();
    if (root.hidden) lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add('pic-cookie-open');
    if (prefs) showPrefs();
    else {
      prefsView.hidden = true;
      mainView.hidden = false;
      root.setAttribute('aria-labelledby', 'pic-cookie-title');
      root.setAttribute('aria-describedby', 'pic-cookie-desc');
      if (!noFocus) focusEl(root);
    }
  }

  function showPrefs() {
    analyticsInput.checked = has('analytics');
    mainView.hidden = true;
    prefsView.hidden = false;
    root.setAttribute('aria-labelledby', 'pic-cookie-prefs-title');
    root.removeAttribute('aria-describedby');
    focusEl(root.querySelector('#pic-cookie-prefs-title'));
  }

  function hide() {
    if (!root) return;
    root.hidden = true;
    document.documentElement.classList.remove('pic-cookie-open');
    if (lastFocus && lastFocus.focus && document.contains(lastFocus) && lastFocus !== document.body) focusEl(lastFocus);
    lastFocus = null;
  }

  /* ---------- Public API ---------- */
  window.picCookies = {
    has: has,
    get: snapshot,
    open: function () { show(true); },
    categories: ['necessary'].concat(OPTIONAL)
  };

  function init() {
    // "Manage cookies" buttons (footer, privacy page): [data-pic-cookie-open]
    document.addEventListener('click', function (e) {
      var opener = e.target.closest ? e.target.closest('[data-pic-cookie-open]') : null;
      if (!opener) return;
      e.preventDefault();
      show(true);
      lastFocus = opener;
    });
    activateScripts();
    if (!consent) show(false, true); // first load: no focus steal, no trap
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
