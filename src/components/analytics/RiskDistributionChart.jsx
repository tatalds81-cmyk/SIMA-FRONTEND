import React from 'react';
import { Card } from 'react-bootstrap';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#10b981']; // Rojo (Alto), Amarillo (Medio), Verde (Bajo)

export default function RiskDistributionChart({ data }) {
  if (!data) return null;

  const chartData = [
    { name: 'Riesgo Alto', value: parseInt(data.altoRiesgo) || 0 },
    { name: 'Riesgo Medio', value: parseInt(data.riesgoMedio) || 0 },
    { name: 'Riesgo Bajo', value: parseInt(data.riesgoBajo) || 0 }
  ];

  // Si todos están en 0, mostramos un mensaje vacío
  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <Card className="shadow-sm h-100">
        <Card.Body className="d-flex align-items-center justify-content-center text-muted">
          No hay datos de distribución para mostrar
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <Card.Title className="text-secondary mb-4" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
          Distribución de Riesgo Actual
        </Card.Title>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                formatter={(value) => [`${value} Aprendices`, 'Cantidad']}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card.Body>
    </Card>
  );
}
