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
css/style.css                 shared, all languages (design tokens at the top)
fonts/                        Schibsted Grotesk variable woff2 (400–800, Latin subset, 41 KB) + OFL-SchibstedGrotesk.txt
js/main.js                    shared, all languages (I18N object at the top)
chatbot/chatbot.css|js        client-side FAQ bot + teaser bubble (see "Chat launcher, teaser, cookies")
cookies/cookies.css|js        GDPR consent banner + preferences (window.picCookies)
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
- Lowercase-hyphen classes, component-prefixed: `.plan-card`, `.plan-name`, `.faq-item`, `.calc-result`. Layout: `.container`, `.section`, `.section-tight`, `.section-end`, `.grid .grid-2|3|4`. Fields: `.field-stone`, `.field-folder` (whole-section ground). Buttons: `.btn .btn-primary|btn-ghost|btn-ink`, `.btn-lg`, `.btn-block`. Section names: `.section-label` (never above a heading: left margin on desktop, under the heading on mobile).
- States: `.is-visible`, `.is-highlighted`, `.is-scrolled`, `body.nav-open`, `html.js`.
- Scroll animation: add `.reveal` (+ optional `.reveal-d1..d3` delay). Disabled under prefers-reduced-motion.
- JS hooks are `data-*` attributes only (`data-nav-toggle`, `data-nav`, `data-header`, `data-calc*`, `data-plan-picker`, `data-plan`, `data-contact-form`, `data-mail-field`, `data-form-status`, `data-year`). Keep them when translating.
- Colors are CSS custom properties in `:root` (light) and the dark `prefers-color-scheme` block. Do not hard-code colors.
- Never put `backdrop-filter`/`transform`/`filter` on `.site-header` or `.site-nav` (it breaks the fixed mobile menu; the header ground lives on `.site-header::before` and is opaque, no blur).
- z-index contract: chatbot 90 < cookie banner 95 < mobile menu 99 < header 100; `body.nav-open` hides the chat and the cookie banner.

