import React from 'react';
import { Card } from 'react-bootstrap';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function RiskEvolutionChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="shadow-sm h-100">
        <Card.Body className="d-flex align-items-center justify-content-center text-muted">
          No hay datos de evolución para mostrar
        </Card.Body>
      </Card>
    );
  }

  // Parsear fechas y asegurar que promedio_diario sea numérico
  const formattedData = data.map(item => ({
    ...item,
    promedio_diario: parseFloat(item.promedio_diario).toFixed(1),
    // Extraer solo DD/MM si es una fecha completa
    fecha_calculo: item.fecha_calculo ? new Date(item.fecha_calculo).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : ''
  }));

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title className="text-secondary mb-4" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          Evolución del Riesgo Institucional (7 días)
        </Card.Title>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={formattedData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="fecha_calculo" tick={{ fontSize: 12, fill: '#6c757d' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6c757d' }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value} Pts`, 'Score Promedio']}
              />
              <Line
                type="monotone"
                dataKey="promedio_diario"
                stroke="#6366f1" // Un color indigo moderno
                strokeWidth={4}
                activeDot={{ r: 8 }}
                dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}
