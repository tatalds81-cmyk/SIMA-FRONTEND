import React, { useState } from 'react';
import { Card, Button, Form, Modal } from 'react-bootstrap';
import { ThumbsUp, ThumbsDown, Brain, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { analyticsService } from '../../services/analyticsService';

export default function RecommendationCard({ recomendacion, onFeedbackSubmit }) {
  const [showModal, setShowModal] = useState(false);
  const [causaRechazo, setCausaRechazo] = useState('');
  const [comentarios, setComentarios] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleThumbsUp = async () => {
    try {
      setIsSubmitting(true);
      await analyticsService.submitFeedback(recomendacion.id_alerta, true);
      toast.success("¡Gracias por tu feedback! Has confirmado el diagnóstico.");
      if (onFeedbackSubmit) onFeedbackSubmit(recomendacion.id_alerta);
    } catch (error) {
      toast.error("Hubo un error enviando el feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleThumbsDownSubmit = async () => {
    try {
      setIsSubmitting(true);
      await analyticsService.submitFeedback(
        recomendacion.id_alerta, 
        false, 
        causaRechazo, 
        comentarios
      );
      toast.success("¡Feedback registrado! Esto ayudará a mejorar la IA.");
      setShowModal(false);
      if (onFeedbackSubmit) onFeedbackSubmit(recomendacion.id_alerta);
    } catch (error) {
      toast.error("Hubo un error enviando el feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card className="mb-3 shadow-sm border-0 border-start border-4 border-warning">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="mb-1 text-dark fw-bold">
                {recomendacion.nombres} {recomendacion.apellidos}
              </h5>
              <p className="text-muted small mb-0">Documento: {recomendacion.numero_documento}</p>
            </div>
            <div className="text-end">
              <span className="badge bg-danger rounded-pill px-3 py-2">
                <AlertTriangle size={14} className="me-1" />
                Score: {recomendacion.score_riesgo_calculado}
              </span>
            </div>
          </div>

          <div className="mt-3 p-3 bg-light rounded-3">
            <h6 className="text-primary mb-2 d-flex align-items-center">
              <Brain size={18} className="me-2" />
              Diagnóstico Predictivo de IA
            </h6>
            <p className="mb-3 small text-secondary">
              {recomendacion.diagnostico_cualitativo_ia}
            </p>
            
            <h6 className="text-success mb-2">Acción Recomendada</h6>
            <p className="mb-0 small fw-medium">
              {recomendacion.recomendacion_accion_ia}
            </p>
          </div>

          <div className="mt-3 d-flex justify-content-end align-items-center gap-2">
            <span className="text-muted small me-2">¿Fue útil este diagnóstico?</span>
            <Button 
              variant="outline-success" 
              size="sm" 
              onClick={handleThumbsUp}
              disabled={isSubmitting}
            >
              <ThumbsUp size={16} />
            </Button>
            <Button 
              variant="outline-danger" 
              size="sm" 
              onClick={() => setShowModal(true)}
              disabled={isSubmitting}
            >
              <ThumbsDown size={16} />
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Modal para captura de Thumbs Down */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detallar Feedback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            Cuéntanos por qué este diagnóstico no fue acertado para ayudar a calibrar el modelo.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Causa Principal</Form.Label>
            <Form.Select 
              value={causaRechazo} 
              onChange={e => setCausaRechazo(e.target.value)}
            >
              <option value="">Seleccione una causa...</option>
              <option value="Falso Positivo">Falso Positivo (El aprendiz no está en riesgo)</option>
              <option value="Diagnostico Impreciso">El diagnóstico no es preciso</option>
              <option value="Recomendacion Irreal">La recomendación no es aplicable</option>
              <option value="Otro">Otro</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Comentarios Adicionales (Opcional)</Form.Label>
            <Form.Control 
              as="textarea" 
              rows={3} 
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleThumbsDownSubmit}
            disabled={!causaRechazo || isSubmitting}
          >
            Enviar Feedback
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
