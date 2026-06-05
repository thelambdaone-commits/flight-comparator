---
name: flight-search
description: >
  Recherche des vols sur Google Flights avec anti-détection multi-POS
  (France, Allemagne, Inde, Argentine, Turquie). Utilise Playwright + Patchright
  + proxies gratuits (ProtonVPN, Windscribe, Webshare, X-VPN, VPNBook).
  Trouve le prix le moins cher en comparant les Point of Sale.
license: MIT
compatibility: opencode
metadata:
  sources: google-flights
  anti-detection: patchright, residential-proxies, fingerprints
  multi-pos: true
  free-vpns: protonvpn, windscribe, webshare, xvpn, vpnbook
---

# Flight Search Skill

## Triggers
- "trouve un vol {from} → {to} le {date}"
- "quel est le prix d'un vol {from} → {to} cette semaine"
- "compare les prix {from} → {to} pour le mois prochain"
- "vol pas cher {from} → {to} en juin"
- "cheapest flight {from} → {to}"

## Workflow
1. Charger le profil fingerprint (timezone, viewport, WebGL, langue)
2. Ouvrir Playwright avec Patchright (Chromium patché anti-détection)
3. Lancer sessions parallèles multi-POS (FR, DE, NL, AR, TR)
4. Scraper Google Flights pour chaque POS → comparer les prix
5. Retourner le tableau comparatif avec le meilleur deal

## Anti-Detection Stack
- **Browser**: Playwright + Patchright (Chromium patché C++)
- **Fingerprint**: 15 profils (Windows/Mac, différents GPUs, résolutions)
- **Proxies gratuits**: Webshare (10 residential, 1GB/mo), ProtonVPN (illimité)
- **Fallback payant**: BrightData / Proxyon (si free tiers épuisés)
- **Behavioral**: Mouse Bézier, scroll gamma, pauses distribution humaine

## Example
```
User: trouve un vol Paris Bogota pour cette semaine
Agent: [lance 4 sessions parallèles FR/DE/AR/TR]
       🏆 Turquie: 489€ | France: 550€ | Allemagne: 520€ | Argentine: 510€
       Meilleur deal: 489€ via POS Turquie (Turkish Airlines, 1 escale)
```
