import { ChevronDown, Eye } from "lucide-react";
import { ESTADOS } from "../asistencia.constants";

export default function TablaAsistencia({
  aprendices,
  cargando,
  guardando,
  modoManual,
  soloLectura = false,
  onAbrirDetalle,
  onCambiarEstado
}) {
  const mostrarAcciones = !soloLectura && !modoManual;
  const totalColumnas = 4 + (modoManual ? 1 : 0) + (mostrarAcciones ? 1 : 0);

  return (
    <div className="asistencia-table-wrap">
      <table className={`asistencia-table ${modoManual ? "manual-active" : ""}`}>
        <thead>
          <tr>
            <th>Aprendiz</th>
            <th>Hora</th>
            <th>Estado</th>
            <th>Metodo</th>
            {modoManual && <th>Asistencia manual</th>}
            {mostrarAcciones && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={totalColumnas} className="grupos-empty">Cargando aprendices...</td>
            </tr>
          ) : aprendices.length ? (
            aprendices.map((aprendiz) => (
              <tr key={aprendiz.id}>
                <td>{aprendiz.nombre}</td>
                <td>{aprendiz.hora}</td>
                <td>
                  <span className={`asistencia-status ${aprendiz.estado}`}>
                    {ESTADOS[aprendiz.estado]?.label || "Sin estado"}
                  </span>
                </td>
                <td>{aprendiz.metodo}</td>
                {modoManual && (
                  <td>
                    <label className="asistencia-manual-select">
                      <select
                        value={aprendiz.estado}
                        onChange={(e) => onCambiarEstado(aprendiz.id, e.target.value)}
                        disabled={guardando}
                      >
                        <option value="presente">Presente</option>
                        <option value="ausente">Ausente</option>
                        <option value="retardado">Retardo</option>
                        <option value="justificado">Justificado</option>
                      </select>
                      <ChevronDown size={14} />
                    </label>
                  </td>
                )}
                {mostrarAcciones && (
                  <td>
                  <button
                    type="button"
                    className="asistencia-icon-action"
                    aria-label={`Ver asistencia de ${aprendiz.nombre}`}
                    onClick={() => onAbrirDetalle(aprendiz)}
                    disabled={guardando}
                  >
                    <Eye size={15} />
                  </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={totalColumnas} className="grupos-empty">No hay aprendices con esos filtros.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
