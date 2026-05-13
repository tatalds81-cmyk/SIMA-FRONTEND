import "../../pages/observador/Observaciones.css";

const TIPOS_OBSERVACION = ["Académica", "Convivencial"];
const SEVERIDADES = ["Leve", "Moderada", "Grave"];

export default function ModalObservacion({
  isOpen,
  aprendiz,
  aprendices = [],
  grupoActual,
  form,
  error,
  tipos = TIPOS_OBSERVACION,
  severidades = SEVERIDADES,
  minLength = 15,
  onChange,
  onClose,
  onSubmit,
  submitLabel = "Guardar observación",
}) {
  if (!isOpen) return null;

  function actualizarCampo(campo, valor) {
    onChange((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  return (
    <div className="modal-overlay">
      <form className="modal-card" onSubmit={onSubmit}>
        <span className="modal-tag">Nuevo registro</span>
        <h2>Registrar observación</h2>

        {aprendiz ? (
          <div className="obs-modal-aprendiz">
            <strong>{aprendiz.nombre}</strong>
            <span>
              {aprendiz.documento}
              {grupoActual?.ficha ? ` · Ficha ${grupoActual.ficha}` : ""}
            </span>
          </div>
        ) : (
          <div className="modal-grid">
            <div>
              <label>Aprendiz</label>
              <select
                value={form.aprendizId || ""}
                onChange={(e) => actualizarCampo("aprendizId", e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {aprendices.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="modal-grid">
          <div>
            <label>Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => actualizarCampo("tipo", e.target.value)}
              required
            >
              {tipos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Severidad</label>
            <select
              value={form.severidad}
              onChange={(e) => actualizarCampo("severidad", e.target.value)}
              required
            >
              {severidades.map((severidad) => (
                <option key={severidad} value={severidad}>
                  {severidad}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-full">
          <label>Descripción</label>
          <textarea
            value={form.descripcion}
            minLength={minLength}
            placeholder="Describe la observación..."
            onChange={(e) => actualizarCampo("descripcion", e.target.value)}
            required
          />
        </div>

        {error && <div className="obs-modal-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>
            Cancelar
          </button>

          <button type="submit" className="obs-btn-primary">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
