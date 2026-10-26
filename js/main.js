/* =========================================================================
   PIC Assistance: shared script (all languages)
   UI strings used by JS live in I18N below, keyed by <html lang>.
   Translators: only translate the HTML pages + the I18N entries.
   JS hooks are data-* attributes (see ARCHITECTURE.md).
   ========================================================================= */
(function () {
  'use strict';

  var I18N = {
    fr: {
      locale: 'fr-BE',
      menuOpen: 'Ouvrir le menu',
      menuClose: 'Fermer le menu',
      plans: { essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium' },
      hoursPerWeek: '{n} h / semaine',
      ratePerHour: '{n} / heure',
      hoursPerMonth: 'soit environ {n} h par mois',
      planBar: 'Formule {plan}',
      calcMore: 'Votre temps administratif vaut environ {cost} par mois, soit plus que la formule {plan} ({price} / mois).',
      calcLess: 'La formule {plan} coûte {price} / mois. Vous consacrez aujourd’hui environ {hours} h par mois à l’administratif : à vous de juger ce que vaut ce temps.',
      formRequired: 'Ce champ est obligatoire.',
      formEmail: 'Veuillez saisir une adresse e-mail valide.',
      formConsent: 'Veuillez cocher cette case pour que nous puissions vous répondre.',
      formSending: 'Envoi en cours…',
      formSuccess: 'Merci ! Votre message a bien été envoyé. Nous vous répondons rapidement.',
      formError: 'L’envoi a échoué. Écrivez-nous directement à {email}.',
      formMailto: 'Votre logiciel de messagerie va s’ouvrir avec votre message prérempli. Si rien ne se passe, écrivez-nous à {email}.',
      mailSubject: 'Demande de contact — PIC Assistance'
    },
    en: {
      locale: 'en-BE',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      plans: { essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium' },
      hoursPerWeek: '{n} h / week',
      ratePerHour: '{n} / hour',
      hoursPerMonth: 'or about {n} hours per month',
      planBar: '{plan} plan',
      calcMore: 'Your admin time is worth about {cost} per month, which is more than the {plan} plan ({price} / month).',
      calcLess: 'The {plan} plan costs {price} / month. Today you spend about {hours} hours a month on admin: you decide what that time is worth.',
      formRequired: 'This field is required.',
      formEmail: 'Please enter a valid email address.',
      formConsent: 'Please tick this box so we can reply to you.',
      formSending: 'Sending…',
      formSuccess: 'Thank you! Your message has been sent. We will get back to you quickly.',
      formError: 'Sending failed. Please write to us directly at {email}.',
      formMailto: 'Your email app will open with your message pre-filled. If nothing happens, write to us at {email}.',
      mailSubject: 'Contact request — PIC Assistance'
    },
    nl: {
      locale: 'nl-BE',
      menuOpen: 'Menu openen',
      menuClose: 'Menu sluiten',
      plans: { essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium' },
      hoursPerWeek: '{n} u / week',
      ratePerHour: '{n} / uur',
      hoursPerMonth: 'of ongeveer {n} uur per maand',
      planBar: 'Formule {plan}',
      calcMore: 'Uw administratieve tijd is ongeveer {cost} per maand waard, meer dan de formule {plan} ({price} / maand).',
      calcLess: 'De formule {plan} kost {price} / maand. U besteedt vandaag ongeveer {hours} uur per maand aan administratie: oordeel zelf wat die tijd u waard is.',
      formRequired: 'Dit veld is verplicht.',
      formEmail: 'Vul een geldig e-mailadres in.',
      formConsent: 'Vink dit vakje aan zodat we u kunnen antwoorden.',
      formSending: 'Bezig met verzenden…',
      formSuccess: 'Bedankt! Uw bericht is verzonden. We antwoorden u snel.',
      formError: 'Verzenden mislukt. Schrijf ons rechtstreeks op {email}.',
      formMailto: 'Uw e-mailprogramma opent met uw bericht al ingevuld. Gebeurt er niets? Schrijf ons op {email}.',
      mailSubject: 'Contactaanvraag — PIC Assistance'
    }
  };

  /* Monthly prices (EUR). Single source for the calculator. */
  var PLANS = { essentiel: 190, pro: 390, premium: 690 };
  var PLAN_ORDER = ['essentiel', 'pro', 'premium'];
  var CONTACT_EMAIL = 'contact.picassistance@gmail.com';

  var root = document.documentElement;
  var lang = (root.getAttribute('lang') || 'fr').slice(0, 2).toLowerCase();
  var t = I18N[lang] || I18N.fr;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.classList.add('js');

  function fill(str, vars) {
    return str.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; });
  }
  var money;
  var num;
  try {
    money = new Intl.NumberFormat(t.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
    num = new Intl.NumberFormat(t.locale, { maximumFractionDigits: 0 });
  } catch (e) {
    money = { format: function (v) { return Math.round(v) + ' €'; } };
    num = { format: function (v) { return String(Math.round(v)); } };
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Header shadow on scroll ---------- */
  var header = document.querySelector('[data-header]');
  if (header) {
    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Burger menu ---------- */
  var toggle = document.querySelector('[data-nav-toggle]');
  var nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    var label = toggle.querySelector('[data-nav-toggle-label]');
    var desktop = window.matchMedia('(min-width: 960px)');
    var setNav = function (open, restoreFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('nav-open', open);
      if (label) label.textContent = open ? t.menuClose : t.menuOpen;
      if (open) {
        var first = nav.querySelector('a');
        // wait a frame: the nav only becomes focusable once its visibility transition has applied
        if (first) setTimeout(function () { first.focus(); }, 50);
      } else if (restoreFocus) {
        toggle.focus();
      }
    };
    var isOpen = function () { return toggle.getAttribute('aria-expanded') === 'true'; };
    if (label) label.textContent = t.menuOpen;

    toggle.addEventListener('click', function () { setNav(!isOpen(), false); });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && isOpen()) setNav(false, false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) setNav(false, true);
    });
    var onBreakpoint = function () { if (desktop.matches && isOpen()) setNav(false, false); };
    if (desktop.addEventListener) desktop.addEventListener('change', onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- Range inputs: track fill ---------- */
  function paintRange(input) {
    var min = parseFloat(input.min) || 0;
    var max = parseFloat(input.max) || 100;
    var pct = ((parseFloat(input.value) - min) / (max - min)) * 100;
    input.style.setProperty('--fill', pct + '%');
  }

  /* ---------- Savings calculator ---------- */
  var calc = document.querySelector('[data-calc]');
  if (calc) {
    var hoursIn = calc.querySelector('[data-calc-hours]');
    var rateIn = calc.querySelector('[data-calc-rate]');
    var needs = calc.querySelectorAll('[data-calc-need]');
    var out = function (sel) { return calc.querySelector(sel); };
    var cta = out('[data-calc-cta]');
    var ctaBase = cta ? cta.getAttribute('href').split('?')[0] : '';

    var update = function () {
      var hours = parseFloat(hoursIn.value) || 0;
      var rate = parseFloat(rateIn.value) || 0;
      var monthHours = hours * 52 / 12;
      var cost = monthHours * rate;

      // Suggested plan = highest tier among the ticked needs (default: essentiel)
      var plan = 'essentiel';
      needs.forEach(function (cb) {
        if (cb.checked && PLAN_ORDER.indexOf(cb.value) > PLAN_ORDER.indexOf(plan)) plan = cb.value;
      });
      var price = PLANS[plan];
      var planName = t.plans[plan];

      paintRange(hoursIn);
      paintRange(rateIn);
      out('[data-calc-hours-out]').textContent = fill(t.hoursPerWeek, { n: num.format(hours) });
      out('[data-calc-rate-out]').textContent = fill(t.ratePerHour, { n: money.format(rate) });
      out('[data-calc-cost]').textContent = money.format(cost);
      out('[data-calc-month-hours]').textContent = fill(t.hoursPerMonth, { n: num.format(monthHours) });
      out('[data-calc-plan-label]').textContent = fill(t.planBar, { plan: planName });

      var max = Math.max(cost, price) || 1;
      out('[data-calc-bar-cost]').style.width = Math.max(2, (cost / max) * 100) + '%';
      out('[data-calc-bar-plan]').style.width = Math.max(2, (price / max) * 100) + '%';

      var vars = { cost: money.format(cost), plan: planName, price: money.format(price), hours: num.format(monthHours) };
      out('[data-calc-suggestion]').textContent = fill(cost > price ? t.calcMore : t.calcLess, vars);
      if (cta) cta.setAttribute('href', ctaBase + '?formule=' + plan);
    };

    calc.addEventListener('input', update);
    calc.addEventListener('change', update);
    update();
  }

  /* ---------- Plan picker (tarifs): highlight cards + table column ---------- */
  var picker = document.querySelector('[data-plan-picker]');
  if (picker) {
    picker.addEventListener('change', function (e) {
      var plan = e.target.value;
      document.querySelectorAll('[data-plan]').forEach(function (el) {
        el.classList.toggle('is-highlighted', el.getAttribute('data-plan') === plan);
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('[type="submit"]');
    var email = form.getAttribute('data-mailto') || CONTACT_EMAIL;
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    // Preselect plan from ?formule=pro
    var wanted = new URLSearchParams(window.location.search).get('formule');
    var select = form.querySelector('select[name="formule"]');
    var wantedClean = wanted ? wanted.toLowerCase().replace(/[^a-z-]/g, '') : '';
    if (wantedClean && select && select.querySelector('option[value="' + wantedClean + '"]')) {
      select.value = wantedClean;
    }

    var setStatus = function (msg, kind) {
      status.textContent = msg;
      status.className = 'form-status' + (kind ? ' is-' + kind : '');
    };
    var setError = function (field, msg) {
      var err = document.getElementById(field.id + '-error');
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.textContent = msg || ''; err.hidden = !msg; }
    };
    var check = function (field) {
      var v = field.type === 'checkbox' ? field.checked : field.value.trim();
      var msg = '';
      if (field.required && !v) msg = field.type === 'checkbox' ? t.formConsent : t.formRequired;
      else if (field.type === 'email' && v && !emailRe.test(v)) msg = t.formEmail;
      setError(field, msg);
      return !msg;
    };
    var fields = Array.prototype.slice.call(form.querySelectorAll('[required]'));

    fields.forEach(function (f) {
      f.addEventListener(f.type === 'checkbox' ? 'change' : 'blur', function () {
        // Only re-validate once the user typed something or after a failed submit
        if (f.getAttribute('aria-invalid') === 'true' || (f.type !== 'checkbox' && f.value.trim())) check(f);
      });
    });

    var labelOf = function (field) {
      var l = form.querySelector('label[for="' + field.id + '"]');
      if (!l) return field.name;
      var c = l.cloneNode(true);
      c.querySelectorAll('.req').forEach(function (n) { n.remove(); });
      return c.textContent.replace(/\s+/g, ' ').trim();
    };

    var mailtoFallback = function () {
      var lines = [];
      form.querySelectorAll('[data-mail-field]').forEach(function (f) {
        var v = f.tagName === 'SELECT' ? (f.selectedIndex >= 0 ? f.options[f.selectedIndex].text : '') : f.value.trim();
        if (v) lines.push(labelOf(f) + ' : ' + v);
      });
      var href = 'mailto:' + email +
        '?subject=' + encodeURIComponent(t.mailSubject) +
        '&body=' + encodeURIComponent(lines.join('\r\n'));
      setStatus(fill(t.formMailto, { email: email }), 'ok');
      window.location.href = href;
    };

    var sendFormspree = function () {
      var original = submit.textContent;
      submit.disabled = true;
      submit.textContent = t.formSending;
      setStatus('', '');
      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        setStatus(t.formSuccess, 'ok');
      }).catch(function () {
        setStatus(fill(t.formError, { email: email }), 'error');
      }).then(function () {
        submit.disabled = false;
        submit.textContent = original;
      });
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!check(f) && !firstBad) firstBad = f; });
      if (firstBad) { firstBad.focus(); return; }
      if ((form.getAttribute('action') || '').indexOf('REPLACE_ME') !== -1) mailtoFallback();
      else sendFormspree();
    });
  }
})();
