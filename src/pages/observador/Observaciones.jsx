import { useState } from "react";
import ModalObservacion from "../../components/observaciones/ModalObservacion";
import "./Observaciones.css";

const OBSERVACION_INICIAL = {
  aprendizId: "",
  tipo: "Académica",
  severidad: "Leve",
  descripcion: "",
};

const aprendicesDemo = [
  { id: "jose-munoz", nombre: "Jose Muñoz", documento: "1.001.234.567" },
];

export default function Observaciones() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [observacionForm, setObservacionForm] = useState(OBSERVACION_INICIAL);

  function cerrarModal() {
    setMostrarModal(false);
    setObservacionForm(OBSERVACION_INICIAL);
  }

  function guardarObservacion(e) {
    e.preventDefault();
    cerrarModal();
  }

  return (
    <div className="coordinador-panel obs-page">
      <div className="coordinador-card">
        <div className="coordinador-card-header obs-header">
          <div>
            <h2>Consultar observaciones</h2>
            <p>
              Visualiza las observaciones registradas por grupo. No se pueden
              editar ni eliminar.
            </p>
          </div>

          <button
            type="button"
            className="obs-btn-primary"
            onClick={() => setMostrarModal(true)}
          >
            + Registrar observación
          </button>
        </div>

        <div className="obs-filters">
          <input placeholder="Buscar por aprendiz" />

          <select>
            <option value="">Mis fichas</option>
            <option>3064975</option>
            <option>2003490</option>
          </select>

          <select>
            <option value="">Tipo</option>
            <option>Académica</option>
            <option>Convivencial</option>
          </select>

          <input type="date" />

          <button type="button" className="obs-btn-secondary">
            Limpiar
          </button>
        </div>
      </div>

      <div className="coordinador-card">
        <h2>Observaciones registradas</h2>

        <div className="obs-table">
          <table>
            <thead>
              <tr>
                <th>Aprendiz</th>
                <th>Tipo</th>
                <th>Severidad</th>
                <th>Fecha</th>
                <th>Autor</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td>Jose Muñoz</td>
                <td>Académica</td>
                <td>
                  <span className="badge leve">Leve</span>
                </td>
                <td>2026-05-06</td>
                <td>Franco Reina</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ModalObservacion
        isOpen={mostrarModal}
        aprendices={aprendicesDemo}
        form={observacionForm}
        onChange={setObservacionForm}
        onClose={cerrarModal}
        onSubmit={guardarObservacion}
      />
    </div>
  );
}
