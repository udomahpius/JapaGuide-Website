# JapaGuide.ng — responsive website starter

A polished, responsive static website built with semantic HTML, Tailwind CSS (CDN), custom CSS and vanilla JavaScript, following the supplied screenshot and the JapaGuide Website Developer Documentation.

## Run locally
1. Unzip this folder.
2. Open `index.html` in a browser, or serve the folder with VS Code Live Server / `python -m http.server 8000`.
3. For the best development experience use a local HTTP server instead of opening the file directly.

## Included
- Responsive homepage, sticky navigation and mobile menu
- Light/dark theme toggle (preference stored in localStorage)
- Destination cards with official immigration links
- Search across starter destinations and topics
- Guide/article cards, jobs and study resources, scam awareness, footer and trust messaging
- Editable relocation budget calculator
- Visa preparation checklist with progress
- Daily currency reference conversion using Frankfurter API v2 (`https://api.frankfurter.dev/v2/rate/{BASE}/{QUOTE}`)
- Newsletter form validation and WhatsApp contact button
- SEO description, accessible labels, focus styles and reduced-motion support

## Real-time / API notes
The currency widget requests the latest available **daily reference rate**, not a live forex/trading quote. Rates may be delayed by provider publication schedules, and not every currency pair (especially NGN) is guaranteed to be available. The widget reports unsupported pairs instead of inventing a rate. Source: https://frankfurter.dev/

Visa rules, fees, job openings, scholarship deadlines and processing times are **not** universally available through a free public API. This starter links to official sources rather than fabricating “live” immigration data. The page is designed so API/CMS-backed content can be added once a provider and data policy are chosen.

## Before production
- Replace the generic WhatsApp link (`https://wa.me/?text=...`) with the business WhatsApp number, digits only, e.g. `https://wa.me/2348012345678?text=...`.
- Connect newsletter to an email provider/backend. The frontend intentionally does not pretend to store or send subscriptions.
- Add a CMS/admin workflow for editable articles, jobs, country data, reviewed dates, source URLs, publishing roles and audit logs.
- Add real privacy, cookie, terms, editorial and affiliate-disclosure pages after legal review; footer items are starter anchors.
- Set up domain, HTTPS, hosting, backups, analytics/consent, Search Console, sitemap, robots.txt, monitoring and server-side form protection.
- Confirm permission/licensing for photography and replace any image that does not fit your final brand.
- Validate all visa, job, study and flight claims against official sources before publication. No visa, job, scholarship or processing outcome is guaranteed.
- Flight booking should remain a partner hand-off until an approved affiliate/API arrangement is in place.

## Main files
- `index.html` — page structure and content
- `styles.css` — responsive styling and dark mode
- `app.js` — theme, search, cost calculator, checklist, currency API and form feedback

Tailwind is loaded from its CDN for easy static deployment. For production, consider compiling Tailwind to a versioned CSS file and self-hosting assets for stronger performance and reliability.


## Live flight fares (requires a Duffel account/token)

The new Flights section uses a small Node/Express backend so the private flight-provider token is never exposed in browser JavaScript. It includes:

- A live route-fare carousel (`GET /api/flights/deals`) that queries the provider; it never substitutes sample prices.
- Place suggestions (`GET /api/places?query=...`) for cities and airports worldwide.
- Flight offers (`POST /api/flights/search`) for one-way or return, 1–9 adults, cabin class and optional airline filtering.
- A responsive search-results UI that shows carrier, times, stops and current offer total.

### Start locally

1. Install Node.js 18+.
2. Open a terminal in `server/` and run `npm install`.
3. Copy `.env.example` to `.env` and set `DUFFEL_ACCESS_TOKEN` to your own token from Duffel. Keep `.env` private and never commit it.
4. Run `npm start`. The API runs on `http://localhost:3000`.
5. Serve the website from the same origin or configure a reverse proxy so `/api` points to the backend. For a quick local test with Live Server, set `FRONTEND_ORIGIN` in `.env` to the Live Server origin (usually `http://127.0.0.1:5500` or `http://localhost:5500`) and update `flightApi` in `app.js` to `http://localhost:3000/api`.
6. Open `index.html` through your local static server, not `file://`.

### Important fare and location notes

- The provider's available airlines/routes depend on your account access, provider agreements and live inventory. No single API guarantees every airline or every country/route.
- The place suggestion API resolves city/airport/country queries to an IATA place. State/region names are not always valid flight origins; users should choose a suggested airport/city within that state/region.
- The deal carousel checks a small set of example international routes, while the search form accepts any location resolved by the provider.
- Airline preference filters offers returned by the provider; it cannot create inventory that the provider did not return.
- Fares are live search results, not guaranteed ticket prices. Before taking payment, implement the provider's offer-retrieval/revalidation and booking/order workflow, terms, baggage display, taxes, support and payment compliance. This package does not collect payments or issue tickets.
- The carousel checks its routes on page load; add scheduled caching/rate limits if needed for production to control provider usage. Do not cache fares beyond provider rules.
