# ServoSight

Crowdsourced fuel prices across Australia. Built with Next.js, Leaflet, Shadcn UI, and Tailwind CSS.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/servosight)

Or via CLI:

```bash
npx vercel
```

## Features

- Interactive map with fuel price markers (OpenStreetMap + Leaflet)
- Crowdsourced price reporting — no accounts needed
- Search cheapest fuel near you with geolocation
- Best deals view sorted by savings
- Filter by fuel type: U91, E10, P95, P98, Diesel, Premium Diesel, LPG
- Optional filters for Hydrogen and EV charging stations
- Dark/light mode
- PWA — installable on iOS and Android
- Mobile-first with desktop responsive layout

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4** + **Shadcn UI**
- **react-leaflet** + OpenStreetMap
- **next-themes** for dark mode
- **Vaul** for iOS-style bottom sheets
- Deployable to **Vercel** with zero config

## Australian Fuel Types

| Category  | Types                           |
| --------- | ------------------------------- |
| Standard  | Unleaded 91 (U91), E10         |
| Premium   | Premium 95 (P95), Premium 98 (P98) |
| Diesel    | Diesel, Premium Diesel          |
| Gas       | LPG                            |
| Alt       | Hydrogen, EV Charging (filter) |

## Data

Demo uses in-memory seed data with ~40 stations across Sydney, Melbourne, Brisbane, Perth, Adelaide, Canberra, Gold Coast, Darwin, and Hobart. Prices reset on server restart.

For production, swap `lib/store.ts` with a database adapter (Vercel Postgres, Supabase, etc.).
