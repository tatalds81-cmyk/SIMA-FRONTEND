import {
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Fingerprint,
  History,
  PencilLine,
  QrCode,
  Save,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  XCircle,
} from "lucide-react";

import {
  formatearHora,
  obtenerClaseMetodoRegistro,
  obtenerIniciales,
  obtenerMetodoRegistro,
} from "./asistenciaUtils";

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
  const tieneGrupos = gruposDisponibles.some((grupo) => grupo.id);

  return (
    <section className="asistencia-filtros">
      <label className="campo campo-grupo">
        <span>Grupo</span>

        <select
          disabled={cargandoGrupos || !tieneGrupos}
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
            disabled={!tieneGrupos}
            value={fechaSesion}
            onChange={(e) => onCambiarFecha(e.target.value)}
          />
        </div>
      </label>

      <label className="campo">
        <span>Jornada</span>

        <select
          disabled={!tieneGrupos}
          value={jornada}
          onChange={(e) => onCambiarJornada(e.target.value)}
        >
          <option>Mañana</option>
          <option>Tarde</option>
          <option>Noche</option>
        </select>
      </label>

      <label className="campo">
        <span>Sesión</span>

        <select
          value={horarioSeleccionado?.id || ""}
          disabled={!tieneGrupos || !horariosFechaSeleccionada.length}
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

export function SesionActualPanel({
  sesionActual,
  qrSesion,
  estadoHorario,
  fechaHoraActual,
}) {
  if (!sesionActual) return null;

  const registrosTomados =
    sesionActual.resumen.total - sesionActual.resumen.pendientes;

  return (
    <section className="sesion-actual-panel">
      <div className="sesion-actual-header">
        <span className="tabla-eyebrow">
          <ClipboardCheck size={16} />
          Sesión actual
        </span>

        <span className={`estado-sesion-badge ${sesionActual.estadoTecnico}`}>
          {sesionActual.estado}
        </span>
      </div>

      <strong className="sesion-codigo">{sesionActual.codigo}</strong>

      <div className="sesion-metadata-grid">
        <div className="sesion-meta-item">
          <span>Instructor</span>
          <strong>{sesionActual.instructor}</strong>
        </div>

        <div className="sesion-meta-item">
          <span>Horario</span>
          <strong>{sesionActual.horarioTexto}</strong>
        </div>

        <div className="sesion-meta-item">
          <span>Registros</span>
          <strong>
            {registrosTomados}/{sesionActual.resumen.total}
          </strong>
        </div>

        <div className="sesion-meta-item">
          <span>Hora actual</span>
          <strong>
            {formatearHora(
              `${fechaHoraActual.getHours()}:${fechaHoraActual.getMinutes()}`
            )}
          </strong>
        </div>
      </div>

      <p className="sesion-estado-detalle">
        {estadoHorario.detalle}
        {qrSesion ? ` · QR activo desde ${qrSesion.generadoEn}` : ""}
      </p>

      {estadoHorario.siguienteTexto && (
        <small className="sesion-siguiente">{estadoHorario.siguienteTexto}</small>
      )}
    </section>
  );
}

function RegistroMetodoButton({
  tipo,
  Icono,
  titulo,
  detalle,
  activo = false,
  disabled,
  onClick,
}) {
  return (
    <button
      type="button"
      className={`registro-metodo ${tipo} ${activo ? "activo" : ""}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span>
        <Icono size={42} />
      </span>
      <strong>{titulo}</strong>
      <small>{detalle}</small>
    </button>
  );
}

export function BiometriaOperacion({
  asistenciaHabilitada,
  proximoAprendizBiometria,
  registrosBiometricos,
  registrosQr = 0,
  ajustesManuales = 0,
  aprendicesRegistrados = [],
  pendientes,
  presentes,
  ausentes,
  tarde,
  justificadas,
  total,
  porcentaje,
  qrSesion,
  onRegistrarHuella,
  onGestionarQr,
  onAsistenciaManual,
  onVerDetalle,
  onVerRegistrados,
  onCerrarPendientes,
  onGuardar,
  onRegistrarObservacion,
}) {
  const registrosEnVivo = aprendicesRegistrados.slice(0, 6);

  return (
    <section className="sesion-operacion-panel">
      <article className="asistencia-tiempo-real-card">
        <div className="biometria-card-header">
          <span className="tabla-eyebrow">Asistencia en tiempo real</span>
          <strong>{registrosEnVivo.length ? "En vivo" : "Sin registros"}</strong>
        </div>

        <div className="asistencia-live-list">
          {registrosEnVivo.length ? (
            registrosEnVivo.map((aprendiz) => (
              <div className="asistencia-live-item" key={aprendiz.id}>
                <span className="aprendiz-avatar">
                  {obtenerIniciales(aprendiz.nombre)}
                </span>

                <div>
                  <strong>{aprendiz.nombre}</strong>
                  <small>{aprendiz.documento}</small>
                </div>

                <time>{aprendiz.horaRegistro || "--"}</time>

                <span
                  className={`metodo-chip ${obtenerClaseMetodoRegistro(
                    aprendiz
                  )}`}
                >
                  {obtenerMetodoRegistro(aprendiz)}
                </span>
              </div>
            ))
          ) : (
            <div className="sesion-empty-state sesion-empty-compact">
              <ClipboardCheck size={18} />
              <span>Aún no hay registros.</span>
            </div>
          )}
        </div>

        <button type="button" className="btn-ver-sesion" onClick={onVerRegistrados}>
          Ver todos los registros
        </button>
      </article>

      <article className="registrar-asistencia-card">
        <div className="biometria-card-header registrar-header">
          <span className="tabla-eyebrow">
            <ClipboardCheck size={16} />
            Registrar asistencia
          </span>

          <strong>
            {asistenciaHabilitada ? "Sesión activa" : "Sesión bloqueada"}
          </strong>
        </div>

        <div className="registro-metodos-grid">
          <RegistroMetodoButton
            tipo="huella"
            Icono={Fingerprint}
            titulo="Huella"
            detalle="Iniciar lector"
            disabled={!asistenciaHabilitada || !proximoAprendizBiometria}
            onClick={onRegistrarHuella}
          />

          <RegistroMetodoButton
            tipo="qr"
            Icono={QrCode}
            titulo={qrSesion ? "QR activo" : "QR"}
            detalle={qrSesion ? "Registrar escaneo" : "Generar código"}
            activo={Boolean(qrSesion)}
            disabled={!asistenciaHabilitada}
            onClick={onGestionarQr}
          />

          <RegistroMetodoButton
            tipo="manual"
            Icono={PencilLine}
            titulo="Manual"
            detalle="Registrar asistencia"
            disabled={!asistenciaHabilitada}
            onClick={onAsistenciaManual}
          />
        </div>

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

        <div className="dispositivos-sesion">
          <div>
            <Fingerprint size={18} />
            <span>Lector de huellas</span>
            <strong>{asistenciaHabilitada ? "Conectado" : "Bloqueado"}</strong>
          </div>

          <div>
            <QrCode size={18} />
            <span>QR de sesión</span>
            <strong>
              {qrSesion ? `Activo desde ${qrSesion.generadoEn}` : "Sin código"}
            </strong>
          </div>
        </div>

        <div className="registro-acciones-secundarias">
          <button type="button" className="btn-limpiar" onClick={onVerDetalle}>
            <ClipboardCheck size={16} />
            <span>Detalle</span>
          </button>

          <button
            type="button"
            className="btn-limpiar btn-cerrar-pendientes"
            disabled={!asistenciaHabilitada || !pendientes}
            onClick={onCerrarPendientes}
          >
            <XCircle size={16} />
            <span>Cerrar pendientes</span>
          </button>

          <button
            type="button"
            className="btn-guardar"
            disabled={!asistenciaHabilitada}
            onClick={onGuardar}
          >
            <Save size={16} />
            <span>Guardar</span>
          </button>
        </div>
      </article>

      <article className="resumen-sesion-card">
        <div className="biometria-card-header">
          <span className="tabla-eyebrow">Resumen de la sesión</span>
          <strong>{total} aprendices</strong>
        </div>

        <div
          className="resumen-donut"
          style={{ "--asistencia-valor": `${porcentaje}%` }}
        >
          <div>
            <strong>{porcentaje}%</strong>
            <span>Asistencia</span>
          </div>
        </div>

        <div className="resumen-sesion-stats">
          <div className="presente">
            <UserCheck size={18} />
            <span>Presentes</span>
            <strong>{presentes}</strong>
          </div>

          <div className="ausente">
            <XCircle size={18} />
            <span>Ausentes</span>
            <strong>{ausentes}</strong>
          </div>

          <div className="tarde">
            <Clock3 size={18} />
            <span>Tardanzas</span>
            <strong>{tarde}</strong>
          </div>

          <div className="justificada">
            <ShieldAlert size={18} />
            <span>Justificados</span>
            <strong>{justificadas}</strong>
          </div>
        </div>

        <div className="resumen-metodos">
          <span>Huella {registrosBiometricos}</span>
          <span>QR {registrosQr}</span>
          <span>Manual {ajustesManuales}</span>
        </div>

        <button
          type="button"
          className="btn-observacion btn-observacion-primaria"
          disabled={!asistenciaHabilitada || !proximoAprendizBiometria}
          onClick={onRegistrarObservacion}
        >
          <PencilLine size={17} />
          <span>Observación</span>
        </button>
      </article>
    </section>
  );
}

export function SesionesAsistenciaPanel({
  sesiones,
  metricas,
  alcanceSesiones,
  onVerSesion,
}) {
  const tarjetasMetricas = [
    {
      titulo: "Sesiones",
      valor: metricas.totalSesiones,
      detalle: "Guardadas",
      Icono: History,
    },
    {
      titulo: "Promedio",
      valor: `${metricas.promedio}%`,
      detalle: "Asistencia",
      Icono: TrendingUp,
    },
    {
      titulo: "Huellas",
      valor: metricas.huellas,
      detalle: "Lecturas",
      Icono: Fingerprint,
    },
    {
      titulo: "QR",
      valor: metricas.qr,
      detalle: "Registros",
      Icono: QrCode,
    },
  ];

  return (
    <section className="sesiones-asistencia-grid">
      <article className="sesiones-metricas-panel">
        <div className="biometria-card-header">
          <span className="tabla-eyebrow">Métricas</span>
          <strong>
            {metricas.presentes}/{metricas.totalAprendices}
          </strong>
        </div>

        <div className="sesiones-metricas-grid">
          {tarjetasMetricas.map(({ titulo, valor, detalle, Icono }) => (
            <div className="sesion-metrica-item" key={titulo}>
              <Icono size={18} />

              <div>
                <span>{titulo}</span>
                <strong>{valor}</strong>
                <small>{detalle}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="sesiones-alcance">{alcanceSesiones}</div>
      </article>

      <article className="sesiones-historial-panel">
        <div className="biometria-card-header">
          <span className="tabla-eyebrow">
            <History size={16} />
            Historial de sesiones
          </span>

          <strong>{sesiones.length}</strong>
        </div>

        {sesiones.length ? (
          <div className="sesiones-tabla-wrapper">
            <table className="sesiones-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Instructor</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Asistencia</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {sesiones.map((sesion) => (
                  <tr key={sesion.id}>
                    <td>
                      <strong>{sesion.fecha}</strong>
                      <small>Ficha {sesion.ficha}</small>
                    </td>
                    <td>{sesion.instructor}</td>
                    <td>{sesion.horarioTexto}</td>
                    <td>
                      <span
                        className={`estado-sesion-badge ${sesion.estadoTecnico}`}
                      >
                        {sesion.estado}
                      </span>
                    </td>
                    <td>
                      {sesion.resumen?.presentes || 0}/
                      {sesion.resumen?.total || 0} ·{" "}
                      {sesion.resumen?.porcentaje || 0}%
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-ver-sesion"
                        onClick={() => onVerSesion(sesion)}
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sesion-empty-state">
            <ClipboardCheck size={20} />
            <span>No hay sesiones guardadas para este alcance.</span>
          </div>
        )}
      </article>
    </section>
  );
}
