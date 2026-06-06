# City Accessibility Intelligence

A product prototype for the internship assignment: **Improve Neural City Dashboard Using Public Data**.

This project turns public urban data into a simple state comparison dashboard. It helps users understand how accessible a state is through essential services such as hospitals, schools, parks, and bus stops, instead of relying only on street-level observations.

## What this project does

- Compares Indian states on a relative accessibility score.
- Shows ranked states in a table, chart, and India boundary map.
- Uses public OpenStreetMap data through the Overpass API.
- Keeps the dashboard usable even when live data is unavailable by using fallback estimates.
- Shows the scoring logic directly inside the product so the result is easy to trust.

## Why this matters

This prototype is built for a product and policy audience, not just a technical one.

- For citizens: it makes state comparison easier to understand.
- For government teams: it shows where access to everyday services appears stronger or weaker.
- For decision-making: it adds a second layer of evidence beyond observation-based scores.

## Public data used

- **Source:** OpenStreetMap
- **Access method:** Overpass API
- **Coverage:** Hospitals, schools, parks, and bus stops across Indian states

## How the score works

The dashboard does not use raw counts alone. It first converts counts into density per area, then compares each state against all others using percentile ranking.

In simple terms:

1. Count public facilities in each state.
2. Adjust for area so larger states are not automatically favored.
3. Convert each metric into a relative percentile.
4. Combine the percentiles into a final accessibility score.

This makes the ranking more balanced and easier to compare across states of different sizes.

## Key features

- India state map with hover insights
- Ranked comparison table with coverage and benchmark metrics
- Accessibility ranking chart
- Detail view for the selected state
- Methodology section inside the page
- Dark visual theme using a black, slate, and amber palette

## Tech stack

- **Framework:** Next.js 16
- **Language:** TypeScript
- **UI:** Tailwind CSS, shadcn/ui, Lucide icons
- **Charts:** Recharts
- **Map:** @svg-maps/india

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run lint` - run lint checks

## Project structure

- `app/` - application routes and global layout
- `components/dashboard/` - dashboard sections, charts, and map
- `components/ui/` - shared UI building blocks
- `lib/` - data processing and scoring logic
- `data/` - state metadata and supporting reference data
- `types/` - TypeScript types for dashboard records

## Status

This prototype is complete enough for submission as an internship assignment and is focused on clarity, public value, and easy comparison between states.
