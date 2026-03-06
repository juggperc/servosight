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

### NSW Fuel API (Live Data)

ServoSight integrates with the [NSW Government Fuel API](https://api.nsw.gov.au/Product/Index/22) for live fuel prices across 2,500+ stations in NSW and Tasmania.

To enable live data:

1. Sign up at [api.nsw.gov.au](https://api.nsw.gov.au) and subscribe to the Fuel API (free tier: 2,500 calls/month)
2. Copy `.env.example` to `.env.local` and add your credentials
3. The app automatically fetches and caches the live NSW/TAS bundle (prices + stations) every 60 min
4. Budget: ~750 API calls/month, well under the 2,500 limit

ServoSight is now live-data only for NSW/TAS stations from the government feed, with user-reported price updates layered on top.

For Vercel deployment, add `NSW_FUEL_API_KEY` and `NSW_FUEL_API_SECRET` as environment variables in your project settings.

### Diagnostic Endpoint

`GET /api/status` returns NSW API connection status, cache freshness, and rate limit usage.
