/* =========================================================================
   PIC Assistance: FAQ chatbot (client-side only)
   - No API, no server call, no cookie: messages live only in the page and
     disappear on reload. The only storage is a sessionStorage flag
     ("pic-chat-teaser") so the teaser bubble shows once per visit.
   - Answers in the page language (<html lang> fr|en|nl, else URL, else fr).
   - User text is only ever inserted with textContent.
   - Test hook: window.picChat.match(text) -> intent id.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- Language + links ---------- */
  var script = document.currentScript;
  var scriptSrc = (script && script.src) || '';

  function detectLang() {
    var l = ((document.documentElement && document.documentElement.lang) || '').slice(0, 2).toLowerCase();
    if (l === 'fr' || l === 'en' || l === 'nl') return l;
    var path = (window.location && window.location.pathname) || '';
    if (/\/en(\/|$)/.test(path)) return 'en';
    if (/\/nl(\/|$)/.test(path)) return 'nl';
    return 'fr';
  }
  var LANG = detectLang();
  var EMAIL = 'contact.picassistance@gmail.com';

  // Site root = parent of /chatbot/ (the script always lives at <root>/chatbot/chatbot.js)
  function siteRoot() {
    var src = scriptSrc;
    if (!src && document.querySelector) {
      var s = document.querySelector('script[src*="chatbot/chatbot.js"]');
      if (s) src = s.src;
    }
    try { return new URL('../', src || window.location.href).href; } catch (e) { return '/'; }
  }
  function href(path) {
    return siteRoot() + (LANG === 'fr' ? '' : LANG + '/') + path;
  }

  /* ---------- UI strings ---------- */
  var UI = {
    fr: {
      open: 'Ouvrir l’assistant PIC Assistance', close: 'Fermer l’assistant',
      title: 'Assistant PIC', sub: 'Réponses automatiques aux questions fréquentes',
      placeholder: 'Posez votre question…', input: 'Votre question', send: 'Envoyer',
      note: 'Assistant automatique. Vos messages restent dans votre navigateur et ne sont pas enregistrés.',
      typing: 'L’assistant écrit…', you: 'Vous', bot: 'Assistant', suggestions: 'Suggestions',
      teaser: 'Une question ? Je vous réponds en direct.', teaserClose: 'Masquer ce message'
    },
    en: {
      open: 'Open the PIC Assistance assistant', close: 'Close the assistant',
      title: 'PIC Assistant', sub: 'Automatic answers to frequent questions',
      placeholder: 'Ask your question…', input: 'Your question', send: 'Send',
      note: 'Automatic assistant. Your messages stay in your browser and are not stored.',
      typing: 'The assistant is typing…', you: 'You', bot: 'Assistant', suggestions: 'Suggestions',
      teaser: 'Got a question? Ask me here.', teaserClose: 'Dismiss this message'
    },
    nl: {
      open: 'De PIC Assistance-assistent openen', close: 'De assistent sluiten',
      title: 'PIC-assistent', sub: 'Automatische antwoorden op veelgestelde vragen',
      placeholder: 'Stel uw vraag…', input: 'Uw vraag', send: 'Versturen',
      note: 'Automatische assistent. Uw berichten blijven in uw browser en worden niet bewaard.',
      typing: 'De assistent typt…', you: 'U', bot: 'Assistent', suggestions: 'Suggesties',
      teaser: 'Een vraag? Stel ze hier.', teaserClose: 'Dit bericht verbergen'
    }
  };

  /* Chip labels (chip id = intent id) */
  var CHIPS = {
    fr: {
      services: 'Vos services', prices: 'Tarifs', compare: 'Quelle formule pour moi ?', peppol: 'Peppol',
      trial: 'Essai gratuit', contact: 'Parler à un humain', security: 'Sécurité et RGPD', accountant: 'Faites-vous la compta ?',
      process: 'Comment ça démarre ?', essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium',
      pick_essentiel: 'Surtout les factures', pick_pro: 'Mails & agenda', pick_premium: 'Je rate des appels', pick_unsure: 'Un peu de tout', ai: 'Est-ce une IA ?', about: 'C’est quoi PIC ?'
    },
    en: {
      services: 'Your services', prices: 'Pricing', compare: 'Which plan for me?', peppol: 'Peppol',
      trial: 'Free trial', contact: 'Talk to a human', security: 'Security & GDPR', accountant: 'Do you do accounting?',
      process: 'How do we start?', essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium',
      pick_essentiel: 'Mostly invoices', pick_pro: 'Email & calendar', pick_premium: 'I miss calls', pick_unsure: 'A bit of everything', ai: 'Is it an AI?', about: 'What is PIC?'
    },
    nl: {
      services: 'Uw diensten', prices: 'Tarieven', compare: 'Welke formule voor mij?', peppol: 'Peppol',
      trial: 'Gratis proefperiode', contact: 'Met een mens praten', security: 'Veiligheid & AVG', accountant: 'Doen jullie boekhouding?',
      process: 'Hoe begint het?', essentiel: 'Essentiel', pro: 'Pro', premium: 'Premium',
      pick_essentiel: 'Vooral facturen', pick_pro: 'Mail & agenda', pick_premium: 'Ik mis oproepen', pick_unsure: 'Een beetje van alles', ai: 'Is het AI?', about: 'Wat is PIC?'
    }
  };

  /* Link labels: [label, path] (path relative to the language folder, or mailto:) */
  var L = {
    fr: {
      pricing: ['Voir les tarifs', 'pages/tarifs.html'],
      compare: ['Comparer les formules', 'pages/tarifs.html#comparatif'],
      faq: ['Questions fréquentes', 'pages/tarifs.html#faq'],
      contact: ['Nous contacter', 'pages/contact.html'],
      trial: ['Démarrer l’essai gratuit', 'pages/contact.html'],
      essentiel: ['Essayer Essentiel', 'pages/contact.html?formule=essentiel'],
      pro: ['Essayer Pro', 'pages/contact.html?formule=pro'],
      premium: ['Essayer Premium', 'pages/contact.html?formule=premium'],
      calc: ['Utiliser le calculateur', 'index.html#calculateur'],
      legal: ['Mentions légales', 'pages/mentions-legales.html'],
      privacy: ['Politique de confidentialité', 'pages/confidentialite.html'],
      email: [EMAIL, 'mailto:' + EMAIL]
    },
    en: {
      pricing: ['See pricing', 'pages/tarifs.html'],
      compare: ['Compare the plans', 'pages/tarifs.html#comparatif'],
      faq: ['FAQ', 'pages/tarifs.html#faq'],
      contact: ['Contact us', 'pages/contact.html'],
      trial: ['Start the free trial', 'pages/contact.html'],
      essentiel: ['Try Essentiel', 'pages/contact.html?formule=essentiel'],
      pro: ['Try Pro', 'pages/contact.html?formule=pro'],
      premium: ['Try Premium', 'pages/contact.html?formule=premium'],
      calc: ['Use the calculator', 'index.html#calculateur'],
      legal: ['Legal notice', 'pages/mentions-legales.html'],
      privacy: ['Privacy policy', 'pages/confidentialite.html'],
      email: [EMAIL, 'mailto:' + EMAIL]
    },
    nl: {
      pricing: ['Bekijk de tarieven', 'pages/tarifs.html'],
      compare: ['Formules vergelijken', 'pages/tarifs.html#comparatif'],
      faq: ['Veelgestelde vragen', 'pages/tarifs.html#faq'],
      contact: ['Contacteer ons', 'pages/contact.html'],
      trial: ['Gratis proefperiode starten', 'pages/contact.html'],
      essentiel: ['Essentiel uitproberen', 'pages/contact.html?formule=essentiel'],
      pro: ['Pro uitproberen', 'pages/contact.html?formule=pro'],
      premium: ['Premium uitproberen', 'pages/contact.html?formule=premium'],
      calc: ['De calculator gebruiken', 'index.html#calculateur'],
      legal: ['Juridische vermeldingen', 'pages/mentions-legales.html'],
      privacy: ['Privacybeleid', 'pages/confidentialite.html'],
      email: [EMAIL, 'mailto:' + EMAIL]
    }
  };

  var DEFAULT_CHIPS = ['services', 'prices', 'compare', 'peppol', 'trial', 'contact'];

  /* ---------- Answers: t = paragraphs ("• " = list item), l = link keys, c = chips ---------- */
  var A = {
    fr: {
      welcome: { t: ['Bonjour ! Je suis l’assistant automatique de PIC Assistance. Posez-moi une question sur nos services, nos formules, Peppol ou l’essai gratuit.'], c: DEFAULT_CHIPS },
      greeting: { t: ['Bonjour ! Comment puis-je vous aider ? Je réponds aux questions sur nos services, nos formules, Peppol, la sécurité ou l’essai gratuit.'], c: DEFAULT_CHIPS },
      about: { t: ['PIC Assistance est un assistant administratif à distance pour les indépendants en Belgique : plombiers, électriciens, kinés, thérapeutes, consultants, artisans…', 'Une équipe humaine, aidée par des outils et l’IA : l’IA prépare, un humain vérifie et valide. On gère votre administratif, vous faites votre métier.'], c: ['services', 'prices', 'trial'] },
      services: { t: ['Selon la formule :', '• Essentiel : devis et factures (y compris via Peppol), rappels des factures impayées, tri des justificatifs envoyés à votre comptable chaque mois.', '• Pro : en plus, gestion quotidienne de la boîte mail, de l’agenda et des rendez-vous, suivi des fournisseurs.', '• Premium : en plus, rappel des appels manqués par message, mise en place de la réservation en ligne et des rappels automatiques.'], l: ['pricing'], c: ['compare', 'accountant', 'trial'] },
      essentiel: { t: ['Formule Essentiel : 190 € / mois.', '• Envoi des devis et factures (y compris via Peppol)', '• Rappels des factures impayées', '• Tri des justificatifs et envoi au comptable chaque mois', '2 semaines d’essai gratuit, sans engagement.'], l: ['essentiel', 'pricing'], c: ['pro', 'compare'] },
      pro: { t: ['Formule Pro : 390 € / mois.', '• Tout ce qui est inclus dans Essentiel', '• Gestion quotidienne de la boîte mail', '• Gestion de l’agenda et des rendez-vous', '• Suivi des fournisseurs', '2 semaines d’essai gratuit, sans engagement.'], l: ['pro', 'pricing'], c: ['premium', 'compare'] },
      premium: { t: ['Formule Premium : 690 € / mois.', '• Tout ce qui est inclus dans Pro', '• Rappel des appels manqués (par message)', '• Mise en place de la réservation en ligne', '• Mise en place des rappels automatiques', '2 semaines d’essai gratuit, sans engagement.'], l: ['premium', 'pricing'], c: ['essentiel', 'compare'] },
      compare: { t: ['Je vous aide à choisir. Qu’est-ce qui vous prend le plus de temps aujourd’hui ?'], c: ['pick_essentiel', 'pick_pro', 'pick_premium', 'pick_unsure'] },
      pick_essentiel: { t: ['Alors la formule Essentiel (190 € / mois) vous convient : devis et factures (y compris via Peppol), rappels des impayés et justificatifs triés pour votre comptable.'], l: ['essentiel', 'compare'], c: ['pick_pro', 'trial'] },
      pick_pro: { t: ['Alors la formule Pro (390 € / mois) vous convient : tout Essentiel, plus la gestion quotidienne de votre boîte mail, de votre agenda, de vos rendez-vous et le suivi des fournisseurs.'], l: ['pro', 'compare'], c: ['pick_premium', 'trial'] },
      pick_premium: { t: ['Alors la formule Premium (690 € / mois) vous convient : tout Pro, plus vos appels manqués rappelés par message, la réservation en ligne et les rappels automatiques.'], l: ['premium', 'compare'], c: ['trial', 'contact'] },
      pick_unsure: { t: ['Dites-nous ce qui vous prend du temps : nous vous proposons la formule adaptée. Le calculateur de la page d’accueil peut aussi vous orienter.'], l: ['contact', 'calc'], c: ['prices', 'trial'] },
      prices: { t: ['Trois formules mensuelles :', '• Essentiel : 190 € / mois', '• Pro : 390 € / mois', '• Premium : 690 € / mois', 'TVA non applicable (régime de franchise des petites entreprises). Vous commencez par 2 semaines d’essai gratuit, sans engagement.'], l: ['pricing'], c: ['compare', 'essentiel', 'pro', 'premium'] },
      trial: { t: ['Vous testez PIC Assistance pendant 2 semaines, gratuitement et sans engagement. Contactez-nous pour démarrer : dites-nous ce qui vous prend du temps, nous vous proposons la formule adaptée.'], l: ['trial'], c: ['process', 'compare'] },
      peppol: { t: ['Peppol est le réseau d’échange de factures électroniques. Depuis le 1er janvier 2026, les entreprises belges assujetties à la TVA doivent envoyer et recevoir leurs factures B2B par voie électronique via Peppol.', 'Nous vous aidons à le mettre en place et nous le gérons pour vous, dès la formule Essentiel.'], l: ['essentiel'], c: ['essentiel', 'accountant'] },
      accountant: { t: ['Non. PIC Assistance ne fait ni comptabilité, ni déclarations TVA, ni déclarations fiscales : en Belgique, ces missions sont réservées aux experts-comptables certifiés ITAA.', 'Nous préparons et trions vos documents, puis nous les envoyons à votre propre comptable.'], l: ['faq'], c: ['services', 'peppol'] },
      vat: { t: ['Nos prix sont mensuels, TVA non applicable (régime de franchise des petites entreprises).', 'Pour vos propres factures : nous les préparons et les envoyons (y compris via Peppol) dès la formule Essentiel. Vos déclarations TVA restent le travail de votre comptable certifié ITAA.'], l: ['pricing'], c: ['accountant', 'peppol'] },
      security: { t: ['Vous ne partagez jamais vos mots de passe : nous travaillons dans vos comptes via des accès délégués.', 'Nous travaillons dans la confidentialité et signons avec chaque client un accord de traitement des données conforme au RGPD.'], l: ['privacy'], c: ['process', 'ai'] },
      ai: { t: ['Ce n’est pas une IA qui gère votre administratif : c’est une équipe humaine aidée par des outils et l’IA. L’IA prépare, un humain vérifie et valide.', 'Ce chat, lui, est un assistant automatique qui répond aux questions fréquentes.'], c: ['security', 'contact'] },
      process: { t: ['Comment ça marche :', '• Vous nous contactez et nous expliquez votre activité et ce qui vous prend du temps.', '• Vous démarrez par 2 semaines d’essai gratuit, sans engagement.', '• Nous travaillons via des accès délégués (jamais de mot de passe) et un accord RGPD est signé.', '• Nos outils et l’IA préparent, un membre de l’équipe vérifie et valide. Votre comptable reçoit des documents triés.'], l: ['trial'], c: ['compare', 'security'] },
      founders: { t: ['PIC Assistance a été fondée par Maurice Pinnoy, Flavio Immoridino et Alexandre Chartz.', 'L’activité est actuellement exercée via Pinnoydesign, entreprise individuelle de Maurice Pinnoy à Namur (BCE BE 1043.052.381), TVA non applicable (régime de franchise).'], l: ['legal'], c: ['about', 'contact'] },
      languages: { t: ['Nous travaillons en français, en néerlandais et en anglais.'], c: ['services', 'contact'] },
      zone: { t: ['Nous travaillons à distance, pour les indépendants partout en Belgique.'], c: ['process', 'trial'] },
      jobs: { t: ['Pour les indépendants en Belgique : plombiers, électriciens, kinés, thérapeutes, consultants, artisans… Si l’administratif vous prend du temps, parlons-en.'], l: ['contact'], c: ['services', 'compare'] },
      contract: { t: ['L’essai de 2 semaines est gratuit et sans engagement. Les formules sont mensuelles ; leurs conditions sont précisées dans le contrat.', 'Pour une question précise, écrivez-nous.'], l: ['contact', 'email'], c: ['trial', 'prices'] },
      contact: { t: ['Le plus simple : le formulaire de contact, ou un e-mail à ' + EMAIL + '. Nous répondons rapidement.'], l: ['contact', 'email'], c: ['trial'] },
      legal: { t: ['Vous trouverez nos informations légales et notre politique de confidentialité ci-dessous.', 'Ce chat fonctionne entièrement dans votre navigateur : vos messages ne sont ni envoyés ni enregistrés.'], l: ['legal', 'privacy'], c: ['security'] },
      thanks: { t: ['Avec plaisir ! Puis-je vous aider pour autre chose ?'], c: DEFAULT_CHIPS },
      bye: { t: ['Merci de votre visite, à bientôt ! Pour démarrer votre essai gratuit, le formulaire de contact vous attend.'], l: ['trial'] },
      fallback: { t: ['Je n’ai pas bien compris. Je réponds aux questions sur nos services, nos formules, Peppol, l’essai gratuit ou la sécurité.', 'Pour toute autre question, écrivez-nous : nous répondons rapidement.'], l: ['contact', 'email'], c: DEFAULT_CHIPS }
    },
    en: {
      welcome: { t: ['Hello! I’m the automatic assistant of PIC Assistance. Ask me about our services, plans, Peppol or the free trial.'], c: DEFAULT_CHIPS },
      greeting: { t: ['Hello! How can I help? I answer questions about our services, plans, Peppol, security and the free trial.'], c: DEFAULT_CHIPS },
      about: { t: ['PIC Assistance is a remote administrative assistant for self-employed professionals in Belgium: plumbers, electricians, physiotherapists, therapists, consultants, craftspeople…', 'A human team, supported by tools and AI: AI prepares, a human checks and validates. We handle your admin, you get on with your job.'], c: ['services', 'prices', 'trial'] },
      services: { t: ['Depending on the plan:', '• Essentiel: quotes and invoices (including via Peppol), reminders for unpaid invoices, sorting your receipts and sending them to your accountant every month.', '• Pro: on top of that, daily management of your mailbox, calendar and appointments, and supplier follow-up.', '• Premium: on top of that, missed calls answered by message, setting up online booking and automatic reminders.'], l: ['pricing'], c: ['compare', 'accountant', 'trial'] },
      essentiel: { t: ['Essentiel plan: €190 / month.', '• Sending quotes and invoices (including via Peppol)', '• Reminders for unpaid invoices', '• Sorting receipts and sending them to your accountant every month', '2-week free trial, no commitment.'], l: ['essentiel', 'pricing'], c: ['pro', 'compare'] },
      pro: { t: ['Pro plan: €390 / month.', '• Everything in Essentiel', '• Daily mailbox management', '• Calendar and appointment management', '• Supplier follow-up', '2-week free trial, no commitment.'], l: ['pro', 'pricing'], c: ['premium', 'compare'] },
      premium: { t: ['Premium plan: €690 / month.', '• Everything in Pro', '• Missed calls answered (by message)', '• Setting up online booking', '• Setting up automatic reminders', '2-week free trial, no commitment.'], l: ['premium', 'pricing'], c: ['essentiel', 'compare'] },
      compare: { t: ['Let me help you choose. What takes up most of your time today?'], c: ['pick_essentiel', 'pick_pro', 'pick_premium', 'pick_unsure'] },
      pick_essentiel: { t: ['Then the Essentiel plan (€190 / month) fits you: quotes and invoices (including via Peppol), unpaid invoice reminders and receipts sorted for your accountant.'], l: ['essentiel', 'compare'], c: ['pick_pro', 'trial'] },
      pick_pro: { t: ['Then the Pro plan (€390 / month) fits you: everything in Essentiel, plus daily management of your mailbox, calendar, appointments and supplier follow-up.'], l: ['pro', 'compare'], c: ['pick_premium', 'trial'] },
      pick_premium: { t: ['Then the Premium plan (€690 / month) fits you: everything in Pro, plus missed calls answered by message, online booking and automatic reminders.'], l: ['premium', 'compare'], c: ['trial', 'contact'] },
      pick_unsure: { t: ['Tell us what takes up your time and we’ll suggest the right plan. The calculator on the home page can also point you in the right direction.'], l: ['contact', 'calc'], c: ['prices', 'trial'] },
      prices: { t: ['Three monthly plans:', '• Essentiel: €190 / month', '• Pro: €390 / month', '• Premium: €690 / month', 'VAT not applicable (small business exemption scheme). You start with a 2-week free trial, no commitment.'], l: ['pricing'], c: ['compare', 'essentiel', 'pro', 'premium'] },
      trial: { t: ['You can try PIC Assistance for 2 weeks, free and with no commitment. Contact us to start: tell us what takes up your time and we’ll suggest the right plan.'], l: ['trial'], c: ['process', 'compare'] },
      peppol: { t: ['Peppol is the network for exchanging electronic invoices. Since 1 January 2026, VAT-registered Belgian businesses must send and receive their B2B invoices electronically via Peppol.', 'We help you set it up and manage it for you, from the Essentiel plan.'], l: ['essentiel'], c: ['essentiel', 'accountant'] },
      accountant: { t: ['No. PIC Assistance does not do accounting, VAT returns or tax returns: in Belgium, these tasks are reserved for ITAA-certified accountants.', 'We prepare and sort your documents, then send them to your own accountant.'], l: ['faq'], c: ['services', 'peppol'] },
      vat: { t: ['Our prices are monthly, VAT not applicable (small business exemption scheme).', 'For your own invoices: we prepare and send them (including via Peppol) from the Essentiel plan. Your VAT returns remain the job of your ITAA-certified accountant.'], l: ['pricing'], c: ['accountant', 'peppol'] },
      security: { t: ['You never share your passwords: we work in your accounts through delegated access.', 'We work confidentially and sign a GDPR-compliant data processing agreement with every client.'], l: ['privacy'], c: ['process', 'ai'] },
      ai: { t: ['Your admin is not handled by an AI: it’s a human team supported by tools and AI. AI prepares, a human checks and validates.', 'This chat, however, is an automatic assistant that answers frequent questions.'], c: ['security', 'contact'] },
      process: { t: ['How it works:', '• You contact us and tell us about your business and what takes up your time.', '• You start with a 2-week free trial, no commitment.', '• We work through delegated access (never a password) and a GDPR agreement is signed.', '• Our tools and AI prepare, a team member checks and validates. Your accountant receives sorted documents.'], l: ['trial'], c: ['compare', 'security'] },
      founders: { t: ['PIC Assistance was founded by Maurice Pinnoy, Flavio Immoridino and Alexandre Chartz.', 'The business is currently operated through Pinnoydesign, the sole proprietorship of Maurice Pinnoy in Namur (CBE BE 1043.052.381), VAT not applicable (exemption scheme).'], l: ['legal'], c: ['about', 'contact'] },
      languages: { t: ['We work in French, Dutch and English.'], c: ['services', 'contact'] },
      zone: { t: ['We work remotely, for self-employed professionals anywhere in Belgium.'], c: ['process', 'trial'] },
      jobs: { t: ['For self-employed professionals in Belgium: plumbers, electricians, physiotherapists, therapists, consultants, craftspeople… If admin is eating your time, let’s talk.'], l: ['contact'], c: ['services', 'compare'] },
      contract: { t: ['The 2-week trial is free and comes with no commitment. The plans are monthly; their terms are set out in the contract.', 'For a specific question, write to us.'], l: ['contact', 'email'], c: ['trial', 'prices'] },
      contact: { t: ['The easiest way: the contact form, or an email to ' + EMAIL + '. We reply quickly.'], l: ['contact', 'email'], c: ['trial'] },
      legal: { t: ['You’ll find our legal notice and privacy policy below.', 'This chat runs entirely in your browser: your messages are neither sent nor stored.'], l: ['legal', 'privacy'], c: ['security'] },
      thanks: { t: ['You’re welcome! Anything else I can help with?'], c: DEFAULT_CHIPS },
      bye: { t: ['Thanks for visiting, see you soon! To start your free trial, the contact form is waiting for you.'], l: ['trial'] },
      fallback: { t: ['Sorry, I didn’t quite get that. I can answer questions about our services, plans, Peppol, the free trial or security.', 'For anything else, write to us: we reply quickly.'], l: ['contact', 'email'], c: DEFAULT_CHIPS }
    },
    nl: {
      welcome: { t: ['Hallo! Ik ben de automatische assistent van PIC Assistance. Stel me een vraag over onze diensten, formules, Peppol of de gratis proefperiode.'], c: DEFAULT_CHIPS },
      greeting: { t: ['Hallo! Hoe kan ik u helpen? Ik beantwoord vragen over onze diensten, formules, Peppol, veiligheid en de gratis proefperiode.'], c: DEFAULT_CHIPS },
      about: { t: ['PIC Assistance is een administratieve assistent op afstand voor zelfstandigen in België: loodgieters, elektriciens, kinesitherapeuten, therapeuten, consultants, vaklui…', 'Een menselijk team, ondersteund door tools en AI: de AI bereidt voor, een mens controleert en valideert. Wij regelen uw administratie, u doet uw vak.'], c: ['services', 'prices', 'trial'] },
      services: { t: ['Afhankelijk van de formule:', '• Essentiel: offertes en facturen (ook via Peppol), herinneringen voor onbetaalde facturen, sorteren van uw bewijsstukken en elke maand doorsturen naar uw boekhouder.', '• Pro: daarbovenop dagelijks beheer van uw mailbox, agenda en afspraken, en opvolging van leveranciers.', '• Premium: daarbovenop gemiste oproepen beantwoord per bericht, opzetten van online reserveringen en automatische herinneringen.'], l: ['pricing'], c: ['compare', 'accountant', 'trial'] },
      essentiel: { t: ['Formule Essentiel: € 190 / maand.', '• Versturen van offertes en facturen (ook via Peppol)', '• Herinneringen voor onbetaalde facturen', '• Sorteren van bewijsstukken en elke maand doorsturen naar de boekhouder', '2 weken gratis proefperiode, zonder verplichting.'], l: ['essentiel', 'pricing'], c: ['pro', 'compare'] },
      pro: { t: ['Formule Pro: € 390 / maand.', '• Alles uit Essentiel', '• Dagelijks beheer van de mailbox', '• Beheer van agenda en afspraken', '• Opvolging van leveranciers', '2 weken gratis proefperiode, zonder verplichting.'], l: ['pro', 'pricing'], c: ['premium', 'compare'] },
      premium: { t: ['Formule Premium: € 690 / maand.', '• Alles uit Pro', '• Gemiste oproepen beantwoord (per bericht)', '• Opzetten van online reserveringen', '• Opzetten van automatische herinneringen', '2 weken gratis proefperiode, zonder verplichting.'], l: ['premium', 'pricing'], c: ['essentiel', 'compare'] },
      compare: { t: ['Ik help u kiezen. Wat kost u vandaag de meeste tijd?'], c: ['pick_essentiel', 'pick_pro', 'pick_premium', 'pick_unsure'] },
      pick_essentiel: { t: ['Dan past de formule Essentiel (€ 190 / maand) bij u: offertes en facturen (ook via Peppol), herinneringen voor onbetaalde facturen en gesorteerde bewijsstukken voor uw boekhouder.'], l: ['essentiel', 'compare'], c: ['pick_pro', 'trial'] },
      pick_pro: { t: ['Dan past de formule Pro (€ 390 / maand) bij u: alles uit Essentiel, plus dagelijks beheer van uw mailbox, agenda, afspraken en opvolging van leveranciers.'], l: ['pro', 'compare'], c: ['pick_premium', 'trial'] },
      pick_premium: { t: ['Dan past de formule Premium (€ 690 / maand) bij u: alles uit Pro, plus gemiste oproepen beantwoord per bericht, online reserveringen en automatische herinneringen.'], l: ['premium', 'compare'], c: ['trial', 'contact'] },
      pick_unsure: { t: ['Vertel ons wat u tijd kost, dan stellen wij de juiste formule voor. De calculator op de startpagina kan u ook op weg helpen.'], l: ['contact', 'calc'], c: ['prices', 'trial'] },
      prices: { t: ['Drie maandformules:', '• Essentiel: € 190 / maand', '• Pro: € 390 / maand', '• Premium: € 690 / maand', 'Btw niet van toepassing (vrijstellingsregeling voor kleine ondernemingen). U begint met 2 weken gratis proefperiode, zonder verplichting.'], l: ['pricing'], c: ['compare', 'essentiel', 'pro', 'premium'] },
      trial: { t: ['U test PIC Assistance 2 weken lang, gratis en zonder verplichting. Neem contact op om te starten: vertel ons wat u tijd kost, dan stellen wij de juiste formule voor.'], l: ['trial'], c: ['process', 'compare'] },
      peppol: { t: ['Peppol is het netwerk voor de uitwisseling van elektronische facturen. Sinds 1 januari 2026 moeten btw-plichtige Belgische ondernemingen hun B2B-facturen elektronisch via Peppol versturen en ontvangen.', 'Wij helpen u het op te zetten en beheren het voor u, vanaf de formule Essentiel.'], l: ['essentiel'], c: ['essentiel', 'accountant'] },
      accountant: { t: ['Nee. PIC Assistance doet geen boekhouding, btw-aangiften of belastingaangiften: in België zijn die taken voorbehouden aan ITAA-gecertificeerde accountants.', 'Wij bereiden uw documenten voor, sorteren ze en sturen ze naar uw eigen boekhouder.'], l: ['faq'], c: ['services', 'peppol'] },
      vat: { t: ['Onze prijzen zijn maandprijzen, btw niet van toepassing (vrijstellingsregeling voor kleine ondernemingen).', 'Uw eigen facturen bereiden wij voor en versturen wij (ook via Peppol) vanaf de formule Essentiel. Uw btw-aangiften blijven het werk van uw ITAA-gecertificeerde boekhouder.'], l: ['pricing'], c: ['accountant', 'peppol'] },
      security: { t: ['U deelt nooit uw wachtwoorden: wij werken in uw accounts via gedelegeerde toegang.', 'Wij werken vertrouwelijk en ondertekenen met elke klant een verwerkersovereenkomst conform de AVG (GDPR).'], l: ['privacy'], c: ['process', 'ai'] },
      ai: { t: ['Uw administratie wordt niet door een AI gedaan: het is een menselijk team, ondersteund door tools en AI. De AI bereidt voor, een mens controleert en valideert.', 'Deze chat is wel een automatische assistent die veelgestelde vragen beantwoordt.'], c: ['security', 'contact'] },
      process: { t: ['Zo werkt het:', '• U neemt contact op en vertelt ons over uw activiteit en wat u tijd kost.', '• U start met 2 weken gratis proefperiode, zonder verplichting.', '• Wij werken via gedelegeerde toegang (nooit een wachtwoord) en er wordt een AVG-overeenkomst ondertekend.', '• Onze tools en AI bereiden voor, een teamlid controleert en valideert. Uw boekhouder ontvangt gesorteerde documenten.'], l: ['trial'], c: ['compare', 'security'] },
      founders: { t: ['PIC Assistance werd opgericht door Maurice Pinnoy, Flavio Immoridino en Alexandre Chartz.', 'De activiteit wordt momenteel uitgeoefend via Pinnoydesign, eenmanszaak van Maurice Pinnoy in Namen (KBO BE 1043.052.381), btw niet van toepassing (vrijstellingsregeling).'], l: ['legal'], c: ['about', 'contact'] },
      languages: { t: ['Wij werken in het Frans, Nederlands en Engels.'], c: ['services', 'contact'] },
      zone: { t: ['Wij werken op afstand, voor zelfstandigen in heel België.'], c: ['process', 'trial'] },
      jobs: { t: ['Voor zelfstandigen in België: loodgieters, elektriciens, kinesitherapeuten, therapeuten, consultants, vaklui… Kost administratie u veel tijd? Laten we praten.'], l: ['contact'], c: ['services', 'compare'] },
      contract: { t: ['De proefperiode van 2 weken is gratis en zonder verplichting. De formules zijn maandelijks; de voorwaarden staan in het contract.', 'Voor een specifieke vraag kunt u ons schrijven.'], l: ['contact', 'email'], c: ['trial', 'prices'] },
      contact: { t: ['Het eenvoudigst: het contactformulier, of een e-mail naar ' + EMAIL + '. Wij antwoorden snel.'], l: ['contact', 'email'], c: ['trial'] },
      legal: { t: ['Onze juridische vermeldingen en ons privacybeleid vindt u hieronder.', 'Deze chat werkt volledig in uw browser: uw berichten worden niet verstuurd of bewaard.'], l: ['legal', 'privacy'], c: ['security'] },
      thanks: { t: ['Graag gedaan! Kan ik u nog ergens mee helpen?'], c: DEFAULT_CHIPS },
      bye: { t: ['Bedankt voor uw bezoek, tot ziens! Om uw gratis proefperiode te starten, staat het contactformulier klaar.'], l: ['trial'] },
      fallback: { t: ['Sorry, dat begreep ik niet goed. Ik beantwoord vragen over onze diensten, formules, Peppol, de gratis proefperiode of veiligheid.', 'Voor andere vragen kunt u ons schrijven: wij antwoorden snel.'], l: ['contact', 'email'], c: DEFAULT_CHIPS }
    }
  };

  /* ---------- Keywords ----------
     Each keyword is a word stem (matches the start of a word) or a phrase.
     "kw^2" = weight 2. Words of <= 3 letters and those in WHOLE match whole words only. */
  var KW = {
    greeting: {
      fr: ['bonjour', 'bjr', 'salut', 'coucou', 'bonsoir', 'hello', 'yo', 'slt', 'bonjou'],
      en: ['hi', 'hey', 'hello', 'hiya', 'good morning', 'good afternoon', 'good evening', 'greetings', 'howdy'],
      nl: ['hallo', 'hoi', 'dag', 'goedemorgen', 'goeiemorgen', 'goedemiddag', 'goedenavond', 'goedendag', 'goeiedag', 'hey']
    },
    about: {
      fr: ['pic assistance^1.5', 'c est quoi', 'qu est ce que', 'qu est ce', 'vous etes quoi', 'assistant administratif^2', 'assistante', 'secretaire', 'secretariat', 'presentation', 'concept'],
      en: ['what is pic^2', 'what is this', 'who is pic', 'what are you', 'virtual assistant', 'admin assistant^2', 'administrative assistant^2', 'secretary', 'about you', 'about pic'],
      nl: ['wat is pic^2', 'wat is dit', 'wat zijn jullie', 'administratieve assistent^2', 'assistent', 'secretaresse', 'secretariaat', 'over jullie']
    },
    services: {
      fr: ['service', 'que faites', 'vous faites quoi', 'faites vous quoi', 'proposez', 'offre', 'prestation', 'tache^0.7', 'aide^0.7', 'quoi exactement', 'vous occupez^0.7', 'gerez^0.7', 'inclus^0.7', 'comprend^0.7'],
      en: ['service', 'what do you do^2', 'what you do', 'offer', 'tasks^0.7', 'included^0.7', 'include^0.7', 'help with^0.7', 'handle^0.7', 'take care^0.7'],
      nl: ['dienst', 'wat doen jullie^2', 'wat doet', 'aanbod', 'bieden', 'taken^0.7', 'inbegrepen^0.7', 'helpen met^0.7', 'regelen^0.7', 'beheren^0.7']
    },
    essentiel: {
      fr: ['essentiel^3', 'essentielle^3', 'factur', 'devis', 'impaye', 'justificatif', 'relance', 'rappel^0.5', 'ticket', 'paiement'],
      en: ['essentiel^3', 'essential^3', 'invoic', 'quote', 'unpaid', 'receipt', 'late payment', 'payment reminder', 'billing'],
      nl: ['essentiel^3', 'factuur', 'facturen', 'factureren', 'offerte', 'onbetaald', 'bewijsstuk', 'bonnetje', 'betalingsherinnering', 'aanmaning']
    },
    pro: {
      fr: ['pro^3', 'formule pro^4', 'boite mail', 'mails', 'courriel', 'agenda', 'rendez vous', 'rdv', 'fournisseur', 'planning', 'emails'],
      en: ['pro^3', 'pro plan^4', 'mailbox', 'inbox', 'emails', 'calendar', 'appointment', 'schedul', 'supplier', 'vendor', 'agenda'],
      nl: ['pro^3', 'formule pro^4', 'mailbox', 'inbox', 'mails', 'agenda', 'afspraak', 'afspraken', 'leverancier', 'planning']
    },
    premium: {
      fr: ['premium^3', 'appels manques^3', 'appel manque^3', 'manque des appels^3', 'rate des appels^3', 'je rate^2', 'appels^1.5', 'manque', 'reservation', 'rappels automatiques^2', 'prise de rendez vous en ligne^2', 'repondeur'],
      en: ['premium^3', 'missed call^3', 'miss calls^3', 'missed', 'online booking^2', 'booking', 'automatic reminder^2', 'call back', 'voicemail'],
      nl: ['premium^3', 'gemiste oproep^3', 'gemiste', 'gemist', 'mis oproepen^3', 'oproep', 'oproepen^1.5', 'mis^1', 'online reserver^2', 'reservering', 'boeking', 'automatische herinnering^2', 'terugbellen']
    },
    compare: {
      fr: ['quelle formule^3', 'laquelle', 'choisir', 'choix', 'difference', 'comparer', 'comparatif', 'compar', 'conseil', 'recommand', 'pour moi^1.5', 'me convient', 'adapte', 'quel abonnement^3', 'hesite'],
      en: ['which plan^3', 'which one', 'which package^3', 'choose', 'choice', 'difference', 'compare', 'comparison', 'recommend', 'advise', 'for me^1.5', 'best for', 'suit', 'right plan^3', 'should i'],
      nl: ['welke formule^3', 'welk pakket^3', 'welke', 'kiezen', 'keuze', 'verschil', 'vergelijk', 'aanraden', 'advies', 'voor mij^1.5', 'past bij', 'geschikt', 'twijfel']
    },
    prices: {
      fr: ['prix^2', 'tarif^2', 'cout', 'coute', 'combien^1.5', 'cher', 'budget', 'par mois', 'euro', 'abonnement', 'formule^0.5', 'formules^0.8', 'payer', 'montant', 'facturez'],
      en: ['price^2', 'pricing^2', 'cost', 'how much^2', 'expensive', 'cheap', 'budget', 'per month', 'monthly', 'euro', 'fee', 'subscription', 'plans^0.8', 'plan^0.5', 'rate', 'pay'],
      nl: ['prijs^2', 'prijzen^2', 'tarief^2', 'tarieven^2', 'kost', 'kosten', 'hoeveel^1.5', 'duur^0.5', 'goedkoop', 'budget', 'per maand', 'euro', 'abonnement', 'formule^0.5', 'formules^0.8', 'betalen', 'pakket^0.5']
    },
    trial: {
      fr: ['essai^2', 'essayer^2', 'gratuit^2', 'tester', 'test', 'periode d essai^3', 'deux semaines^2', '2 semaines^2', 'sans engagement^0.5', 'demo'],
      en: ['trial^2', 'free^2', 'try^2', 'test', 'two weeks^2', '2 weeks^2', 'demo', 'no commitment^0.5'],
      nl: ['proef^2', 'proefperiode^3', 'gratis^2', 'uitproberen^2', 'proberen^2', 'testen', 'twee weken^2', '2 weken^2', 'demo', 'zonder verplichting^0.5']
    },
    peppol: {
      fr: ['peppol^4', 'facturation electronique^3', 'facture electronique^3', 'e facture^3', 'efacture^3', 'obligation^1.5', 'obligatoire^1.5', 'janvier 2026', '2026', 'b2b'],
      en: ['peppol^4', 'e invoic^3', 'einvoic^3', 'electronic invoic^3', 'mandatory^1.5', 'obligation^1.5', 'required by law', '2026', 'b2b'],
      nl: ['peppol^4', 'e factur^3', 'efactur^3', 'elektronische factur^3', 'elektronisch factureren^3', 'verplicht^1.5', 'verplichting^1.5', '2026', 'b2b']
    },
    accountant: {
      fr: ['comptab^2', 'compta^2', 'expert comptable^3', 'declaration^2', 'declaration tva^4', 'fiscal', 'impot', 'bilan', 'itaa^3', 'ne faites pas^3', 'faites pas^2', 'pas faire', 'limite'],
      en: ['accountant^2', 'accounting^2', 'bookkeep^2', 'tax return^3', 'vat return^4', 'tax^1.5', 'itaa^3', 'don t do^3', 'do not do^3', 'not do', 'limits'],
      nl: ['boekhoud^2', 'boekhouder^2', 'boekhouding^2', 'accountant^2', 'aangifte^2', 'btw aangifte^4', 'belasting', 'fiscaal', 'itaa^3', 'niet doen^3', 'doen jullie niet^3', 'grenzen']
    },
    vat: {
      fr: ['tva^1.5', 'htva^2', 'tvac^2', 'hors tva^2', 'tva comprise^2', 'tva incluse^2', 'franchise^2', 'assujetti', 'ttc', 'htva'],
      en: ['vat^1.5', 'excl vat^2', 'incl vat^2', 'including vat^2', 'excluding vat^2', 'exemption^2', 'vat registered'],
      nl: ['btw^1.5', 'excl btw^2', 'incl btw^2', 'inclusief btw^2', 'exclusief btw^2', 'vrijstelling^2', 'btw plichtig']
    },
    security: {
      fr: ['mot de passe^3', 'mots de passe^3', 'mdp^3', 'securite^2', 'securise', 'donnees^2', 'rgpd^3', 'gdpr^3', 'confidentiel^2', 'confidentialite^1.5', 'acces^1.5', 'acces delegue^3', 'fiable', 'confiance', 'protection'],
      en: ['password^3', 'security^2', 'secure', 'safe', 'data^2', 'gdpr^3', 'confidential^2', 'access^1.5', 'delegated access^3', 'trust', 'protect'],
      nl: ['wachtwoord^3', 'veilig^2', 'veiligheid^2', 'gegevens^2', 'avg^3', 'gdpr^3', 'vertrouwelijk^2', 'toegang^1.5', 'gedelegeerde toegang^3', 'vertrouwen', 'bescherm']
    },
    ai: {
      fr: ['ia^2', 'intelligence artificielle^3', 'robot', 'chatgpt', 'automatis', 'humain^1.5', 'vrai personne^2', 'vraie personne^2', 'machine'],
      en: ['ai^2', 'artificial intelligence^3', 'robot', 'chatgpt', 'automat', 'human^1.5', 'real person^2', 'machine', 'bot'],
      nl: ['ai^2', 'ki^2', 'artificiele intelligentie^3', 'kunstmatige intelligentie^3', 'robot', 'chatgpt', 'automatis', 'mens^1.5', 'echte persoon^2', 'machine']
    },
    process: {
      fr: ['comment ca marche^3', 'comment ca fonctionne^3', 'comment ca se passe^3', 'comment ca demarre^3', 'comment commencer^3', 'fonctionnement^2', 'demarrer^2', 'commencer^2', 'etape', 'demarche', 'mise en place^1.5', 'deroulement^2', 'debuter', 'inscri'],
      en: ['how does it work^3', 'how it works^3', 'how do we start^3', 'how do i start^3', 'get started^3', 'getting started^3', 'start^1.5', 'begin^1.5', 'step', 'process^2', 'onboard^2', 'sign up^2', 'set up^0.5'],
      nl: ['hoe werkt^3', 'hoe begin^3', 'hoe start^3', 'hoe begint^3', 'beginnen^2', 'starten^2', 'stappen', 'werkwijze^2', 'verloop', 'opstart', 'inschrijv', 'aanmelden']
    },
    founders: {
      fr: ['fondateur^3', 'fonde^2', 'qui etes vous^3', 'qui etes^2', 'qui est derriere^3', 'derriere^1.5', 'equipe^2', 'patron', 'gerant', 'societe', 'entreprise^0.5', 'pinnoy^3', 'immoridino^3', 'chartz^3', 'maurice^2', 'flavio^2', 'alexandre^2', 'pinnoydesign^3', 'bce^3', 'numero d entreprise^3', 'siege'],
      en: ['founder^3', 'founded^2', 'who are you^3', 'who is behind^3', 'behind^1.5', 'team^2', 'owner', 'company^0.5', 'company number^3', 'business number^3', 'registered'],
      nl: ['oprichter^3', 'opgericht^2', 'wie zijn jullie^3', 'wie zit erachter^3', 'erachter^1.5', 'team^2', 'eigenaar', 'bedrijf^0.5', 'onderneming^0.5', 'kbo^3', 'ondernemingsnummer^3']
    },
    languages: {
      fr: ['langue^3', 'francais^2', 'neerlandais^2', 'flamand^2', 'anglais^2', 'parlez^2', 'parler anglais^3', 'bilingue^2'],
      en: ['language^3', 'french^2', 'dutch^2', 'flemish^2', 'english^2', 'speak^1.5', 'bilingual^2'],
      nl: ['taal^3', 'talen^3', 'frans^2', 'nederlands^2', 'vlaams^2', 'engels^2', 'spreken jullie^2', 'spreekt^1.5', 'tweetalig^2']
    },
    zone: {
      fr: ['zone^3', 'region^2', 'ou etes vous^3', 'vous etes ou^3', 'ou etes^2', 'bruxelles^2', 'wallonie^2', 'flandre^2', 'namur^1.5', 'liege^2', 'charleroi^2', 'mons^2', 'belgique^0.8', 'a distance^2', 'distance^2', 'deplac^2', 'sur place^2', 'localisation', 'adresse^0.8', 'bureau'],
      en: ['area^2', 'region^2', 'where are you^3', 'where^1.5', 'brussels^2', 'wallonia^2', 'flanders^2', 'antwerp^2', 'ghent^2', 'belgium^0.8', 'remote^2', 'remotely^2', 'on site^2', 'travel', 'location', 'office'],
      nl: ['regio^2', 'waar zijn jullie^3', 'waar^1.5', 'brussel^2', 'vlaanderen^2', 'wallonie^2', 'antwerpen^2', 'gent^2', 'leuven^2', 'belgie^0.8', 'op afstand^3', 'afstand^2', 'ter plaatse^2', 'verplaats', 'locatie', 'kantoor']
    },
    jobs: {
      fr: ['metier^2', 'plombier^2', 'electricien^2', 'kine^2', 'therapeute^2', 'consultant^2', 'artisan^2', 'independant^1.5', 'pour qui^3', 'profession^2', 'secteur^2', 'freelance^1.5', 'menuisier^2', 'chauffagiste^2', 'osteo^2', 'coiffeu^2', 'infirmi^2', 'medecin^2'],
      en: ['plumber^2', 'electrician^2', 'physio^2', 'therapist^2', 'consultant^2', 'craftsm^2', 'craftspe^2', 'tradesm^2', 'freelanc^1.5', 'self employed^1.5', 'who is it for^3', 'who for^3', 'profession^2', 'sector^2', 'industry^2', 'my job^1.5'],
      nl: ['beroep^2', 'loodgieter^2', 'elektricien^2', 'kine^2', 'kinesitherapeut^2', 'therapeut^2', 'consultant^2', 'vakman^2', 'vaklui^2', 'ambacht^2', 'zelfstandige^1.5', 'zelfstandigen^1.5', 'freelance^1.5', 'voor wie^3', 'sector^2']
    },
    contract: {
      fr: ['contrat^3', 'engagement^2', 'resili^3', 'annul^2', 'arreter^2', 'arret^1.5', 'preavis^3', 'duree^2', 'mettre fin^3', 'quitter', 'conditions^1.5', 'engage', 'minimum'],
      en: ['contract^3', 'commitment^2', 'cancel^3', 'terminat^3', 'notice period^3', 'notice^2', 'stop^1.5', 'quit', 'duration^2', 'minimum term^3', 'lock in^2', 'terms^1.5'],
      nl: ['contract^3', 'verbintenis^2', 'verplichting^1.5', 'opzeg^3', 'annuleren^2', 'stoppen^2', 'beeindig^3', 'looptijd^3', 'opzegtermijn^3', 'voorwaarden^1.5', 'minimum']
    },
    contact: {
      fr: ['contact^2', 'contacter^2', 'joindre^2', 'ecrire^1.5', 'telephone^2', 'tel^2', 'numero^1.5', 'appeler^2', 'vous appeler^3', 'parler a un humain^4', 'parler a quelqu un^4', 'humain^1', 'conseiller', 'adresse mail^3', 'adresse e mail^3', 'votre mail^3', 'votre email^3', 'mail^0.5', 'email^0.8', 'formulaire^2', 'rappeler^1.5'],
      en: ['contact^2', 'reach^2', 'get in touch^3', 'write to^1.5', 'phone^2', 'call you^3', 'call me^3', 'call^1', 'talk to a human^4', 'speak to someone^4', 'talk to someone^4', 'real person^1.5', 'email address^3', 'your email^3', 'email^0.8', 'form^1.5', 'number^1.5'],
      nl: ['contact^2', 'contacteren^2', 'bereiken^2', 'schrijven^1.5', 'telefoon^2', 'telefoonnummer^2', 'nummer^1.5', 'bellen^2', 'met een mens^4', 'met iemand spreken^4', 'iemand spreken^4', 'mailadres^3', 'e mailadres^3', 'uw mail^2', 'email^0.8', 'mailen^1.5', 'formulier^2']
    },
    legal: {
      fr: ['mentions legales^4', 'mention legale^4', 'legal^2', 'politique de confidentialite^4', 'vie privee^3', 'cookie^3', 'conditions generales^3', 'cgv^3', 'traceur^2'],
      en: ['legal notice^4', 'legal^2', 'privacy policy^4', 'privacy^2', 'cookie^3', 'imprint^3', 'terms and conditions^3', 'tracking^2'],
      nl: ['juridische vermelding^4', 'wettelijke vermelding^4', 'juridisch^2', 'privacybeleid^4', 'privacy^2', 'cookie^3', 'algemene voorwaarden^3', 'tracking^2']
    },
    thanks: {
      fr: ['merci^0.8', 'top^0.8', 'super^0.8', 'parfait^0.8', 'genial^0.8', 'nickel^0.8', 'cool^0.8', 'ok merci^1'],
      en: ['thanks^0.8', 'thank^0.8', 'thx^0.8', 'great^0.8', 'perfect^0.8', 'awesome^0.8', 'cheers^0.8', 'cool^0.8'],
      nl: ['bedankt^0.8', 'dank^0.8', 'dankje^0.8', 'dankjewel^0.8', 'merci^0.8', 'super^0.8', 'top^0.8', 'perfect^0.8', 'prima^0.8', 'tof^0.8']
    },
    bye: {
      fr: ['au revoir^1', 'bye^0.9', 'a bientot^0.9', 'bonne journee^0.9', 'bonne soiree^0.9', 'a plus^0.9', 'ciao^0.9', 'adieu^0.9'],
      en: ['bye^0.9', 'goodbye^1', 'good bye^1', 'see you^0.9', 'have a nice day^0.9', 'later^0.5', 'ciao^0.9'],
      nl: ['tot ziens^1', 'doei^0.9', 'daag^0.9', 'tot straks^0.9', 'fijne dag^0.9', 'nog een fijne dag^1', 'ciao^0.9']
    }
  };

  /* Short or ambiguous words that must match whole words only (no prefix, no fuzzy). */
  var WHOLE = ['hi', 'hey', 'yo', 'top', 'tel', 'pro', 'dag', 'hoi', 'ia', 'ai', 'ki', 'ok', 'mail', 'mails', 'plan', 'plans',
    'free', 'try', 'test', 'cher', 'cout', 'kost', 'duur', 'aide', 'manque', 'mens', 'call', 'tax', 'vat', 'tva', 'btw', 'avg', 'bce', 'kbo',
    'data', 'form', 'reach', 'safe', 'quit', 'stop', 'cool', 'super', 'great', 'later', 'mons', 'gent', 'area', 'where', 'waar',
    'offer', 'rate', 'pay', 'suit', 'step', 'begin', 'start', 'arret', 'tasks', 'notice', 'terms', 'number', 'nummer', 'team',
    'demo', 'fee', 'cheap', 'human', 'humain', 'bot', 'robot', 'tof', 'prima', 'dank', 'thank', 'thanks', 'missed', 'gemist',
    'gemiste', 'oproep', 'oproepen', 'appels', 'quote', 'ticket', 'rappel', 'secure', 'access', 'acces', 'engage', 'minimum', 'conditions', 'travel',
    'bureau', 'office', 'behind', 'erachter', 'derriere', 'fonde', 'speak', 'spreekt', 'tester', 'aangifte',
    'zone', 'region', 'regio', 'taal', 'talen', 'frans', 'engels', 'french', 'dutch', 'english', 'langue', 'welke', 'choix', 'keuze'];

  /* ---------- Matching ---------- */
  function norm(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/œ/g, 'oe').replace(/æ/g, 'ae')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  // Optimal string alignment distance (transpositions count as 1)
  function dist(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) { d[0][j] = j; }
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }

  var WHOLE_SET = {};
  WHOLE.forEach(function (w) { WHOLE_SET[w] = true; });

  // Compile keywords: [{intent, words[], whole, weight, own}]
  var RULES = [];
  Object.keys(KW).forEach(function (intent) {
    Object.keys(KW[intent]).forEach(function (lg) {
      KW[intent][lg].forEach(function (raw) {
        var parts = raw.split('^');
        var text = norm(parts[0]);
        if (!text) return;
        var words = text.split(' ');
        RULES.push({
          intent: intent,
          words: words,
          whole: words.length === 1 && (text.length <= 3 || WHOLE_SET[text] === true),
          weight: parts[1] ? parseFloat(parts[1]) : 1,
          lang: lg
        });
      });
    });
  });

  function wordHit(token, kw, whole) {
    return whole ? token === kw : token.indexOf(kw) === 0;
  }

  function fuzzyHit(token, kw) {
    if (kw.length < 6 || token.length < 5) return false;
    var max = kw.length >= 9 ? 2 : 1;
    if (dist(token, kw, max) <= max) return true;
    // token longer than the stem: compare its start (e.g. "facturtion" vs "factur")
    if (token.length > kw.length && dist(token.slice(0, kw.length), kw, max) <= max) return true;
    return false;
  }

  function score(text, lang) {
    var tokens = norm(text).split(' ').filter(Boolean);
    var scores = {};
    if (!tokens.length) return scores;
    // French "j'ai" / "il y a": "ai" is not "AI" there
    tokens = tokens.filter(function (t, k) { return !(t === 'ai' && (tokens[k - 1] === 'j' || tokens[k - 1] === 'y')); });
    if (!tokens.length) return scores;
    var known = {}; // tokens that match some keyword exactly: never fuzzed
    var seen = {};
    var r, i, j;

    for (r = 0; r < RULES.length; r++) {
      var rule = RULES[r];
      var w = rule.weight * (rule.lang === lang ? 1 : 0.6);
      var n = rule.words.length;
      var hit = 0;
      for (i = 0; i + n <= tokens.length; i++) {
        var ok = true;
        for (j = 0; j < n; j++) {
          var kw = rule.words[j];
          var whole = n === 1 ? rule.whole : (kw.length <= 3 || WHOLE_SET[kw] === true);
          if (!wordHit(tokens[i + j], kw, whole)) { ok = false; break; }
        }
        if (ok) {
          hit = 1;
          for (j = 0; j < n; j++) known[i + j] = true;
          break;
        }
      }
      if (hit) {
        // same keyword listed in several languages counts once (best weight)
        var key = rule.intent + '|' + rule.words.join(' ');
        var val = w * (1 + 0.5 * (n - 1));
        if (!(key in seen) || seen[key] < val) {
          scores[rule.intent] = (scores[rule.intent] || 0) + val - (seen[key] || 0);
          seen[key] = val;
        }
      }
    }

    // Fuzzy pass, single-word keywords only, on unknown tokens
    for (r = 0; r < RULES.length; r++) {
      var fr = RULES[r];
      if (fr.whole || fr.words.length !== 1) continue;
      for (i = 0; i < tokens.length; i++) {
        if (known[i]) continue;
        if (fuzzyHit(tokens[i], fr.words[0])) {
          var fkey = fr.intent + '|~' + fr.words[0];
          var fval = 0.75 * fr.weight * (fr.lang === lang ? 1 : 0.6);
          if (!(fkey in seen) || seen[fkey] < fval) {
            scores[fr.intent] = (scores[fr.intent] || 0) + fval - (seen[fkey] || 0);
            seen[fkey] = fval;
          }
          break;
        }
      }
    }
    return scores;
  }

  var SOCIAL = { greeting: 1, thanks: 1, bye: 1 };

  function match(text) {
    var s = score(text, LANG);
    var best = 'fallback', bestScore = 0;
    var keys = Object.keys(s);
    // Social intents only win if nothing substantive matched
    var hasContent = keys.some(function (k) { return !SOCIAL[k] && s[k] >= 0.6; });
    keys.forEach(function (k) {
      if (hasContent && SOCIAL[k]) return;
      if (s[k] > bestScore) { best = k; bestScore = s[k]; }
    });
    return bestScore >= 0.5 ? best : 'fallback';
  }

  /* ---------- UI ---------- */
  var ui = UI[LANG], answers = A[LANG], chipsText = CHIPS[LANG], links = L[LANG];
  var els = {};
  var started = false;
  var busy = false;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5z" fill="currentColor"/><circle cx="8.5" cy="9.5" r="1.2" fill="var(--pic-chat-dot)"/><circle cx="12" cy="9.5" r="1.2" fill="var(--pic-chat-dot)"/><circle cx="15.5" cy="9.5" r="1.2" fill="var(--pic-chat-dot)"/></svg>';
  var ICON_CLOSE = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
  var ICON_SEND = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12l16-8-6 16-2.5-6.5z" fill="currentColor"/></svg>';

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function scrollLog() { els.log.scrollTop = els.log.scrollHeight; }

  function addUser(text) {
    var m = el('div', 'pic-chat-msg pic-chat-msg-user');
    m.appendChild(el('span', 'pic-chat-visually-hidden', ui.you + ' : '));
    m.appendChild(el('span', null, text));
    els.log.appendChild(m);
    scrollLog();
  }

  function renderAnswer(id) {
    var a = answers[id] || answers.fallback;
    var m = el('div', 'pic-chat-msg pic-chat-msg-bot');
    m.appendChild(el('span', 'pic-chat-visually-hidden', ui.bot + ' : '));
    var list = null;
    a.t.forEach(function (line) {
      if (line.indexOf('• ') === 0) {
        if (!list) { list = el('ul', 'pic-chat-list'); m.appendChild(list); }
        list.appendChild(el('li', null, line.slice(2)));
      } else {
        list = null;
        m.appendChild(el('p', 'pic-chat-p', line));
      }
    });
    if (a.l && a.l.length) {
      var lw = el('div', 'pic-chat-links');
      a.l.forEach(function (k) {
        var def = links[k];
        if (!def) return;
        var link = el('a', 'pic-chat-link', def[0]);
        link.href = def[1].indexOf('mailto:') === 0 ? def[1] : href(def[1]);
        lw.appendChild(link);
      });
      m.appendChild(lw);
    }
    els.log.appendChild(m);
    setChips(a.c || DEFAULT_CHIPS);
    scrollLog();
  }

  function setChips(ids) {
    els.chips.textContent = '';
    ids.forEach(function (id) {
      if (!chipsText[id]) return;
      var b = el('button', 'pic-chat-chip', chipsText[id]);
      b.type = 'button';
      b.setAttribute('data-pic-chat-intent', id);
      els.chips.appendChild(b);
    });
    els.chips.hidden = !els.chips.firstChild;
  }

  function reply(id) {
    busy = true;
    els.chips.hidden = true;
    var typing = el('div', 'pic-chat-typing');
    typing.setAttribute('aria-hidden', 'true');
    typing.appendChild(el('span'));
    typing.appendChild(el('span'));
    typing.appendChild(el('span'));
    els.log.appendChild(typing);
    els.status.textContent = ui.typing;
    scrollLog();
    setTimeout(function () {
      typing.remove();
      els.status.textContent = '';
      renderAnswer(id);
      busy = false;
    }, reduceMotion ? 250 : 550 + Math.random() * 350);
  }

  function ask(text, forcedIntent) {
    text = String(text || '').trim().slice(0, 300);
    if (!text || busy) return;
    addUser(text);
    reply(forcedIntent || match(text));
  }

  function isOpen() { return !els.panel.hidden; }

  function open() {
    teaserDone();
    els.panel.hidden = false;
    els.root.classList.add('pic-chat-is-open');
    els.launcher.setAttribute('aria-expanded', 'true');
    els.launcher.setAttribute('aria-label', ui.close);
    if (!started) { started = true; renderAnswer('welcome'); }
    els.input.focus();
  }

  function close(restoreFocus) {
    els.panel.hidden = true;
    els.root.classList.remove('pic-chat-is-open');
    els.launcher.setAttribute('aria-expanded', 'false');
    els.launcher.setAttribute('aria-label', ui.open);
    if (restoreFocus !== false) els.launcher.focus();
  }

  function build() {
    var root = el('div', 'pic-chat');
    root.id = 'pic-chat';

    var launcher = el('button', 'pic-chat-launcher');
    launcher.type = 'button';
    launcher.setAttribute('aria-label', ui.open);
    launcher.setAttribute('aria-expanded', 'false');
    launcher.setAttribute('aria-controls', 'pic-chat-panel');
    launcher.innerHTML = '<span class="pic-chat-ico-open">' + ICON_CHAT + '</span><span class="pic-chat-ico-close">' + ICON_CLOSE + '</span>';

    var panel = el('div', 'pic-chat-panel');
    panel.id = 'pic-chat-panel';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'pic-chat-title');
    panel.setAttribute('aria-describedby', 'pic-chat-sub');

    var head = el('div', 'pic-chat-head');
    var avatar = el('span', 'pic-chat-avatar', 'PIC');
    avatar.setAttribute('aria-hidden', 'true');
    var titles = el('div', 'pic-chat-titles');
    var title = el('p', 'pic-chat-title', ui.title); title.id = 'pic-chat-title';
    var sub = el('p', 'pic-chat-sub', ui.sub); sub.id = 'pic-chat-sub';
    titles.appendChild(title); titles.appendChild(sub);
    var closeBtn = el('button', 'pic-chat-close');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', ui.close);
    closeBtn.innerHTML = ICON_CLOSE;
    head.appendChild(avatar); head.appendChild(titles); head.appendChild(closeBtn);

    var log = el('div', 'pic-chat-log');
    log.setAttribute('role', 'log');
    log.setAttribute('aria-live', 'polite');
    log.setAttribute('aria-relevant', 'additions');
    log.tabIndex = 0;

    var status = el('p', 'pic-chat-visually-hidden');
    status.setAttribute('aria-live', 'polite');

    var chips = el('div', 'pic-chat-chips');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', ui.suggestions);

    var form = el('form', 'pic-chat-form');
    form.setAttribute('autocomplete', 'off');
    form.noValidate = true;
    var label = el('label', 'pic-chat-visually-hidden', ui.input);
    label.setAttribute('for', 'pic-chat-input');
    var input = el('input', 'pic-chat-input');
    input.id = 'pic-chat-input';
    input.type = 'text';
    input.maxLength = 300;
    input.placeholder = ui.placeholder;
    input.setAttribute('enterkeyhint', 'send');
    var send = el('button', 'pic-chat-send');
    send.type = 'submit';
    send.setAttribute('aria-label', ui.send);
    send.innerHTML = ICON_SEND;
    form.appendChild(label); form.appendChild(input); form.appendChild(send);

    var note = el('p', 'pic-chat-note', ui.note);

    panel.appendChild(head); panel.appendChild(log); panel.appendChild(status);
    panel.appendChild(chips); panel.appendChild(form); panel.appendChild(note);
    root.appendChild(panel); root.appendChild(launcher);
    document.body.appendChild(root);

    els = { root: root, launcher: launcher, panel: panel, log: log, chips: chips, input: input, status: status };

    launcher.addEventListener('click', function () { if (isOpen()) close(); else open(); });
    closeBtn.addEventListener('click', function () { close(); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value;
      if (!v.trim() || busy) return;
      input.value = '';
      ask(v);
    });
    chips.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-pic-chat-intent]');
      if (!b || busy) return;
      ask(b.textContent, b.getAttribute('data-pic-chat-intent'));
      input.focus();
    });
    root.addEventListener('keydown', function (e) {
      if ((e.key === 'Escape' || e.key === 'Esc') && isOpen()) { e.preventDefault(); close(); }
    });
    // Close quietly if the mobile menu opens (the teaser goes away for good)
    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (!document.body.classList.contains('nav-open')) return;
        if (isOpen()) close(false);
        teaserDone();
      }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }
    initTeaser();
  }

  /* ---------- Teaser bubble ----------
     Pops above the launcher ~5 s after load, at most once per browser session
     (sessionStorage; if storage fails, once per page load). Waits while the
     cookie banner (html.pic-cookie-open) or the mobile menu is open. Never
     takes focus. Gone for good once dismissed, or when the chat or menu opens. */
  var TEASER_KEY = 'pic-chat-teaser';
  var TEASER_DELAY = 5000;      // after load
  var TEASER_AFTER_BANNER = 1500; // after the cookie choice, if the delay has passed
  var teaser = null, teaserState = 'idle', teaserTimer = 0;

  function teaserSeen() {
    try { return window.sessionStorage.getItem(TEASER_KEY) === '1'; } catch (e) { return false; }
  }
  function markTeaserSeen() {
    try { window.sessionStorage.setItem(TEASER_KEY, '1'); } catch (e) { /* once per page load */ }
  }
  function teaserBlocked() {
    return document.documentElement.classList.contains('pic-cookie-open') ||
      document.body.classList.contains('nav-open') || isOpen();
  }

  function initTeaser() {
    if (teaserSeen()) { teaserState = 'done'; return; }
    teaserState = 'waiting';
    teaserTimer = setTimeout(function () { teaserState = 'ready'; tryTeaser(); }, TEASER_DELAY);
    // Re-check when the cookie banner closes
    if (window.MutationObserver) {
      new MutationObserver(function () {
        if (document.documentElement.classList.contains('pic-cookie-open')) { hideTeaser(true); return; }
        if (teaserState === 'ready') {
          clearTimeout(teaserTimer);
          teaserTimer = setTimeout(tryTeaser, TEASER_AFTER_BANNER);
        }
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    document.addEventListener('pic-consent-change', function () {
      if (teaserState === 'ready') { clearTimeout(teaserTimer); teaserTimer = setTimeout(tryTeaser, TEASER_AFTER_BANNER); }
    });
  }

  function tryTeaser() {
    if (teaserState !== 'ready' || teaserBlocked()) return;
    showTeaser();
  }

  function showTeaser() {
    teaserState = 'shown';
    markTeaserSeen();
    teaser = el('div', 'pic-chat-teaser');
    var openBtn = el('button', 'pic-chat-teaser-open', ui.teaser);
    openBtn.type = 'button';
    openBtn.setAttribute('aria-controls', 'pic-chat-panel');
    var x = el('button', 'pic-chat-teaser-close');
    x.type = 'button';
    x.setAttribute('aria-label', ui.teaserClose);
    x.innerHTML = ICON_CLOSE;
    teaser.appendChild(openBtn); teaser.appendChild(x);
    openBtn.addEventListener('click', function () { open(); });
    x.addEventListener('click', function () {
      var hadFocus = teaser && teaser.contains(document.activeElement);
      teaserDone();
      if (hadFocus) els.launcher.focus();
    });
    teaser.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); teaserDone(); els.launcher.focus(); }
    });
    // Before the launcher in the DOM: Tab reaches the bubble, then the launcher
    els.root.insertBefore(teaser, els.launcher);
    teaser.getBoundingClientRect(); // commit the start state so the fade runs
    teaser.classList.add('is-visible');
  }

  // Hide the bubble; "temporary" keeps it eligible (only used before it was shown)
  function hideTeaser(temporary) {
    if (!teaser) return;
    var node = teaser;
    teaser = null;
    node.classList.add('is-leaving');
    node.classList.remove('is-visible');
    setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, reduceMotion ? 0 : 200);
    if (!temporary) teaserState = 'done';
  }

  function teaserDone() {
    clearTimeout(teaserTimer);
    if (teaser) hideTeaser(false);
    teaserState = 'done';
  }

  window.picChat = {
    match: match,
    score: function (t) { return score(t, LANG); },
    lang: LANG,
    href: href,
    open: function () { if (els.panel) open(); },
    close: function () { if (els.panel) close(false); }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
