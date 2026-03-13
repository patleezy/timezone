# Launch Times — Global Time Zone Converter

A React-based internal tool for coordinating product launches across 21 cities in Americas, EMEA, and APAC regions.

## Features

- **Simultaneous mode** — Set one PT time, see all cities at once
- **Regional mode** — Set local time per region anchor with optional custom date/time overrides for staggered multi-region launches
- **Selectable anchor cities** — Pick which city drives each region's time
- **LA "Your Team" reference** — Always shows what EMEA/APAC times mean for the LA team
- **City selection** — Check/uncheck cities with select all, per-region, and per-city controls
- **Export** — CSV, TXT, PDF, and clipboard copy (all respect city selections)
- **Business hours indicators** — Green/yellow/red dots for daytime, early/evening, and night

## Local Development

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`

## Deploy to Vercel

### Option A: GitHub → Vercel (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the GitHub repo
4. Vercel auto-detects Vite — no config needed
5. Click **Deploy**

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. Vercel auto-detects the Vite framework.

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. This is a static site with zero backend dependencies — no API keys, no server, no environment variables needed.

## Tech Stack

- React 18
- Vite 6
- Zero external UI dependencies (all inline styles)
- Raw PDF generation (no library)
- Clipboard API with execCommand fallback

## Project Structure

```
launch-times/
├── index.html          # Entry HTML with inline favicon
├── vite.config.js      # Vite + React plugin
├── package.json        # Dependencies & scripts
└── src/
    ├── main.jsx        # React DOM mount
    └── App.jsx         # Full application component
```
