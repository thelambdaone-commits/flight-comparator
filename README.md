# Flight Comparator ✈️

Scraper de billets d'avion multi-POS avec anti-détection, prédictions ML et bot Telegram.

## Architecture

Monorepo Turborepo — 4 packages :

| Package | Technologie | Rôle |
|---------|------------|------|
| `packages/scraper` | Playwright + Patchright | Scraping Google Flights multi-POS |
| `packages/backend` | Fastify + Prisma + BullMQ | API REST + Bot Telegram |
| `packages/ml-engine` | Python FastAPI + scikit-learn | Prédictions de prix |
| `packages/frontend` | Next.js 14 + Recharts | Dashboard |

## Anti-Détection

- **15 profils fingerprint** (timezone, WebGL, viewport, langue)
- **Pools VPN gratuits** : ProtonVPN, Windscribe, X-VPN, Webshare, VPNBook
- **Comportement humain** : souris Bézier, scroll gamma, pauses gamma
- **TLS** : Chromium natif via Playwright

## Multi-POS

Compare les prix simultanément depuis plusieurs pays :
🇫🇷 France · 🇩🇪 Allemagne · 🇳🇱 Pays-Bas · 🇦🇷 Argentine · 🇹🇷 Turquie · 🇺🇸 USA

## Quick Start

```bash
# 1. Cloner
git clone https://github.com/thelambdaone-commits/flight-comparator.git
cd flight-comparator

# 2. Copier et remplir .env
cp .env.example .env
# → Ajouter TELEGRAM_BOT_TOKEN (via @BotFather)

# 3. Démarrer avec Docker
docker compose -f docker/docker-compose.yml up -d

# 4. Push Prisma schema
npm run db:push

# 5. Lancer en dev
npm install
npm run dev
```

## Variables d'Environnement

| Variable | Requis | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Oui | PostgreSQL |
| `REDIS_URL` | Oui | Redis (BullMQ) |
| `TELEGRAM_BOT_TOKEN` | Oui | Token du bot Telegram |
| `WEBSHARE_API_KEY` | Non | 10 proxies résidentiels gratuits |
| `ML_ENGINE_URL` | Non | URL du microservice ML |

## Commandes

```bash
npm run dev          # Lancer tous les packages en dev
npm run build        # Build tout le projet
npm run db:push      # Push Prisma schema → DB
npm run db:studio    # Ouvrir Prisma Studio
```

## Bot Telegram

Commandes disponibles sur [@xdtb_bot](https://t.me/xdtb_bot) :

| Commande | Description |
|----------|-------------|
| `/start` | Menu principal |
| `/search Paris Bogota` | Chercher les meilleurs prix |
| `/alert Paris Bogota 600` | Alerte si prix < 600€ |
| `/alerts` | Lister ses alertes |
| `/predict Paris Bogota` | Prédiction ML |
| `/deals` | Meilleurs deals du moment |
| `/help` | Aide |

## Tech Stack

- **Runtime**: Node.js 22, Python 3.12
- **Database**: PostgreSQL 16 + Redis 7
- **Scraping**: Playwright, Patchright
- **Backend**: Fastify, Prisma, BullMQ, grammy
- **ML**: FastAPI, scikit-learn, pandas
- **Frontend**: Next.js 14, Recharts
- **Infra**: Docker, Turborepo

## Licence

MIT
