'use client'

export function FlightCard({ flight }: { flight: any }) {
  return (
    <div style={{
      background: '#1e293b',
      borderRadius: 12,
      padding: '1rem',
      border: '1px solid #334155',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>
          {flight.price}€
        </span>
        <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>
          {flight.cabinClass || 'Economy'}
        </span>
      </div>

      <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 4 }}>
        {flight.airline} {flight.flightNumber}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#cbd5e1' }}>
        <span>{flight.departureTime || '--:--'}</span>
        <span style={{ color: '#64748b' }}>→</span>
        <span>{flight.arrivalTime || '--:--'}</span>
        <span style={{ marginLeft: 'auto', color: '#64748b' }}>
          {flight.stops === 0 ? 'Direct' : `${flight.stops} escale${flight.stops > 1 ? 's' : ''}`}
        </span>
      </div>

      {flight.duration && (
        <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>
          Durée: {flight.duration}
        </div>
      )}
    </div>
  )
}
