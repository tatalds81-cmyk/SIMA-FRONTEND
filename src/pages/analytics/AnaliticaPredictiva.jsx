import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { analyticsService } from '../../services/analyticsService';
import RiskEvolutionChart from '../../components/analytics/RiskEvolutionChart';
import RiskDistributionChart from '../../components/analytics/RiskDistributionChart';
import RecommendationCard from '../../components/analytics/RecommendationCard';

export default function AnaliticaPredictiva() {
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsRes, recsRes] = await Promise.all([
        analyticsService.getDashboardStats(),
        analyticsService.getRecommendations()
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (recsRes.success) setRecommendations(recsRes.data.recomendaciones || []);
      
    } catch (err) {
      console.error(err);
      setError('Error al cargar la información analítica. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeedbackSubmit = (id_alerta) => {
    // Al recibir un feedback, podríamos remover la alerta de la lista temporalmente
    // o simplemente mostrar un indicador. En este caso la removemos de la UI.
    setRecommendations(prev => prev.filter(r => r.id_alerta !== id_alerta));
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3 text-muted">Cargando motores de Inteligencia Artificial...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4 px-4 bg-light min-vh-100">
      <div className="mb-4">
        <h2 className="fw-bold text-dark mb-1">Analítica Predictiva e IA</h2>
        <p className="text-secondary">
          Monitorización avanzada de riesgo de deserción propulsado por Google Gemini.
        </p>
      </div>

      {/* Bloque 4: Dashboards Analíticos */}
      <Row className="g-4 mb-4">
        <Col lg={8} md={12}>
          <RiskEvolutionChart data={stats?.evolucionRiesgo} />
        </Col>
        <Col lg={4} md={12}>
          <RiskDistributionChart data={stats?.distribucionRiesgo} />
        </Col>
      </Row>

      {/* Bloque 5: Bandeja de Recomendaciones de IA */}
      <div className="mt-5">
        <h4 className="fw-bold text-dark mb-3 d-flex align-items-center">
          <span className="bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center me-2" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
            {recommendations.length}
          </span>
          Bandeja de Diagnósticos Predictivos (Acción Requerida)
        </h4>
        
        <Row>
          {recommendations.length === 0 ? (
            <Col>
              <Alert variant="success" className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                No hay aprendices en riesgo inminente detectados por la IA en este momento.
              </Alert>
            </Col>
          ) : (
            recommendations.map(rec => (
              <Col lg={6} xl={4} key={rec.id_alerta}>
                <RecommendationCard 
                  recomendacion={rec} 
                  onFeedbackSubmit={handleFeedbackSubmit}
                />
              </Col>
            ))
          )}
        </Row>
      </div>
    </Container>
  );
}
