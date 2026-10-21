# Morrow & Bean Café — Website

A complete React + TypeScript multi-page café website designed around the Morrow & Bean Café identity: warm cream, deep espresso, muted sage, terracotta, and soft sand. The project includes six routed pages, a centralized digital menu, online ordering, a contact form, a chat assistant on every page, automated tests, and static-hosting configuration. There is **no backend to host**: the site is static, and orders, contact messages and chat go straight to an n8n workflow.

## Stack

- React 18 + TypeScript
- Vite 6
- React Router 6
- Tailwind CSS plus a custom responsive design system in `src/styles/globals.css`
- Lucide React icons
- Vitest + React Testing Library
- ESLint and TypeScript project checks

## Start locally

Prerequisite: Node.js 22 (or a recent supported Node.js LTS) and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Vite prints the local development URL. `.env.local` is optional until integrations are configured. Never commit `.env.local` or credentials.

## Useful commands

```bash
npm run dev       # local development server
npm run test      # run automated tests once
npm run test:watch
npm run typecheck # TypeScript checks
npm run lint      # ESLint checks
npm run build     # type-check and create dist/
npm run preview   # preview the production build locally
```

## Pages and routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/menu` | Searchable, category-filtered menu |
| `/our-story` | Our Story |
| `/coffee-and-bakes` | Product browser with detail panel |
| `/visit-us` | Visit information and placeholders |
| `/contact` | Validated contact form |

Unknown routes display a small 404 page inside the shared site layout. The shared header, footer, mobile navigation, error boundary, and chat launcher button are defined under `src/components/`.

## Brand editing

### Color palette and typography

The exact brand colors are defined as CSS variables near the top of `src/styles/globals.css` and Tailwind tokens in `tailwind.config.js`:

- Deep Espresso `#2B211C`
- Warm Cream `#F6EFE3`
- Muted Sage `#9BAA91`
- Terracotta `#C8795B`
- Soft Sand `#D8C6AE`

The design uses DM Serif Display for editorial headings and DM Sans for interface and body text. Font files are currently requested from Google Fonts; browsers use fallback fonts if that request is unavailable.

### Menu items and prices

Edit `src/data/menuItems.ts`. It is the single source of truth for menu product names, category, prices, descriptions, images, and alt text. Both the Menu and Coffee & Bakes pages draw from the same list. Prices are represented as integer PKR values and formatted through `formatPrice`. The Morning Pairing information is held in the same file in `morningPairing`.

### Contact and site details

Edit `src/data/siteConfig.ts` to add the confirmed café address, hours, phone number, email address, directions URL, social links, and gallery imagery. Address and hours are intentionally placeholders; do not launch with unconfirmed details. Gallery and menu photographs currently use Unsplash image URLs and can be replaced with optimized brand photography.

## Contact form

The contact form validates name, email, inquiry category, and message length, then sends an `inquiry.created` event to n8n (see below). It **does not claim that a message was sent unless n8n returns a successful HTTP response**. With `VITE_N8N_EVENTS_URL` unset, the form explains that it is not connected.

## n8n automation (the only "backend")

Everything behind the site runs in one n8n workflow: [n8n/Morrow & Bean — Chatbot & Orders.json](n8n/Morrow%20%26%20Bean%20%E2%80%94%20Chatbot%20%26%20Orders.json). Import it into n8n (Workflows → Import from File), connect the Groq, Gmail and Google Sheets credentials, and activate it.

| Site feature | n8n node | Site setting |
|---|---|---|
| “Ask us” chat widget (every page) | **Website Chat** → Café Assistant (Groq) | `VITE_N8N_CHAT_URL` = the node's Chat URL |
| Order page | **Order Events Webhook** → Validate & Re-price → staff email, Google Sheet, customer confirmation, large-order alert | `VITE_N8N_EVENTS_URL` = the node's Production URL |
| Contact form | same webhook → Is Inquiry? → staff email + guest acknowledgement | same `VITE_N8N_EVENTS_URL` |

Both URLs are public by design (the browser calls them), so they are `VITE_` variables; no API key or secret is ever in the site. Both nodes allow `https://morrow-bean.netlify.app` and localhost under *Allowed Origins* — add any new domain there.

### Event contract (browser → n8n)

```json
{ "event": "order.created", "occurredAt": "…", "source": "morrow-bean-website", "data": { "id": "MB-20261021-5E2B8E", "status": "received", "customer": { … }, "fulfillment": "pickup", "items": [ … ], "total": 1440 } }
```

Events: `order.created` and `inquiry.created` (`data`: id `MB-INQ-…`, name, email, category, message). The site validates and prices orders from `shared/menu-catalog.json` before sending, but the browser is not trusted: the **Validate & Re-price** node re-prices every order from the same menu and drops invalid events before any email or sheet row is created. If you change menu prices, update that node's `MENU` too.

The site shows a confirmation only after n8n answers `2xx`; otherwise the guest sees an error. To add more automations later, branch from **Validate & Re-price** (see [docs/n8n-automation-catalogue.md](docs/n8n-automation-catalogue.md) for ideas; its backend sections predate the move to n8n-only).

## Static deployment

### Vercel

1. Push the project to a Git repository.
2. Import it into Vercel.
3. Use `npm run build` as the build command and `dist` as the output directory.
4. Add environment variables in Project Settings if the contact form or n8n integration has been configured.
5. Redeploy after changing build-time `VITE_` variables.

`vercel.json` contains an SPA rewrite to `/index.html` so direct navigation to `/menu` and the other routes works.

### Netlify

1. Connect the repository to Netlify.
2. Use `npm run build` for the build command and `dist` for the publish directory.
3. Add environment variables in Site configuration if needed.
4. Deploy and test direct URL access on each route.

`public/_redirects` contains `/* /index.html 200` and is copied into `dist` by Vite for React Router history fallback.

The live site is <https://morrow-bean.netlify.app>. `netlify.toml` holds the build settings and both public n8n URLs (`VITE_N8N_CHAT_URL`, `VITE_N8N_EVENTS_URL`), so a push to `main` is all a deploy needs; nothing else needs hosting.

## Notes before public launch

- Replace address/hours placeholders and verify phone, email, pricing, offer rules, image rights, and all business details.
- Replace demo gallery and product images with approved brand photography if desired.
- Activate the n8n workflow and test an order, a contact message and a chat from the live site.
- Watch n8n Executions for rejected events; add rate limiting in n8n if the public webhook is abused.
- Review privacy requirements, accessibility, performance, and mobile layouts against the real production content.
