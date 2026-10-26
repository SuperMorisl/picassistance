# PIC Assistance: architecture (for the agents)

Static site: plain HTML/CSS/JS, no build, no frameworks, no external fonts or JS libraries. Hosted on Netlify (publish dir = repo root).

## File tree
```
index.html                    FR home (root = FR)
pages/tarifs.html             FR formules, comparatif, FAQ (#formules #comparatif #faq)
pages/contact.html            FR contact form (Formspree, mailto fallback)
pages/mentions-legales.html   FR placeholder: legal agent
pages/confidentialite.html    FR placeholder: legal agent
404.html                      uses ABSOLUTE paths (/css/...), served by Netlify at any depth
en/  nl/                      same filenames: en/index.html, en/pages/tarifs.html, ...
css/style.css                 shared, all languages
js/main.js                    shared, all languages (I18N object at the top)
chatbot/chatbot.css|js        stubs: chatbot agent
favicon.svg  robots.txt  sitemap.xml  netlify.toml
```

## Site URL (no custom domain yet)
`https://picassistance.netlify.app` is used for canonical, hreflang, og:url, robots.txt and sitemap.xml.
To change it later, run once from the repo root:
`grep -rl 'https://picassistance.netlify.app' --include='*.html' --include='*.xml' --include='*.txt' . | xargs sed -i 's#https://picassistance.netlify.app#https://NEWDOMAIN#g'`

## Paths, language switcher, hreflang
- All links are relative. `R` = prefix to the site root: `""` for index.html, `../` for pages/* and en/index.html, `../../` for en/pages/*.
- css/js/favicon/chatbot: `R + css/style.css` etc.
- Language switcher (`ul.lang-switch` in the nav), for a page at FR path `F` (e.g. `pages/tarifs.html`):
  FR = `R + F`, EN = `R + en/F`, NL = `R + nl/F`. Put `aria-current="true"` on the current language.
  Example in en/pages/tarifs.html: FR `../../pages/tarifs.html`, EN `../../en/pages/tarifs.html`, NL `../../nl/pages/tarifs.html`.
- `<head>`: the same 4 `<link rel="alternate" hreflang>` (fr, en, nl, x-default = fr) on all 3 language versions of a page. Canonical = that page's own URL. Home URLs end in `/` (`/`, `/en/`, `/nl/`), not `index.html`.
- Set `<html lang="en|nl">` and `og:locale` (en_GB / nl_BE), and translate title, description and aria-labels.

## i18n in JS
All JS strings are in `I18N` at the top of `js/main.js`, keyed by `<html lang>` (fr/en/nl are already filled). Translators only translate the HTML + that object. Mailto field labels are read from the `<label>`s, so they follow the HTML automatically.

## Class / hook conventions
- Lowercase-hyphen classes, component-prefixed: `.plan-card`, `.plan-name`, `.faq-item`, `.calc-result`. Layout: `.container`, `.section`, `.section-alt`, `.section-tight`, `.grid .grid-2|3|4`, `.card`. Buttons: `.btn .btn-primary|btn-ghost|btn-light`, `.btn-lg`, `.btn-block`.
- States: `.is-visible`, `.is-highlighted`, `.is-scrolled`, `body.nav-open`, `html.js`.
- Scroll animation: add `.reveal` (+ optional `.reveal-d1..d3` delay). Disabled under prefers-reduced-motion.
- JS hooks are `data-*` attributes only (`data-nav-toggle`, `data-nav`, `data-header`, `data-calc*`, `data-plan-picker`, `data-plan`, `data-contact-form`, `data-mail-field`, `data-form-status`, `data-year`). Keep them when translating.
- Colors are CSS custom properties in `:root` (light) and the dark `prefers-color-scheme` block. Do not hard-code colors.
- Never put `backdrop-filter`/`transform`/`filter` on `.site-header` or `.site-nav` (it breaks the fixed mobile menu; the blur lives on `.site-header::before`).

## Adding a page
Copy an existing page at the same depth (keeps header/footer/paths right), change title, description, canonical, hreflang, the `aria-current="page"` nav item and the lang-switch hrefs, add it in fr/en/nl, and add its 3 URLs to sitemap.xml.

## Contact form
`action="https://formspree.io/f/REPLACE_ME"`. While the action contains `REPLACE_ME`, JS opens a prefilled `mailto:contact.picassistance@gmail.com`. Once a Formspree form ID exists, replace `REPLACE_ME` in the 3 contact pages: JS then posts via fetch. `?formule=essentiel|pro|premium` preselects the plan. Keep the hidden `langue` field (set it to en/nl).

## Content rules
Use only the facts already on the FR pages: prices, offers, Peppol, legal limits (no accounting/VAT/tax returns, ITAA), delegated access, GDPR agreement, founders, Pinnoydesign/BCE, email. No phone number. "Nous répondons rapidement" (no hard SLA). Plan names Essentiel/Pro/Premium stay as-is in all languages.

## Remaining work
- **EN + NL translation agent:** create `en/` and `nl/` copies of index.html, pages/tarifs.html and pages/contact.html (+ placeholder mentions-legales.html and confidentialite.html **only if they don't exist yet**; never overwrite them). Fix paths with the rules above and translate everything, including aria-labels, the `<head>` and the skip link.
- **Legal agent:** owns `pages/mentions-legales.html` and `pages/confidentialite.html` in fr/en/nl (replace the "Contenu en cours" placeholder; use the `.prose` container). Facts: Pinnoydesign, sole proprietorship of Maurice Pinnoy, Namur, BCE BE 1043.052.381, TVA non applicable (franchise regime), contact.picassistance@gmail.com, hosting Netlify, form via Formspree (or mailto), no cookies or analytics set by the site (the chatbot agent must say if it adds any).
- **Chatbot agent:** owns `chatbot/` (chatbot.css + chatbot.js are already linked on every page, with `defer`). Read the language from `document.documentElement.lang`; use the CSS custom properties from style.css; keep z-index below 99 (mobile menu 99, header 100) or hide the bot when `body.nav-open`; respect prefers-reduced-motion; no external libraries.