## Design direction ("Paper and bluestone")
Idea: the paperwork a self-employed person hands over (the day's slip of checked tasks, the ledger of services, the Peppol deadline, the monthly folder for the accountant), each line checked by a person, set as printed objects on a paper-and-Belgian-bluestone page. Calm, typographic, no stock imagery, no startup gloss. One live thing: the calculator, whose result is a printed note.
- **Hero:** two fields. Line one of the h1 ("we") stands on paper, line two ("you") on the bluestone field; the seam is the brand promise. The day's slip (`.slip`, aria-hidden) sits on the stone field.
- **Palette tokens** (`:root`, dark values in the `prefers-color-scheme: dark` block): `--paper` ground, `--paper-2` one tone step, `--sheet`, `--ink`, `--ink-soft` (secondary notes only; running text is full ink), `--stone`/`--on-stone`/`--on-stone-soft`/`--stone-2` (bluestone field), `--folder`/`--on-folder`/`--on-folder-soft` (the accountant's folder), `--teal`/`--teal-strong`/`--teal-soft` (brand accent: actions and the "validated" tick only), `--teal-on-dark` (accent on stone), `--print-*` (printed objects stay paper in both schemes). Components only read the role tokens `--bg --surface --text --muted --border --brand --brand-strong --brand-soft --on-brand --focus`; `.field-*`, plan cards and printed objects re-map them. Contrast checked AA in light and dark.
- **Type:** Schibsted Grotesk only (self-hosted, OFL). Five steps: `--step-small` 15px, `--step-body` 17→19, `--step-lead` 20→24, `--step-head` 28→52, `--step-display` 36→88 (h1, prices, figures). Display weight 800, tracking −0.04em, leading ~1. Two oversized figures are deliberate: the Peppol date and the footer name.
- **Space & frame:** 8px scale `--space-1..10`; sections `--section` (72→152px); gutter 16→48px; container 1280px; 12-column grid from 960px, section labels in columns 1–3, headings from column 4.
- **Components:** buttons flat, near-square (`--radius` 4px), 48/56px tall; no shadows at rest (only sticky header, chat, menu); no hairlines except real tables, form fields and the rules of the printed slip/ledger (`data-ui`); no eyebrows, no gradients, no icon cards. Plans are tiles that step up in height and tone (paper-2 → folder → stone).
- **Motion:** minimal and token-based (`--ease-out`, `--ease-in-out`, `--dur-1..4`); `.reveal` is the only scroll effect. Reduced motion keeps colour/opacity changes and drops travel. The motion layer can build on these tokens.
- **Photographs (to supply):** none are used. The founders should provide square portraits of Maurice Pinnoy, Flavio Immoridino and Alexandre Chartz (≥ 600×600, natural light, same background) to replace the monogram tiles in `.avatar`; optionally one or two real working photos (a client's workshop or practice, with written consent) for the services or team section.

## Chat launcher, teaser, cookies
- **Launcher** sits at `bottom: 76px` (70px under 560px), right 16px, to clear the Netlify badge in the bottom-right corner. The desktop panel opens 12px above it (height `min(580px, 100dvh - header - 170px)`); under 560px the panel is full screen below the header.
- **Teaser** (`.pic-chat-teaser`, in chatbot.js): a bubble above the launcher ~5 s after load, at most once per session (`sessionStorage["pic-chat-teaser"]`, falls back to once per page load). Waits while `html.pic-cookie-open` (banner visible) or the menu is open; goes away for good on ×, Escape, chat open or menu open. Never takes focus. Strings `teaser` / `teaserClose` in the chatbot `UI` object.
- **Cookies** (`cookies/`, prefix `pic-cookie`, adapted from Pinnoydesign): banner bottom-left (corner right stays free), z-index 95, no focus steal on first load, focus trap only in the preferences view. Categories: necessary (always on) + `analytics` (placeholder, off by default, no tool installed). Choice in `localStorage["pic-cookie-consent"]` for 6 months with `v: VERSION`; bump `VERSION` (and update texts + privacy pages) when a real analytics tool is added. API: `window.picCookies.has('analytics')`, `.get()`, `.open()`, event `pic-consent-change`, or `<script type="text/plain" data-pic-cookie="analytics" data-src="...">`. Any `[data-pic-cookie-open]` element reopens the preferences: every footer has a `button.pic-cookie-manage` after the privacy link ("Gérer les cookies" / "Manage cookies" / "Cookies beheren"). Include `R + cookies/cookies.css` and `R + cookies/cookies.js` (defer) on new pages. Privacy pages document both storage keys in `#cookies`.

## Adding a page
Copy an existing page at the same depth (keeps header/footer/paths right), change title, description, canonical, hreflang, the `aria-current="page"` nav item and the lang-switch hrefs, add it in fr/en/nl, and add its 3 URLs to sitemap.xml.

## Contact form
`action="https://formspree.io/f/REPLACE_ME"`. While the action contains `REPLACE_ME`, JS opens a prefilled `mailto:contact.picassistance@gmail.com`. Once a Formspree form ID exists, replace `REPLACE_ME` in the 3 contact pages: JS then posts via fetch. `?formule=essentiel|pro|premium` preselects the plan. Keep the hidden `langue` field (set it to en/nl).

## Content rules
Use only the facts already on the FR pages: prices, offers, Peppol, legal limits (no accounting/VAT/tax returns, ITAA), delegated access, GDPR agreement, founders, Pinnoydesign/BCE, email. No phone number. "Nous répondons rapidement" (no hard SLA). Plan names Essentiel/Pro/Premium stay as-is in all languages.

## Remaining work
- **EN + NL translation agent:** create `en/` and `nl/` copies of index.html, pages/tarifs.html and pages/contact.html (+ placeholder mentions-legales.html and confidentialite.html **only if they don't exist yet**; never overwrite them). Fix paths with the rules above and translate everything, including aria-labels, the `<head>` and the skip link.
- **Legal agent:** owns `pages/mentions-legales.html` and `pages/confidentialite.html` in fr/en/nl (replace the "Contenu en cours" placeholder; use the `.prose` container). Facts: Pinnoydesign, sole proprietorship of Maurice Pinnoy, Namur, BCE BE 1043.052.381, TVA non applicable (franchise regime), contact.picassistance@gmail.com, hosting Netlify, form via Formspree (or mailto), no cookies or analytics set by the site; only the two strictly necessary storage keys listed above.
- **Chatbot agent:** owns `chatbot/` (chatbot.css + chatbot.js are already linked on every page, with `defer`). Read the language from `document.documentElement.lang`; use the CSS custom properties from style.css; keep z-index below 99 (mobile menu 99, header 100) or hide the bot when `body.nav-open`; respect prefers-reduced-motion; no external libraries.
