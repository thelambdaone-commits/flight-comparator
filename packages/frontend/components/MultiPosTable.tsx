'use client'

export function MultiPosTable({ results }: { results: any[] }) {
  if (!results || results.length === 0) return null

  const posNames: Record<string, string> = {
    FR: '🇫🇷 France',
    DE: '🇩🇪 Allemagne',
    NL: '🇳🇱 Pays-Bas',
    AR: '🇦🇷 Argentine',
    TR: '🇹🇷 Turquie',
    IN: '🇮🇳 Inde',
    US: '🇺🇸 USA',
    HK: '🇭🇰 Hong Kong',
    CA: '🇨🇦 Canada',
    JP: '🇯🇵 Japon',
  }

  const sorted = [...results].sort((a, b) => {
    const minA = a.flights?.length ? Math.min(...a.flights.map((f: any) => f.price)) : Infinity
    const minB = b.flights?.length ? Math.min(...b.flights.map((f: any) => f.price)) : Infinity
    return minA - minB
  })

  const bestPrice = sorted[0]?.flights?.length ? Math.min(...sorted[0].flights.map((f: any) => f.price)) : 0

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '1rem', border: '1px solid #334155' }}>
      <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>🌍 Comparaison multi-POS</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'left', borderBottom: '1px solid #334155' }}>
            <th style={{ padding: '8px 4px' }}>Pays</th>
            <th style={{ padding: '8px 4px' }}>Prix mini</th>
            <th style={{ padding: '8px 4px' }}>VPN/Proxy</th>
            <th style={{ padding: '8px 4px' }}>Économie</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((r: any) => {
            const minP = r.flights?.length ? Math.min(...r.flights.map((f: any) => f.price)) : null
            const savings = minP && bestPrice ? Math.round((1 - bestPrice / minP) * 100) : 0
            const isBest = minP === bestPrice

            return (
              <tr key={r.pos} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 4px' }}>
                  {posNames[r.pos] || r.pos}
                  {isBest && <span style={{ color: '#22c55e', marginLeft: 4 }}>🏆</span>}
                </td>
                <td style={{ padding: '10px 4px', fontWeight: isBest ? 600 : 400 }}>
                  {minP ? `${minP}€` : '—'}
                </td>
                <td style={{ padding: '10px 4px', fontSize: '0.85rem', color: '#64748b' }}>
                  {getProxyForPOS(r.pos)}
                </td>
                <td style={{ padding: '10px 4px', color: isBest ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>
                  {minP ? (isBest ? 'Meilleur prix' : `+${savings}%`) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function getProxyForPOS(pos: string): string {
  const map: Record<string, string> = {
    FR: 'ProtonVPN FR',
    DE: 'Windscribe DE',
    NL: 'ProtonVPN NL',
    AR: 'X-VPN AR',
    TR: 'X-VPN TR',
    IN: 'VPNBook IN',
    US: 'Webshare US',
    HK: 'Windscribe HK',
    CA: 'VPNBook CA',
    JP: 'ProtonVPN JP',
  }
  return map[pos] || 'Direct'
}
