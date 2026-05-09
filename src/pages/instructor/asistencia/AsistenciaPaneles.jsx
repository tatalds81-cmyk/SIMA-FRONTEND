import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eraser,
  Fingerprint,
  PencilLine,
  Save,
  UsersRound,
  XCircle,
} from "lucide-react";

import { formatearHora } from "./asistenciaUtils";

export function AsistenciaEncabezado({
  grupoActual,
  porcentaje,
  presentes,
  total,
}) {
  return (
    <header className="asistencia-hero">
      <div className="asistencia-title-block">
        <span className="asistencia-eyebrow">
          <ClipboardCheck size={17} />
          Control de sesión
        </span>

        <h1>Registro de asistencia</h1>

        <p>
          Ficha {grupoActual.ficha} · {grupoActual.programa}
        </p>
      </div>

      <aside className="asistencia-hero-panel">
        <span>Asistencia actual</span>
        <strong>{porcentaje}%</strong>

        <div className="asistencia-progress">
          <span style={{ width: `${porcentaje}%` }} />
        </div>

        <small>
          {presentes} de {total} aprendices con registro
        </small>
      </aside>
    </header>
  );
}

export function MensajeAsistencia({ mensaje }) {
  if (!mensaje) return null;

  return (
    <div className={`asistencia-feedback ${mensaje.tipo}`}>
      {mensaje.texto}
    </div>
  );
}

export function FiltrosAsistencia({
  cargandoGrupos,
  grupoSeleccionado,
  gruposDisponibles,
  fechaSesion,
  jornada,
  horarioSeleccionado,
  horariosFechaSeleccionada,
  estadoHorario,
  onSeleccionarGrupo,
  onCambiarFecha,
  onCambiarJornada,
  onCambiarHorario,
}) {
  return (
    <section className="asistencia-filtros">
      <label className="campo campo-grupo">
        <span>Grupo</span>

        <select
          disabled={cargandoGrupos}
          value={grupoSeleccionado}
          onChange={(e) => onSeleccionarGrupo(e.target.value)}
        >
          {gruposDisponibles.map((grupo) => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.ficha} - {grupo.programa}
            </option>
          ))}
        </select>
      </label>

      <label className="campo">
        <span>Fecha</span>

        <div className="campo-con-icono">
          <CalendarDays size={17} />

          <input
            type="date"
            value={fechaSesion}
            onChange={(e) => onCambiarFecha(e.target.value)}
          />
        </div>
      </label>

      <label className="campo">
        <span>Jornada</span>

        <select value={jornada} onChange={(e) => onCambiarJornada(e.target.value)}>
          <option>Mañana</option>
          <option>Tarde</option>
          <option>Noche</option>
        </select>
      </label>

      <label className="campo">
        <span>Sesión</span>

        <select
          value={horarioSeleccionado?.id || ""}
          disabled={!horariosFechaSeleccionada.length}
          onChange={(e) => onCambiarHorario(e.target.value)}
        >
          {horariosFechaSeleccionada.length ? (
            horariosFechaSeleccionada.map((horario) => (
              <option key={horario.id} value={horario.id}>
                {horario.nombre} · {formatearHora(horario.inicio)} -{" "}
                {formatearHora(horario.fin)}
              </option>
            ))
          ) : (
            <option value="">
              {estadoHorario.festivo
                ? `Día festivo: ${estadoHorario.festivo.nombre}`
                : "Sin sesión programada"}
            </option>
          )}
        </select>
      </label>
    </section>
  );
}

export function HorarioSesionPanel({
  estadoHorario,
  etiquetaSesion,
  fechaSesion,
  horarioSeleccionado,
  fechaHoraActual,
}) {
  return (
    <section className={`horario-sesion-panel ${estadoHorario.estado}`}>
      <div className="horario-sesion-icono">
        <Clock3 size={22} />
      </div>

      <div className="horario-sesion-info">
        <span>{estadoHorario.titulo}</span>
        <strong>{etiquetaSesion}</strong>

        <p>
          {fechaSesion} · {estadoHorario.detalle}
          {horarioSeleccionado?.ambiente
            ? ` · ${horarioSeleccionado.ambiente}`
            : ""}
        </p>

        {estadoHorario.siguienteTexto && (
          <small>{estadoHorario.siguienteTexto}</small>
        )}
      </div>

      <div className="horario-sesion-meta">
        <span>
          {formatearHora(
            `${fechaHoraActual.getHours()}:${fechaHoraActual.getMinutes()}`
          )}
        </span>

        <strong>{estadoHorario.abierta ? "Activa" : "Bloqueada"}</strong>
      </div>
    </section>
  );
}

