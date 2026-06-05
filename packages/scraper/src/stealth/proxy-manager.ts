import { ProxyConfig, POSSession } from '../models.js'
import { randomUUID } from 'crypto'

/**
 * Proxy Manager — Multi-layer proxy/VPN pool
 *
 * Free tier priority:
 *   1. Webshare — 10 residential proxies, 1GB/mo forever
 *   2. ProtonVPN — free VPN, unlimited data, 3 countries
 *   3. Windscribe — 10GB/mo free, 11 countries
 *   4. X-VPN — free, 26 servers, no signup
 *   5. VPNBook — free OpenVPN/WireGuard, US/UK/CA/DE/FR
 *
 * Paid fallback (when free tier exhausted):
 *   - BrightData residential proxies (pay per GB)
 *   - Proxyon (100MB free then $4/GB)
 */

export const FREE_PROXIES: ProxyConfig[] = [
  // === Webshare (free residential proxies) ===
  // Signup: https://www.webshare.io → 10 proxies + 1GB/mo forever
  {
    name: 'webshare-fr',
    type: 'residential',
    url: process.env.WEBSHARE_PROXY_LIST
      ? `http://${process.env.WEBSHARE_PROXY_LIST}`
      : 'http://customer-xxxx:password@geo.webshare.io:80',
    country: 'France',
    countryCode: 'FR',
    isFree: true,
    bandwidthLimit: 1024,
    bandwidthUsed: 0,
  },
  {
    name: 'webshare-de',
    type: 'residential',
    url: 'http://customer-xxxx:password@geo.webshare.io:80',
    country: 'Germany',
    countryCode: 'DE',
    isFree: true,
    bandwidthLimit: 1024,
    bandwidthUsed: 0,
  },
  {
    name: 'webshare-us',
    type: 'residential',
    url: 'http://customer-xxxx:password@geo.webshare.io:80',
    country: 'United States',
    countryCode: 'US',
    isFree: true,
    bandwidthLimit: 1024,
    bandwidthUsed: 0,
  },
  // === ProtonVPN Free (via WireGuard/OpenVPN) ===
  // https://protonvpn.com — free tier: US, NL, JP
  {
    name: 'protonvpn-nl',
    type: 'vpn',
    url: 'http://localhost:1080', // Local SOCKS5 from ProtonVPN CLI
    country: 'Netherlands',
    countryCode: 'NL',
    isFree: true,
    bandwidthLimit: -1, // unlimited
    bandwidthUsed: 0,
  },
  // === Windscribe Free (10GB/mo) ===
  // https://windscribe.com — 11 countries on free plan
  {
    name: 'windscribe-de',
    type: 'vpn',
    url: 'socks5://localhost:1081',
    country: 'Germany',
    countryCode: 'DE',
    isFree: true,
    bandwidthLimit: 10240,
    bandwidthUsed: 0,
  },
  {
    name: 'windscribe-hk',
    type: 'vpn',
    url: 'socks5://localhost:1082',
    country: 'Hong Kong',
    countryCode: 'HK',
    isFree: true,
    bandwidthLimit: 10240,
    bandwidthUsed: 0,
  },
  // === X-VPN Free (26 servers, no signup) ===
  // https://xvpn.io — free tier: 26 locations
  {
    name: 'xvpn-ar',
    type: 'vpn',
    url: 'http://localhost:1083',
    country: 'Argentina',
    countryCode: 'AR',
    isFree: true,
    bandwidthLimit: -1,
    bandwidthUsed: 0,
  },
  {
    name: 'xvpn-tr',
    type: 'vpn',
    url: 'http://localhost:1084',
    country: 'Turkey',
    countryCode: 'TR',
    isFree: true,
    bandwidthLimit: -1,
    bandwidthUsed: 0,
  },
  // === VPNBook Free ===
  // https://vpnbook.com — US, UK, CA, DE, FR — OpenVPN/WireGuard
  {
    name: 'vpnbook-ca',
    type: 'vpn',
    url: 'socks5://localhost:1085',
    country: 'Canada',
    countryCode: 'CA',
    isFree: true,
    bandwidthLimit: -1,
    bandwidthUsed: 0,
  },
]

