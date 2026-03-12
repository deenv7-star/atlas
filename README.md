# ATLAS — Short-Term Rental Management System

A fully standalone, open-source property management application for short-term rentals. No external platform or cloud account required.

---

## Features

- **Dashboard** — KPI overview: bookings, leads, revenue, ratings
- **Bookings** — Full CRUD for reservations
- **Leads** — Sales pipeline management
- **Payments** — Payment tracking and invoicing
- **Cleaning** — Cleaning task schedules
- **Contracts** — Contract templates and instances
- **Messages** — Guest communication log
- **AI Assistant** — Business analytics powered by OpenAI (optional)
- **Invoices** — Invoice generation and management
- **Service Requests** — Guest service requests
- **Automations** — Workflow automation rules
- **Settings** — Organization & property configuration

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Installation

```bash
git clone <repo-url>
cd atlas
npm install
```

### Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and set the values you need (all are optional for basic use):

| Variable | Description |
|---|---|
| `VITE_APP_ID` | Identifier for this deployment (default: `atlas-standalone`) |
| `VITE_APP_BASE_URL` | Public base URL (leave blank for local dev) |
| `VITE_OPENAI_API_KEY` | OpenAI API key — enables the AI Assistant feature |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe key — enables Stripe payment integration |

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

On first visit you will be asked to enter your name and email to create a local profile. All data is stored in your browser's `localStorage`.

---

## Data Storage

In standalone mode all data (bookings, leads, payments, etc.) is persisted in the browser's `localStorage`. This means:

- Data survives page refreshes and browser restarts.
- Data is **per-browser / per-device** — there is no server synchronisation.
- To reset all data, clear `localStorage` in the browser DevTools.

If you need multi-user, server-backed storage you can replace `src/api/client.js` with a REST or GraphQL client that talks to your own backend.

---

## Build for Production

```bash
npm run build
```

The output is in `dist/`. Serve it with any static file host (Netlify, Vercel, GitHub Pages, Nginx, etc.).

### Example: Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Example: Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

---

## Project Structure

```
src/
├── api/
│   ├── client.js          # Standalone localStorage-backed API client
│   └── base44Client.js    # Re-exports client (backward-compatible shim)
├── components/
│   ├── app/               # AppHeader, AppSidebar, BottomTabs
│   ├── common/            # SubscriptionGuard, UpgradeModal, Logo
│   ├── invoices/          # Invoice form & preview components
│   ├── bookings/          # BookingDetails component
│   ├── landing/           # Landing page components
│   └── ui/                # 40+ Radix UI / shadcn components
├── lib/
│   ├── AuthContext.jsx    # localStorage-based authentication context
│   ├── NavigationTracker.jsx
│   ├── query-client.js    # TanStack React Query client
│   └── app-params.js      # Minimal app configuration
├── pages/                 # 26 page components
├── hooks/                 # Custom React hooks
├── utils/                 # URL helpers
├── App.jsx                # Root component with routing
├── Layout.jsx             # Authenticated layout (sidebar + header)
└── pages.config.js        # Page registry
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 18 |
| Build tool | Vite 6 |
| Routing | React Router v6 |
| Data fetching | TanStack React Query v5 |
| Styling | Tailwind CSS v3 |
| Components | Radix UI + shadcn/ui |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| AI (optional) | OpenAI API |

---

## License

MIT
