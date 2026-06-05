'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export function PriceChart({ data }: { data: any[] }) {
  const chartData = [...data]
    .reverse()
    .slice(0, 30)
    .map((d: any) => ({
      date: new Date(d.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
      price: d.price,
      pos: d.pointOfSale || 'FR',
    }))

  if (chartData.length === 0) return <p style={{ color: '#64748b' }}>Aucune donnée</p>

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '1rem', border: '1px solid #334155' }}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${v}€`} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [`${value}€`, 'Prix']}
          />
          <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