export const PAID_PROXIES: ProxyConfig[] = [
  {
    name: 'brightdata-fr',
    type: 'residential',
    url: process.env.BRIGHTDATA_USER
      ? `http://${process.env.BRIGHTDATA_USER}:${process.env.BRIGHTDATA_PASS}@zproxy.lum-superproxy.io:22225`
      : '',
    country: 'France',
    countryCode: 'FR',
    isFree: false,
    bandwidthLimit: -1,
    bandwidthUsed: 0,
  },
  {
    name: 'brightdata-in',
    type: 'residential',
    url: process.env.BRIGHTDATA_USER
      ? `http://${process.env.BRIGHTDATA_USER}:${process.env.BRIGHTDATA_PASS}@zproxy.lum-superproxy.io:22225`
      : '',
    country: 'India',
    countryCode: 'IN',
    isFree: false,
    bandwidthLimit: -1,
    bandwidthUsed: 0,
  },
]

export class ProxyManager {
  private freeProxies: ProxyConfig[]
  private paidProxies: ProxyConfig[]
  private usageCount: Map<string, number> = new Map()

  constructor() {
    this.freeProxies = [...FREE_PROXIES]
    this.paidProxies = [...PAID_PROXIES]
  }

  getProxyForPOS(countryCode: string): ProxyConfig | null {
    const proxy = this.freeProxies.find(
      (p) => p.countryCode === countryCode
    ) || this.paidProxies.find(
      (p) => p.countryCode === countryCode
    )
    if (!proxy) return null
    const key = proxy.name
    this.usageCount.set(key, (this.usageCount.get(key) || 0) + 1)
    proxy.bandwidthUsed += 1
    return proxy
  }

  buildPOSSession(country: string, countryCode: string): POSSession {
    const proxy = this.getProxyForPOS(countryCode)
    const fingerprint = getFingerprintForCountry(countryCode)

    return {
      country,
      countryCode,
      currency: COUNTRY_CURRENCY[countryCode] || 'EUR',
      proxyUrl: proxy?.url || '',
      fingerprint,
    }
  }

  getMultiPOSList(): string[] {
    return ['FR', 'DE', 'NL', 'AR', 'TR', 'US']
  }
}

const COUNTRY_CURRENCY: Record<string, string> = {
  FR: 'EUR',
  DE: 'EUR',
  NL: 'EUR',
  AR: 'ARS',
  TR: 'TRY',
  US: 'USD',
  IN: 'INR',
  HK: 'HKD',
  CA: 'CAD',
  JP: 'JPY',
}

interface FingerprintProfileData {
  userAgent: string
  viewport: { width: number; height: number }
  locale: string
  timezoneId: string
  geolocation: { latitude: number; longitude: number }
  webglVendor: string
  webglRenderer: string
  hardwareConcurrency: number
  deviceMemory: number
}

function getFingerprintForCountry(countryCode: string): FingerprintProfileData {
  const profile = FINGERPRINT_PROFILES[countryCode]
  if (profile) return profile
  return FINGERPRINT_PROFILES['US']
}

const FINGERPRINT_PROFILES: Record<string, FingerprintProfileData> = {
  FR: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    geolocation: { latitude: 48.8566, longitude: 2.3522 },
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
  DE: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
    geolocation: { latitude: 52.52, longitude: 13.405 },
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
  NL: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'nl-NL',
    timezoneId: 'Europe/Amsterdam',
    geolocation: { latitude: 52.3676, longitude: 4.9041 },
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
  AR: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    geolocation: { latitude: -34.6037, longitude: -58.3816 },
    webglVendor: 'Google Inc. (AMD)',
    webglRenderer: 'ANGLE (AMD, AMD Radeon(TM) Graphics Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 4,
    deviceMemory: 4,
  },
  TR: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    geolocation: { latitude: 41.0082, longitude: 28.9784 },
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) HD Graphics 520 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 4,
    deviceMemory: 4,
  },
  US: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
    geolocation: { latitude: 40.7128, longitude: -74.006 },
    webglVendor: 'Google Inc. (NVIDIA)',
    webglRenderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 12,
    deviceMemory: 16,
  },
  IN: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    geolocation: { latitude: 28.7041, longitude: 77.1025 },
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 4,
    deviceMemory: 4,
  },
  HK: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-HK',
    timezoneId: 'Asia/Hong_Kong',
    geolocation: { latitude: 22.3193, longitude: 114.1694 },
    webglVendor: 'Apple Inc. (Apple)',
    webglRenderer: 'ANGLE (Apple, Apple M1 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
  CA: {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    geolocation: { latitude: 43.6532, longitude: -79.3832 },
    webglVendor: 'Apple Inc. (Apple)',
    webglRenderer: 'ANGLE (Apple, Apple M2 Pro Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 10,
    deviceMemory: 16,
  },
  JP: {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
    geolocation: { latitude: 35.6762, longitude: 139.6503 },
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0)',
    hardwareConcurrency: 8,
    deviceMemory: 8,
  },
}
