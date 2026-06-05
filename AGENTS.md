# Flight Comparator — Agent Guide

## Project Overview
Flight Comparator est un scraper de billets d'avion avec anti-détection multi-couche,
comparaison multi-POS (Point of Sale), prédictions ML, et notifications Telegram.

## Architecture
- **Monorepo** via Turborepo, 4 packages : scraper, backend, ml-engine, frontend
- **Scraping**: Playwright + Patchright (Chromium patché anti-détection)
- **Anti-détection**: 15 profils fingerprint, pools VPN gratuits, comportement humain
- **VPN gratuits**: ProtonVPN, Windscribe, X-VPN, Webshare, VPNBook
- **Backend**: Fastify + Prisma + PostgreSQL + Redis (BullMQ)
- **ML**: Python FastAPI + scikit-learn (ExtraTreesRegressor)
- **Frontend**: Next.js 14 (App Router) + Recharts
- **Bot**: Telegram via grammy

## Skills disponibles
- `flight-search` — Recherche de vols multi-POS
- `flight-tracker` — Alertes de prix Telegram
- `flight-ml` — Prédictions ML des prix
- `flight-proxy` — Gestion VPN/proxy pool

## Commands
```bash
# Development
npm install                    # Install all deps
docker compose -f docker/docker-compose.yml up -d  # Start DB + Redis
npm run db:push                # Push Prisma schema to DB
npm run dev                    # Start all packages in dev mode

# Individual packages
npm run dev -w packages/scraper     # Scraper engine
npm run dev -w packages/backend     # API + Telegram bot
npm run dev -w packages/ml-engine   # ML predictions
npm run dev -w packages/frontend    # Next.js dashboard
```

## Environment
Copy `.env.example` to `.env` and fill in:
- `TELEGRAM_BOT_TOKEN` — Get from @BotFather
- `WEBSHARE_API_KEY` — Signup at webshare.io (free, 10 proxies)
- Optional: `BRIGHTDATA_USER`/`BRIGHTDATA_PASS` for paid fallback

## Anti-Detection Architecture
1. Network: Residential proxies (Webshare free) / VPNs (ProtonVPN, Windscribe, X-VPN)
2. TLS: Chromium native via Playwright (pas de HTTP brut)
3. Browser: Patchright + addInitScript (webdriver, plugins, chrome.runtime, permissions)
4. Fingerprint: 15 profiles cohérents (timezone, langue, WebGL, viewport)
5. Behavioral: Mouse Bézier, scroll gamma, pauses gamma distribution

## Multi-POS Price Comparison
Le système compare les prix simultanément depuis :
- 🇫🇷 France (ProtonVPN FR)
- 🇩🇪 Allemagne (Windscribe DE)
- 🇳🇱 Pays-Bas (ProtonVPN NL)
- 🇦🇷 Argentine (X-VPN AR)
- 🇹🇷 Turquie (X-VPN TR)
- 🇺🇸 USA (Webshare US)
