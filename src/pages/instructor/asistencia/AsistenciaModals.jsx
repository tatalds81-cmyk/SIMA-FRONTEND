import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Fingerprint,
  PencilLine,
  Save,
  ShieldAlert,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";

import {
  alertaFormInicial,
  severidades,
  tiposAlertaManual,
  tiposObservacion,
  obtenerTextoTipoAlerta,
  obtenerValorTipoAlerta,
} from "./asistenciaForms";

import {
  obtenerClaseEstado,
  obtenerClaseMetodoRegistro,
  obtenerIniciales,
  obtenerMetodoRegistro,
} from "./asistenciaUtils";

const estadosManuales = [
  { valor: "Asistió", clase: "asistio", Icono: CheckCircle2 },
  { valor: "Ausente", clase: "ausente", Icono: XCircle },
  { valor: "Tarde", clase: "tarde", Icono: Clock3 },
  { valor: "Justificada", clase: "justificada", Icono: ShieldAlert },
];

export function ModalDetalleAsistencia({
  visible,
  fechaSesion,
  grupoActual,
  etiquetaSesion,
  aprendices,
  total,
  registrosBiometricos,
  presentes,
  porcentaje,
  tarde,
  ajustesManuales,
  ausentes,
  justificadas,
  pendientes,
  alertaEnviando,
  onClose,
  onAbrirObservacion,
  onAbrirAlerta,
}) {
  if (!visible) return null;

  const resumen = [
    {
      titulo: "Total aprendices",
      valor: total,
      detalle: "Matriculados activos",
      tono: "neutro",
      Icono: UsersRound,
    },
    {
      titulo: "Huellas registradas",
      valor: registrosBiometricos,
      detalle: "Validaciones del lector",
      tono: "verde",
      Icono: Fingerprint,
    },
    {
      titulo: "Presentes",
      valor: presentes,
      detalle: `${porcentaje}% del grupo`,
      tono: "verde",
      Icono: UserCheck,
    },
    {
      titulo: "Tardes",
      valor: tarde,
      detalle: "Tolerancia 10 min",
      tono: "naranja",
      Icono: Clock3,
    },
    {
      titulo: "Ajustes manuales",
      valor: ajustesManuales,
      detalle: `${ausentes} ausentes · ${justificadas} justificadas`,
      tono: "azul",
      Icono: ShieldAlert,
    },
    {
      titulo: "Pendientes",
      valor: pendientes,
      detalle: "Sin marcar",
      tono: "gris",
      Icono: ClipboardCheck,
    },
  ];

  return (
    <div className="asistencia-modal-backdrop">
      <section className="asistencia-modal asistencia-modal-detalle">
        <div className="asistencia-modal-header">
          <div>
            <span className="tabla-eyebrow">Detalle</span>
            <h2>Estado de asistencia</h2>
            <p>
              {fechaSesion} · Ficha {grupoActual.ficha} · {etiquetaSesion}
            </p>
          </div>

          <button type="button" className="modal-cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-detalle-body">
          <div className="modal-detalle-resumen">
            {resumen.map(({ titulo, valor, detalle, tono, Icono }) => (
              <article className={`modal-resumen-item ${tono}`} key={titulo}>
                <Icono size={18} />

                <div>
                  <span>{titulo}</span>
                  <strong>{valor}</strong>
                  <small>{detalle}</small>
                </div>
              </article>
            ))}
          </div>

          <div className="modal-listado modal-listado-detalle">
            <div className="modal-seccion-titulo">
              <strong>Detalle de aprendices</strong>
              <span>{aprendices.length}</span>
            </div>

            {aprendices.map((aprendiz) => (
              <article
                className="modal-aprendiz-item modal-aprendiz-detalle"
                key={aprendiz.id}
              >
                <div className="aprendiz-cell">
                  <span className="aprendiz-avatar">
                    {obtenerIniciales(aprendiz.nombre)}
                  </span>

                  <div>
                    <strong>{aprendiz.nombre}</strong>
                    <small>{aprendiz.documento}</small>
                  </div>
                </div>

                <div className="registro-biometrico-cell">
                  <span
                    className={`estado-chip ${obtenerClaseEstado(
                      aprendiz.estado
                    )}`}
                  >
                    {aprendiz.estado || "Sin marcar"}
                  </span>

                  <span
                    className={`metodo-chip ${obtenerClaseMetodoRegistro(
                      aprendiz
                    )}`}
                  >
                    {obtenerMetodoRegistro(aprendiz)}
                  </span>
                </div>

                <div className="modal-novedad-acciones">
                  <button
                    type="button"
                    className="btn-observacion"
                    onClick={() => onAbrirObservacion(aprendiz)}
                  >
                    <PencilLine size={15} />
                    <span>Observación</span>
                  </button>

                  <button
                    type="button"
                    className="btn-alerta-manual"
                    disabled={
                      alertaEnviando === (aprendiz.id_aprendiz || aprendiz.id)
                    }
                    onClick={() => onAbrirAlerta(aprendiz)}
                  >
                    <AlertTriangle size={15} />
                    <span>Alerta</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ModalAsistenciaManual({
  visible,
  fechaSesion,
  grupoActual,
  etiquetaSesion,
  aprendices,
  asistenciaHabilitada,
  alertaEnviando,
  onClose,
  onCambiarEstadoManual,
  onAbrirObservacion,
  onAbrirAlerta,
}) {
  if (!visible) return null;

  return (
    <div className="asistencia-modal-backdrop">
      <section className="asistencia-modal asistencia-modal-detalle asistencia-modal-manual">
        <div className="asistencia-modal-header">
          <div>
            <span className="tabla-eyebrow">Marcación manual</span>
            <h2>Asistencia manual</h2>
            <p>
              {fechaSesion} · Ficha {grupoActual.ficha} · {etiquetaSesion}
            </p>
          </div>

          <button type="button" className="modal-cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-detalle-body">
          <div className="modal-listado modal-listado-detalle modal-listado-manual">
            <div className="modal-seccion-titulo modal-seccion-titulo-manual">
              <div>
                <strong>Aprendices</strong>
                <small>Selecciona el estado y registra novedades si aplica.</small>
              </div>

              <span>{aprendices.length}</span>
            </div>

            {aprendices.map((aprendiz) => (
              <article
                className={`modal-aprendiz-item modal-aprendiz-asistencia ${obtenerClaseEstado(
                  aprendiz.estado
                )}`}
                key={aprendiz.id}
              >
                <div className="manual-aprendiz-info">
                  <div className="aprendiz-cell">
                    <span className="aprendiz-avatar">
                      {obtenerIniciales(aprendiz.nombre)}
                    </span>

                    <div>
                      <strong>{aprendiz.nombre}</strong>
                      <small>{aprendiz.documento}</small>
                    </div>
                  </div>

                  <div className="registro-biometrico-cell">
                    <span
                      className={`estado-chip ${obtenerClaseEstado(
                        aprendiz.estado
                      )}`}
                    >
                      {aprendiz.estado || "Sin marcar"}
                    </span>

                    <span
                      className={`metodo-chip ${obtenerClaseMetodoRegistro(
                        aprendiz
                      )}`}
                    >
                      {obtenerMetodoRegistro(aprendiz)}
                    </span>
                  </div>
                </div>

                <div className="botones-estado">
                  {estadosManuales.map(({ valor, clase, Icono }) => (
                    <button
                      type="button"
                      className={`estado-btn ${clase} ${
                        aprendiz.estado === valor ? "activo" : ""
                      }`}
                      disabled={!asistenciaHabilitada}
                      onClick={() => onCambiarEstadoManual(aprendiz, valor)}
                      key={valor}
                    >
                      <Icono size={14} />
                      <span>{valor}</span>
                    </button>
                  ))}
                </div>

                <div className="modal-novedad-acciones">
                  <button
                    type="button"
                    className="btn-observacion"
                    onClick={() => onAbrirObservacion(aprendiz)}
                  >
                    <PencilLine size={15} />
                    <span>Observación</span>
                  </button>

                  <button
                    type="button"
                    className="btn-alerta-manual"
                    disabled={
                      alertaEnviando === (aprendiz.id_aprendiz || aprendiz.id)
                    }
                    onClick={() => onAbrirAlerta(aprendiz)}
                  >
                    <AlertTriangle size={15} />
                    <span>Alerta</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ModalRegistrosAsistencia({
  visible,
  pendientes,
  aprendicesRegistrados,
  aprendicesPendientes,
  asistenciaHabilitada,
  alertaEnviando,
  onClose,
  onAplicarNovedad,
  onAbrirObservacion,
  onAbrirAlerta,
}) {
  if (!visible) return null;

  return (
    <div className="asistencia-modal-backdrop">
      <section className="asistencia-modal asistencia-modal-inasistencias">
        <div className="asistencia-modal-header">
          <div>
            <span className="tabla-eyebrow">Registros</span>
            <h2>Registros de asistencia</h2>
            <p>
              {aprendicesRegistrados.length} registrado
              {aprendicesRegistrados.length === 1 ? "" : "s"} · {pendientes}{" "}
              pendiente{pendientes === 1 ? "" : "s"}
            </p>
          </div>

          <button type="button" className="modal-cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-listado modal-listado-inasistencias">
          <div className="modal-seccion-titulo">
            <strong>Registrados</strong>
            <span>{aprendicesRegistrados.length}</span>
          </div>

          {aprendicesRegistrados.length ? (
            aprendicesRegistrados.map((aprendiz) => (
              <article
                className="modal-aprendiz-item modal-aprendiz-detalle"
                key={aprendiz.id}
              >
                <div className="aprendiz-cell">
                  <span className="aprendiz-avatar">
                    {obtenerIniciales(aprendiz.nombre)}
                  </span>

                  <div>
                    <strong>{aprendiz.nombre}</strong>
                    <small>{aprendiz.documento}</small>
                  </div>
                </div>

                <div className="registro-biometrico-cell">
                  <span
                    className={`estado-chip ${obtenerClaseEstado(
                      aprendiz.estado
                    )}`}
                  >
                    {aprendiz.estado}
                  </span>

                  <span
                    className={`metodo-chip ${obtenerClaseMetodoRegistro(
                      aprendiz
                    )}`}
                  >
                    {obtenerMetodoRegistro(aprendiz)}
                  </span>

                  {aprendiz.horaRegistro && <small>{aprendiz.horaRegistro}</small>}
                </div>

                <div className="modal-novedad-acciones">
                  <button
                    type="button"
                    className="btn-observacion modal-accion-principal"
                    disabled={!asistenciaHabilitada}
                    onClick={() => onAbrirObservacion(aprendiz)}
                  >
                    <PencilLine size={15} />
                    <span>Observación</span>
                  </button>

                  <button
                    type="button"
                    className="btn-alerta-manual modal-accion-alerta"
                    disabled={
                      !asistenciaHabilitada ||
                      alertaEnviando === (aprendiz.id_aprendiz || aprendiz.id)
                    }
                    onClick={() => onAbrirAlerta(aprendiz)}
                  >
                    <AlertTriangle size={15} />
                    <span>Alerta</span>
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="biometria-lecturas-vacia">
              <ClipboardCheck size={18} />
              <span>Aún no hay aprendices registrados.</span>
            </div>
          )}

          <div className="modal-seccion-titulo">
            <strong>Pendientes por novedad</strong>
            <span>{pendientes}</span>
          </div>

          {aprendicesPendientes.length ? (
            aprendicesPendientes.map((aprendiz) => (
              <article
                className="modal-aprendiz-item modal-aprendiz-novedad"
                key={aprendiz.id}
              >
                <div className="aprendiz-cell">
                  <span className="aprendiz-avatar">
                    {obtenerIniciales(aprendiz.nombre)}
                  </span>

                  <div>
                    <strong>{aprendiz.nombre}</strong>
                    <small>{aprendiz.documento}</small>
                  </div>
                </div>

                <div className="modal-novedad-acciones">
                  <button
                    type="button"
                    className="estado-btn modal-accion-secundaria"
                    disabled={!asistenciaHabilitada}
                    onClick={() => onAplicarNovedad(aprendiz, "Ausente")}
                  >
                    <XCircle size={15} />
                    <span>Ausente</span>
                  </button>

                  <button
                    type="button"
                    className="estado-btn modal-accion-secundaria"
                    disabled={!asistenciaHabilitada}
                    onClick={() => onAplicarNovedad(aprendiz, "Justificada")}
                  >
                    <ShieldAlert size={15} />
                    <span>Justificar</span>
                  </button>

                  <button
                    type="button"
                    className="btn-observacion modal-accion-principal"
                    disabled={!asistenciaHabilitada}
                    onClick={() => onAbrirObservacion(aprendiz)}
                  >
                    <PencilLine size={15} />
                    <span>Observación</span>
                  </button>

                  <button
                    type="button"
                    className="btn-alerta-manual modal-accion-alerta"
                    disabled={
                      !asistenciaHabilitada ||
                      alertaEnviando === (aprendiz.id_aprendiz || aprendiz.id)
                    }
                    onClick={() => onAbrirAlerta(aprendiz)}
                  >
                    <AlertTriangle size={15} />
                    <span>Alerta</span>
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="biometria-completa">
              <CheckCircle2 size={18} />
              <span>Todos los aprendices tienen registro.</span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ModalObservacion({
  aprendiz,
  grupoActual,
  observacionForm,
  observacionError,
  longitudMinimaDescripcion,
  onClose,
  onSubmit,
  onChangeForm,
}) {
  if (!aprendiz) return null;

  return (
    <div className="asistencia-modal-backdrop">
      <section className="asistencia-modal">
        <div className="asistencia-modal-header">
          <div>
            <span className="tabla-eyebrow">Nuevo registro</span>
            <h2>Registrar observación</h2>
            <p>{aprendiz.nombre}</p>
          </div>

          <button type="button" className="modal-cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="asistencia-modal-form" onSubmit={onSubmit}>
          <div className="modal-aprendiz-resumen">
            <span className="aprendiz-avatar">
              {obtenerIniciales(aprendiz.nombre)}
            </span>

            <div>
              <strong>{aprendiz.nombre}</strong>
              <small>
                {aprendiz.documento} · Ficha {grupoActual.ficha}
              </small>
            </div>
          </div>

          <div className="modal-form-grid">
            <label className="campo">
              <span>Tipo de observación</span>

              <select
                value={observacionForm.tipo}
                onChange={(e) =>
                  onChangeForm((actual) => ({
                    ...actual,
                    tipo: e.target.value,
                  }))
                }
                required
              >
                {tiposObservacion.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span>Severidad</span>

              <select
                value={observacionForm.severidad}
                onChange={(e) =>
                  onChangeForm((actual) => ({
                    ...actual,
                    severidad: e.target.value,
                  }))
                }
                required
              >
                {severidades.map((severidad) => (
                  <option key={severidad} value={severidad}>
                    {severidad}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="campo modal-campo-completo">
            <span>Descripción del evento</span>

            <textarea
              value={observacionForm.descripcion}
              minLength={longitudMinimaDescripcion}
              placeholder="Describe el hecho observado y el compromiso acordado."
              onChange={(e) =>
                onChangeForm((actual) => ({
                  ...actual,
                  descripcion: e.target.value,
                }))
              }
              required
            />
          </label>

          {observacionError && <div className="modal-error">{observacionError}</div>}

          <div className="asistencia-modal-actions">
            <button type="button" className="btn-limpiar" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="btn-guardar">
              <Save size={16} />
              <span>Guardar observación</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export function ModalAlerta({
  aprendiz,
  alertaForm,
  alertaError,
  longitudMinimaDescripcion,
  onClose,
  onSubmit,
  onChangeForm,
}) {
  if (!aprendiz) return null;

  return (
    <div className="asistencia-modal-backdrop">
      <section className="asistencia-modal">
        <div className="asistencia-modal-header">
          <div>
            <span className="tabla-eyebrow">Alerta manual</span>
            <h2>Reportar situación crítica</h2>
            <p>{aprendiz.nombre}</p>
          </div>

          <button type="button" className="modal-cerrar" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="asistencia-modal-form" onSubmit={onSubmit}>
          <div className="modal-form-grid">
            <label className="campo">
              <span>Tipo de alerta</span>

              <select
                value={alertaForm.tipo}
                onChange={(e) =>
                  onChangeForm((actual) => ({
                    ...actual,
                    tipo: e.target.value,
                  }))
                }
                required
              >
                {tiposAlertaManual.map((tipo) => (
                  <option
                    key={obtenerValorTipoAlerta(tipo)}
                    value={obtenerValorTipoAlerta(tipo)}
                  >
                    {obtenerTextoTipoAlerta(tipo)}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo">
              <span>Severidad</span>

              <select
                value={alertaForm.severidad || alertaFormInicial.severidad}
                onChange={(e) =>
                  onChangeForm((actual) => ({
                    ...actual,
                    severidad: e.target.value,
                  }))
                }
                required
              >
                {severidades.map((severidad) => (
                  <option key={severidad} value={severidad}>
                    {severidad}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="campo modal-campo-completo">
            <span>Justificación</span>

            <textarea
              value={alertaForm.justificacion || ""}
              minLength={longitudMinimaDescripcion}
              placeholder="Explica por qué se genera la alerta manual."
              onChange={(e) =>
                onChangeForm((actual) => ({
                  ...actual,
                  justificacion: e.target.value,
                }))
              }
              required
            />
          </label>

          {alertaError && <div className="modal-error">{alertaError}</div>}

          <div className="asistencia-modal-actions">
            <button type="button" className="btn-limpiar" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="btn-guardar">
              <AlertTriangle size={16} />
              <span>Crear alerta</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
