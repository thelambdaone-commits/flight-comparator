---
name: flight-tracker
description: >
  Tracking de prix de vols avec alertes Telegram. Surveille les routes,
  notifie quand le prix passe sous un seuil. Utilise BullMQ + Redis
  pour le scheduling et grammy pour les notifications Telegram.
license: MIT
compatibility: opencode
metadata:
  notifications: telegram
  scheduling: bullmq, node-cron
  database: postgresql
---

# Flight Tracker Skill

## Triggers
- "surveille le vol {from} → {to} sous {price}€"
- "alerte moi si Paris Bogota passe sous 600€"
- "quelles sont mes alertes actives"
- "stop alerte pour {from} → {to}"

## Workflow
1. Créer une alerte en DB (table Alert: routeId, targetPrice, chatId)
2. Scheduler vérifie le prix toutes les 6h via le scraper multi-POS
3. Si prix < targetPrice → notifier via Telegram bot
4. L'utilisateur peut gérer ses alertes (/alerts, /alert off)

## Telegram Bot Commands
- /search {from} {to} — cherche les meilleurs prix
- /alert {from} {to} {maxPrice} — crée une alerte
- /alerts — liste les alertes actives
- /predict {from} {to} — prédiction ML
- /deals — meilleurs deals du moment
