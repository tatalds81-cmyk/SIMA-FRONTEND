import { ChevronDown, Edit3, Eye } from "lucide-react";
import { ESTADOS } from "../asistencia.constants";

export default function TablaAsistencia({
  aprendices,
  cargando,
  guardando,
  modoManual,
  onAbrirDetalle,
  onAbrirManual,
  onCambiarEstado
}) {
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
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cargando ? (
            <tr>
              <td colSpan={modoManual ? 6 : 5} className="grupos-empty">Cargando aprendices...</td>
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
                <td>
                  <button
                    type="button"
                    className="asistencia-icon-action"
                    aria-label={modoManual ? `Editar asistencia manual de ${aprendiz.nombre}` : `Ver asistencia de ${aprendiz.nombre}`}
                    onClick={() => (modoManual ? onAbrirManual(aprendiz) : onAbrirDetalle(aprendiz))}
                    disabled={guardando}
                  >
                    {modoManual ? <Edit3 size={15} /> : <Eye size={15} />}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={modoManual ? 6 : 5} className="grupos-empty">No hay aprendices con esos filtros.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
