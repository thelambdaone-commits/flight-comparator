'use client'

import { useState, useEffect } from 'react'
import { PriceChart } from '../components/PriceChart'
import { FlightCard } from '../components/FlightCard'
import { MultiPosTable } from '../components/MultiPosTable'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export default function Home() {
  const [origin, setOrigin] = useState('CDG')
  const [destination, setDestination] = useState('TUN')
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchFlights = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/flights/search?origin=${origin}&destination=${destination}`)
      const data = await res.json()
      setResults(data)
    } catch (e) {
      setError('Erreur de connexion au backend')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          ✈️ Flight Comparator
        </h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0' }}>
          Anti-détection multi-POS • VPN gratuits • ML prediction
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value.toUpperCase())}
          placeholder="Départ (CDG)"
          style={inputStyle}
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value.toUpperCase())}
          placeholder="Arrivée (TUN)"
          style={inputStyle}
        />
        <button onClick={searchFlights} disabled={loading} style={buttonStyle}>
          {loading ? '🔍 Recherche...' : '🔍 Chercher'}
        </button>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</div>}

      {results && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem' }}>
              ✈️ Vols {results.route}
              {results.flights && results.flights.length > 0 && (
                <span style={{ color: '#22c55e', marginLeft: 8 }}>
                  — à partir de {Math.min(...results.flights.map((f: any) => f.price))}€
                </span>
              )}
            </h2>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {results.flights?.slice(0, 6).map((flight: any, i: number) => (
                <FlightCard key={i} flight={flight} />
              ))}
              {(!results.flights || results.flights.length === 0) && (
                <p style={{ color: '#94a3b8' }}>Aucun vol trouvé. Le scraper vérifie toutes les 6h.</p>
              )}
            </div>
          </div>

          {results.priceHistory && results.priceHistory.length > 1 && (
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem' }}>📊 Historique des prix</h2>
              <PriceChart data={results.priceHistory} />
            </div>
          )}

          <div style={{ background: '#1e293b', borderRadius: 12, padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', margin: '0 0 1rem' }}>🛡️ Anti-détection active</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {['ProtonVPN', 'Windscribe', 'X-VPN', 'Webshare', 'VPNBook'].map((vpn) => (
                <div key={vpn} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.9rem' }}>
                  <span style={{ color: '#22c55e' }}>✅</span> {vpn}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!results && (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: '#64748b' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✈️</div>
          <p>Entre un aéroport de départ et d&apos;arrivée</p>
          <p style={{ fontSize: '0.9rem' }}>
            Ex: CDG → TUN, ORY → NCE, LHR → JFK
          </p>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #334155',
  background: '#1e293b',
  color: '#e2e8f0',
  fontSize: '1rem',
  minWidth: 120,
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 24px',
  borderRadius: 8,
  border: 'none',
  background: '#3b82f6',
  color: 'white',
  fontSize: '1rem',
  cursor: 'pointer',
  fontWeight: 600,
}
