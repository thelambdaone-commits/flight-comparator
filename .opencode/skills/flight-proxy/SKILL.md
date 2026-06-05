---
name: flight-proxy
description: >
  Gestion du pool de proxies/VPN gratuits pour l'anti-détection.
  Mélange ProtonVPN, Windscribe, X-VPN, Webshare, VPNBook.
  Rotation automatique, fallback payant si free tiers épuisés.
  Fingerprints cohérents par pays (timezone, langue, WebGL, viewport).
license: MIT
compatibility: opencode
metadata:
  free-tiers: protonvpn, windscribe, webshare, xvpn, vpnbook
  paid-fallback: brightdata, proxyon
  countries: 10
---

# Flight Proxy Skill

## Free VPN/Proxy Pool

| Service | Type | Gratuité | Pays |
|---------|------|----------|------|
| ProtonVPN | VPN | Illimité, permanent | US, NL, JP |
| Windscribe | VPN | 10GB/mois, permanent | DE, HK, 9 autres |
| X-VPN | VPN | Illimité, sans inscription | AR, TR, 24 autres |
| Webshare | Proxy résidentiel | 10 proxies + 1GB/mois | US, FR, DE |
| VPNBook | VPN | Illimité, permanent | CA, UK, US, DE, FR |

## Fallback payant
- BrightData: résidentiel, ~$4/GB
- Proxyon: résidentiel, 100MB free puis $4/GB

## Fingerprint Profiles
- 15 profils différents (Windows/Mac, GPUs variés)
- Chaque profil cohérent avec son pays (langue, timezone, WebGL)
- Rotation à chaque session pour éviter le tracking

## Setup
```bash
# ProtonVPN (free)
sudo apt install protonvpn-cli
protonvpn-cli login
protonvpn-cli connect -cc NL

# Windscribe (free)
windscribe login
windscribe connect DE

# Webshare (free)
# Signup at webshare.io → get proxy list
export WEBSHARE_PROXY_LIST="username:password@geo.webshare.io:80"
```
