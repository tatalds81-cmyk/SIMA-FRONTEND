import { useState } from "react";
import "./Observaciones.css";

export default function Observaciones() {
  const [mostrarModal, setMostrarModal] = useState(false);

  return (
    <div className="coordinador-panel obs-page">

      {/* HEADER */}
      <div className="coordinador-card">
        <div className="coordinador-card-header obs-header">
          <div>
            <h2>Consultar observaciones</h2>
            <p>
              Visualiza las observaciones registradas por grupo. No se pueden editar ni eliminar.
            </p>
          </div>

          <button
            className="obs-btn-primary"
            onClick={() => setMostrarModal(true)}
          >
            + Registrar observación
          </button>
        </div>

        {/* FILTROS */}
        <div className="obs-filters">
          <input placeholder="Buscar por aprendiz" />

          <select>
            <option value="">Tipo</option>
            <option>Académica</option>
            <option>Convivencial</option>
          </select>

          <input type="date" />

          <button className="obs-btn-secondary">
            Limpiar
          </button>
        </div>
      </div>

      {/* TABLA */}
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
                <td><span className="badge leve">Leve</span></td>
                <td>2026-05-06</td>
                <td>Franco Reina</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-card">

            <span className="modal-tag">NUEVO REGISTRO</span>
            <h2>Registrar observación</h2>

            <div className="modal-grid">

              <div>
                <label>Aprendiz</label>
                <select>
                  <option>Seleccione</option>
                </select>
              </div>

              <div>
                <label>Tipo</label>
                <select>
                  <option>Académica</option>
                  <option>Convivencial</option>
                </select>
              </div>

              <div>
                <label>Severidad</label>
                <select>
                  <option>Leve</option>
                  <option>Moderada</option>
                  <option>Grave</option>
                </select>
              </div>

            </div>

            <div className="modal-full">
              <label>Descripción</label>
              <textarea placeholder="Describe la observación..." />
            </div>

            <div className="modal-actions">
              <button onClick={() => setMostrarModal(false)}>
                Cancelar
              </button>

              <button className="obs-btn-primary">
                Guardar observación
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}