export function BiometriaOperacion({
  asistenciaHabilitada,
  proximoAprendizBiometria,
  registrosBiometricos,
  pendientes,
  porcentaje,
  onRegistrarHuella,
  onVerDetalle,
  onVerRegistrados,
  onRegistrarObservacion,
}) {
  return (
    <section className="biometria-operacion">
      <article
        className={`biometria-lector ${
          asistenciaHabilitada ? "listo" : "bloqueado"
        }`}
      >
        <div className="biometria-lector-header">
          <span className="tabla-eyebrow">
            <Fingerprint size={16} />
            Biometría
          </span>

          <strong>
            {asistenciaHabilitada ? "Lector listo" : "Lector bloqueado"}
          </strong>
        </div>

        <button
          type="button"
          className="huella-sensor"
          disabled={!asistenciaHabilitada || !proximoAprendizBiometria}
          onClick={onRegistrarHuella}
        >
          <Fingerprint size={58} />
        </button>

        <div
          className={`biometria-siguiente ${
            proximoAprendizBiometria ? "" : "completo"
          }`}
        >
          {proximoAprendizBiometria ? (
            <>
              <span>Siguiente aprendiz</span>
              <strong>{proximoAprendizBiometria.nombre}</strong>
              <small>{proximoAprendizBiometria.documento}</small>
            </>
          ) : (
            <>
              <CheckCircle2 size={17} />
              <strong>Grupo sin pendientes</strong>
            </>
          )}
        </div>

        <div className="biometria-lector-footer">
          <span>{registrosBiometricos} validaciones</span>
          <strong>{pendientes} pendientes</strong>
        </div>
      </article>

      <article className="biometria-resumen">
        <div className="biometria-card-header">
          <span className="tabla-eyebrow">Novedades</span>
          <strong>{porcentaje}% presente</strong>
        </div>

        <div className={`inasistencia-aviso ${pendientes ? "alerta" : "ok"}`}>
          {pendientes ? (
            <>
              <XCircle size={22} />
              <div>
                <strong>
                  {pendientes} aprendiz{pendientes === 1 ? "" : "ces"} no
                  asistieron
                </strong>

                <span>
                  Registra observación, alerta o soporte de justificación.
                </span>
              </div>
            </>
          ) : (
            <>
              <CheckCircle2 size={22} />

              <div>
                <strong>Sin pendientes</strong>
                <span>Todos los aprendices tienen registro.</span>
              </div>
            </>
          )}
        </div>

        <div className="biometria-resumen-acciones">
          <button
            type="button"
            className="btn-marcar-todos"
            onClick={onVerDetalle}
          >
            <ClipboardCheck size={17} />
            <span>Ver detalle</span>
          </button>

          <button
            type="button"
            className="btn-marcar-todos btn-ver-registrados"
            onClick={onVerRegistrados}
          >
            <UsersRound size={17} />
            <span>Ver registrados</span>
          </button>

          <button
            type="button"
            className="btn-observacion btn-observacion-primaria"
            disabled={!asistenciaHabilitada || !proximoAprendizBiometria}
            onClick={onRegistrarObservacion}
          >
            <PencilLine size={17} />
            <span>Registrar observación</span>
          </button>
        </div>
      </article>
    </section>
  );
}

export function AccionesAsistencia({
  asistenciaHabilitada,
  pendientes,
  presentes,
  total,
  onAsistenciaManual,
  onLimpiar,
  onCerrarPendientes,
  onGuardar,
}) {
  return (
    <section className="asistencia-acciones-compactas">
      <div>
        <span className="tabla-eyebrow">Cierre de asistencia</span>
        <strong>
          {presentes} de {total} aprendices con registro
        </strong>
      </div>

      <div className="asistencia-acciones-compactas-botones">
        <button
          type="button"
          className="btn-observacion btn-observacion-primaria"
          disabled={!asistenciaHabilitada}
          onClick={onAsistenciaManual}
        >
          <PencilLine size={17} />
          <span>Asistencia manual</span>
        </button>

        <button
          type="button"
          className="btn-limpiar"
          disabled={!asistenciaHabilitada}
          onClick={onLimpiar}
        >
          <Eraser size={17} />
          <span>Limpiar</span>
        </button>

        <button
          type="button"
          className="btn-limpiar btn-cerrar-pendientes"
          disabled={!asistenciaHabilitada || !pendientes}
          onClick={onCerrarPendientes}
        >
          <XCircle size={17} />
          <span>Cerrar pendientes</span>
        </button>

        <button
          type="button"
          className="btn-guardar"
          disabled={!asistenciaHabilitada}
          onClick={onGuardar}
        >
          <Save size={17} />
          <span>Guardar asistencia</span>
        </button>
      </div>
    </section>
  );
}
