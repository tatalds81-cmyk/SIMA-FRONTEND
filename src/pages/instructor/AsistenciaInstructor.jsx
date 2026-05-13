import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  History,
  ListChecks,
  MessageSquareWarning,
  ShieldAlert,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import "./asistenciaInstructor.css";

import {
  BiometriaOperacion,
  FiltrosAsistencia,
  MensajeAsistencia,
  SesionActualPanel,
  SesionesAsistenciaPanel,
} from "./asistencia/AsistenciaPaneles";

import {
  ModalAlerta,
  ModalAsistenciaManual,
  ModalDetalleAsistencia,
  ModalObservacion,
  ModalRegistrosAsistencia,
  ModalSesionGuardada,
} from "./asistencia/AsistenciaModals";

import {
  formatearHora,
  obtenerClaseEstado,
  obtenerClaseMetodoRegistro,
  obtenerEstadoHorario,
  obtenerHorariosGrupo,
  obtenerHorariosParaFecha,
  obtenerIniciales,
  obtenerMetodoRegistro,
} from "./asistencia/asistenciaUtils";
import { useAsistenciaInstructor } from "./asistencia/useAsistenciaInstructor";

const MINUTOS_APERTURA_ANTES = 15;
const MINUTOS_CIERRE_DESPUES = 20;

const PESTANAS_GRUPO = [
  { id: "resumen", label: "Resumen", Icono: UsersRound },
  { id: "asistencia", label: "Asistencia", Icono: ClipboardCheck },
  { id: "aprendices", label: "Aprendices", Icono: UserRoundCheck },
  { id: "historial", label: "Historial", Icono: History },
];

function crearSesionesInstructor(grupos, fechaSesion, fechaHoraActual) {
  return grupos
    .filter((grupo) => grupo.id)
    .flatMap((grupo) => {
      const horarios = obtenerHorariosGrupo(grupo, grupo.jornada);
      const horariosFecha = obtenerHorariosParaFecha(horarios, fechaSesion);
      const horariosVisibles = horariosFecha.length ? horariosFecha : [null];

      return horariosVisibles.map((horario, indice) => {
        const estadoHorario = obtenerEstadoHorario({
          horario,
          horarios,
          fechaSesion,
          fechaHoraActual,
          minutosAperturaAntes: MINUTOS_APERTURA_ANTES,
          minutosCierreDespues: MINUTOS_CIERRE_DESPUES,
        });

        return {
          id: `${grupo.id}-${fechaSesion}-${horario?.id || `sin-${indice}`}`,
          grupo,
          horario,
          fecha: fechaSesion,
          jornada: grupo.jornada || "Sin jornada",
          estado: horario ? estadoHorario.titulo : "Sin sesion",
          estadoTecnico: horario ? estadoHorario.estado : "cerrada",
          detalle: estadoHorario.detalle,
          horarioTexto: horario
            ? `${formatearHora(horario.inicio)} - ${formatearHora(horario.fin)}`
            : "Sin horario asignado",
          ambiente: horario?.ambiente || "Ambiente por asignar",
          sinProgramacion: !horario,
        };
      });
    });
}

function obtenerResumenAgenda(sesiones, grupos) {
  const sesionesProgramadas = sesiones.filter((sesion) => !sesion.sinProgramacion);

  return [
    {
      titulo: "Grupos",
      valor: grupos.filter((grupo) => grupo.id).length,
      detalle: "Asignados",
      Icono: UsersRound,
    },
    {
      titulo: "Sesiones",
      valor: sesionesProgramadas.length,
      detalle: "En la fecha",
      Icono: CalendarDays,
    },
    {
      titulo: "Activas",
      valor: sesionesProgramadas.filter(
        (sesion) => sesion.estadoTecnico === "abierta"
      ).length,
      detalle: "Disponibles",
      Icono: Clock3,
    },
    {
      titulo: "Sin horario",
      valor: sesiones.filter((sesion) => sesion.sinProgramacion).length,
      detalle: "Por revisar",
      Icono: ShieldAlert,
    },
  ];
}

function VistaSesionesInstructor({
  cargandoGrupos,
  fechaSesion,
  gruposDisponibles,
  sesionesAgenda,
  onCambiarFecha,
  onAbrirSesion,
}) {
  const tarjetasResumen = obtenerResumenAgenda(sesionesAgenda, gruposDisponibles);

  return (
    <>
      <header className="sesiones-instructor-header">
        <div>
          <span className="asistencia-eyebrow">
            <CalendarDays size={17} />
            Agenda del instructor
          </span>

          <h1>Mis sesiones</h1>

          <p>Grupos asignados, horario, ambiente y estado de apertura.</p>
        </div>

        <label className="campo sesiones-fecha-control">
          <span>Fecha</span>

          <input
            type="date"
            value={fechaSesion}
            onChange={(e) => onCambiarFecha(e.target.value)}
          />
        </label>
      </header>

      <section className="sesiones-resumen-grid" aria-label="Resumen de agenda">
        {tarjetasResumen.map(({ titulo, valor, detalle, Icono }) => (
          <article className="sesiones-resumen-card" key={titulo}>
            <Icono size={20} />

            <div>
              <span>{titulo}</span>
              <strong>{valor}</strong>
              <small>{detalle}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="sesiones-instructor-panel">
        <div className="sesiones-panel-header">
          <div>
            <span className="tabla-eyebrow">
              <ListChecks size={16} />
              Sesiones asignadas
            </span>

            <strong>{sesionesAgenda.length}</strong>
          </div>
        </div>

        {cargandoGrupos ? (
          <div className="sesion-empty-state">
            <Clock3 size={20} />
            <span>Cargando sesiones asignadas.</span>
          </div>
        ) : sesionesAgenda.length ? (
          <div className="sesiones-card-grid">
            {sesionesAgenda.map((sesion) => (
              <button
                type="button"
                className={`sesion-resumen-card ${
                  sesion.sinProgramacion ? "sin-programacion" : ""
                }`}
                key={sesion.id}
                onClick={() => onAbrirSesion(sesion)}
              >
                <span className={`estado-sesion-badge ${sesion.estadoTecnico}`}>
                  {sesion.estado}
                </span>

                <ChevronRight className="sesion-card-arrow" size={20} />

                <strong>Ficha {sesion.grupo.ficha}</strong>
                <small>{sesion.grupo.programa}</small>

                <div className="sesion-card-meta">
                  <span>
                    <Clock3 size={15} />
                    {sesion.horarioTexto}
                  </span>
                  <span>
                    <CalendarDays size={15} />
                    {sesion.jornada}
                  </span>
                  <span>
                    <UsersRound size={15} />
                    {sesion.ambiente}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="sesion-empty-state">
            <CalendarDays size={20} />
            <span>No hay grupos asignados para esta agenda.</span>
          </div>
        )}
      </section>
    </>
  );
}

function GrupoResumen({ asistencia }) {
  const tarjetas = [
    {
      titulo: "Aprendices",
      valor: asistencia.total,
      detalle: "En el grupo",
      Icono: UsersRound,
    },
    {
      titulo: "Asistencia",
      valor: `${asistencia.porcentaje}%`,
      detalle: `${asistencia.presentes} presentes`,
      Icono: ClipboardCheck,
    },
    {
      titulo: "Pendientes",
      valor: asistencia.pendientes,
      detalle: "Sin registro",
      Icono: Clock3,
    },
    {
      titulo: "Historial",
      valor: asistencia.metricasSesiones.totalSesiones,
      detalle: "Sesiones guardadas",
      Icono: History,
    },
  ];

  return (
    <section className="grupo-resumen-grid" aria-label="Resumen del grupo">
      {tarjetas.map(({ titulo, valor, detalle, Icono }) => (
        <article className="grupo-resumen-card" key={titulo}>
          <Icono size={20} />

          <div>
            <span>{titulo}</span>
            <strong>{valor}</strong>
            <small>{detalle}</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function ResumenGrupoTab({ asistencia }) {
  const distribucion = [
    { label: "Presentes", valor: asistencia.presentes, clase: "asistio" },
    { label: "Ausentes", valor: asistencia.ausentes, clase: "ausente" },
    { label: "Tarde", valor: asistencia.tarde, clase: "tarde" },
    { label: "Justificados", valor: asistencia.justificadas, clase: "justificada" },
  ];

  return (
    <div className="grupo-tab-stack">
      <section className="grupo-overview-grid">
        <article className="grupo-context-card">
          <span className="tabla-eyebrow">
            <UsersRound size={16} />
            Grupo
          </span>

          <strong>Ficha {asistencia.grupoActual.ficha}</strong>
          <p>{asistencia.grupoActual.programa}</p>

          <div className="grupo-context-list">
            <div>
              <span>Jornada</span>
              <strong>{asistencia.jornada}</strong>
            </div>
            <div>
              <span>Sesion</span>
              <strong>{asistencia.etiquetaSesion}</strong>
            </div>
            <div>
              <span>Instructor</span>
              <strong>{asistencia.sesionActual?.instructor || "Sin asignar"}</strong>
            </div>
            <div>
              <span>Ambiente</span>
              <strong>{asistencia.sesionActual?.ambiente || "Por asignar"}</strong>
            </div>
          </div>
        </article>

        <article className="grupo-context-card">
          <span className="tabla-eyebrow">
            <ClipboardCheck size={16} />
            Estado del grupo
          </span>

          <div className="grupo-status-grid">
            {distribucion.map((item) => (
              <div className="grupo-status-item" key={item.label}>
                <span className={`estado-chip ${item.clase}`}>{item.label}</span>
                <strong>{item.valor}</strong>
              </div>
            ))}
          </div>

          <div className="grupo-progress-line">
            <span style={{ width: `${asistencia.porcentaje}%` }} />
          </div>
        </article>
      </section>

      <SesionActualPanel
        sesionActual={asistencia.sesionActual}
        qrSesion={asistencia.qrSesion}
        estadoHorario={asistencia.estadoHorario}
        fechaHoraActual={asistencia.fechaHoraActual}
      />
    </div>
  );
}

function AsistenciaGrupoTab({ asistencia }) {
  return (
    <div className="grupo-tab-stack">
      <FiltrosAsistencia
        cargandoGrupos={asistencia.cargandoGrupos}
        grupoSeleccionado={asistencia.grupoSeleccionado}
        gruposDisponibles={asistencia.gruposDisponibles}
        fechaSesion={asistencia.fechaSesion}
        jornada={asistencia.jornada}
        horarioSeleccionado={asistencia.horarioSeleccionado}
        horariosFechaSeleccionada={asistencia.horariosFechaSeleccionada}
        estadoHorario={asistencia.estadoHorario}
        onSeleccionarGrupo={asistencia.seleccionarGrupo}
        onCambiarFecha={asistencia.cambiarFechaSesion}
        onCambiarJornada={asistencia.cambiarJornada}
        onCambiarHorario={asistencia.cambiarHorarioSeleccionado}
      />

      <SesionActualPanel
        sesionActual={asistencia.sesionActual}
        qrSesion={asistencia.qrSesion}
        estadoHorario={asistencia.estadoHorario}
        fechaHoraActual={asistencia.fechaHoraActual}
      />

      <BiometriaOperacion
        asistenciaHabilitada={asistencia.asistenciaHabilitada}
        proximoAprendizBiometria={asistencia.proximoAprendizBiometria}
        registrosBiometricos={asistencia.registrosBiometricos}
        registrosQr={asistencia.registrosQr}
        ajustesManuales={asistencia.ajustesManuales}
        aprendicesRegistrados={asistencia.aprendicesRegistrados}
        pendientes={asistencia.pendientes}
        presentes={asistencia.presentes}
        ausentes={asistencia.ausentes}
        tarde={asistencia.tarde}
        justificadas={asistencia.justificadas}
        total={asistencia.total}
        porcentaje={asistencia.porcentaje}
        qrSesion={asistencia.qrSesion}
        onRegistrarHuella={asistencia.registrarHuellaBiometrica}
        onGestionarQr={
          asistencia.qrSesion
            ? asistencia.registrarQrSesion
            : asistencia.generarQrSesion
        }
        onAsistenciaManual={asistencia.abrirModalAsistenciaManual}
        onVerDetalle={asistencia.abrirModalDetalleAsistencia}
        onVerRegistrados={asistencia.abrirModalInasistencias}
        onCerrarPendientes={asistencia.marcarPendientesComoAusentes}
        onGuardar={asistencia.guardarAsistencia}
        onRegistrarObservacion={() =>
          asistencia.proximoAprendizBiometria &&
          asistencia.abrirModalObservacion(asistencia.proximoAprendizBiometria)
        }
      />
    </div>
  );
}

function AprendicesGrupoTab({ asistencia }) {
  return (
    <section className="aprendices-grupo-panel">
      <div className="biometria-card-header">
        <span className="tabla-eyebrow">
          <UserRoundCheck size={16} />
          Aprendices del grupo
        </span>

        <strong>{asistencia.aprendices.length}</strong>
      </div>

      <div className="aprendices-grupo-list">
        {asistencia.aprendices.map((aprendiz) => (
          <article className="aprendiz-grupo-row" key={aprendiz.id}>
            <div className="aprendiz-cell">
              <span className="aprendiz-avatar">
                {obtenerIniciales(aprendiz.nombre)}
              </span>

              <div>
                <strong>{aprendiz.nombre}</strong>
                <small>{aprendiz.documento}</small>
              </div>
            </div>

            <span className={`estado-chip ${obtenerClaseEstado(aprendiz.estado)}`}>
              {aprendiz.estado || "Sin marcar"}
            </span>

            <span
              className={`metodo-chip ${obtenerClaseMetodoRegistro(aprendiz)}`}
            >
              {obtenerMetodoRegistro(aprendiz)}
            </span>

            <span className="aprendiz-formativo">
              {aprendiz.estadoFormativo || "En formacion"}
            </span>

            <div className="aprendiz-grupo-actions">
              <button
                type="button"
                className="btn-observacion"
                onClick={() => asistencia.abrirModalObservacion(aprendiz)}
              >
                <MessageSquareWarning size={16} />
                <span>Observacion</span>
              </button>

              <button
                type="button"
                className="btn-alerta-manual"
                onClick={() => asistencia.abrirModalAlerta(aprendiz)}
              >
                <ShieldAlert size={16} />
                <span>Alerta</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HistorialGrupoTab({ asistencia }) {
  return (
    <SesionesAsistenciaPanel
      sesiones={asistencia.sesionesVisibles}
      metricas={asistencia.metricasSesiones}
      alcanceSesiones={asistencia.alcanceSesiones}
      onVerSesion={asistencia.abrirDetalleSesionGuardada}
    />
  );
}

function DetalleGrupoInstructor({
  asistencia,
  pestanaActiva,
  onCambiarPestana,
  onVolver,
}) {
  return (
    <>
      <header className="grupo-detalle-header">
        <button type="button" className="btn-volver-sesiones" onClick={onVolver}>
          <ArrowLeft size={17} />
          <span>Sesiones</span>
        </button>

        <div>
          <span className="asistencia-eyebrow">
            <Eye size={17} />
            Detalle del grupo
          </span>

          <h1>Ficha {asistencia.grupoActual.ficha}</h1>
          <p>{asistencia.grupoActual.programa}</p>
        </div>
      </header>

      <GrupoResumen asistencia={asistencia} />

      <nav className="grupo-tabs" aria-label="Secciones del grupo">
        {PESTANAS_GRUPO.map(({ id, label, Icono }) => (
          <button
            type="button"
            className={pestanaActiva === id ? "activo" : ""}
            key={id}
            onClick={() => onCambiarPestana(id)}
          >
            <Icono size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {pestanaActiva === "resumen" && <ResumenGrupoTab asistencia={asistencia} />}
      {pestanaActiva === "asistencia" && (
        <AsistenciaGrupoTab asistencia={asistencia} />
      )}
      {pestanaActiva === "aprendices" && (
        <AprendicesGrupoTab asistencia={asistencia} />
      )}
      {pestanaActiva === "historial" && (
        <HistorialGrupoTab asistencia={asistencia} />
      )}
    </>
  );
}

export default function AsistenciaInstructor() {
  const asistencia = useAsistenciaInstructor();
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState("resumen");

  const sesionesAgenda = useMemo(
    () =>
      crearSesionesInstructor(
        asistencia.gruposDisponibles,
        asistencia.fechaSesion,
        asistencia.fechaHoraActual
      ),
    [
      asistencia.fechaHoraActual,
      asistencia.fechaSesion,
      asistencia.gruposDisponibles,
    ]
  );

  function abrirSesion(sesion) {
    asistencia.seleccionarGrupo(sesion.grupo.id);
    asistencia.cambiarFechaSesion(sesion.fecha);
    asistencia.cambiarJornada(sesion.jornada);
    asistencia.cambiarHorarioSeleccionado(sesion.horario?.id || "");
    setPestanaActiva("resumen");
    setDetalleAbierto(true);
  }

  function volverASesiones() {
    setDetalleAbierto(false);
    setPestanaActiva("resumen");
  }

  return (
    <div className="asistencia-page asistencia-workspace">
      <MensajeAsistencia mensaje={asistencia.mensajeAsistencia} />

      {detalleAbierto ? (
        <DetalleGrupoInstructor
          asistencia={asistencia}
          pestanaActiva={pestanaActiva}
          onCambiarPestana={setPestanaActiva}
          onVolver={volverASesiones}
        />
      ) : (
        <VistaSesionesInstructor
          cargandoGrupos={asistencia.cargandoGrupos}
          fechaSesion={asistencia.fechaSesion}
          gruposDisponibles={asistencia.gruposDisponibles}
          sesionesAgenda={sesionesAgenda}
          onCambiarFecha={asistencia.cambiarFechaSesion}
          onAbrirSesion={abrirSesion}
        />
      )}

      <ModalDetalleAsistencia
        visible={asistencia.modalDetalleAsistencia}
        fechaSesion={asistencia.fechaSesion}
        grupoActual={asistencia.grupoActual}
        etiquetaSesion={asistencia.etiquetaSesion}
        aprendices={asistencia.aprendices}
        total={asistencia.total}
        registrosBiometricos={asistencia.registrosBiometricos}
        presentes={asistencia.presentes}
        porcentaje={asistencia.porcentaje}
        tarde={asistencia.tarde}
        ajustesManuales={asistencia.ajustesManuales}
        ausentes={asistencia.ausentes}
        justificadas={asistencia.justificadas}
        pendientes={asistencia.pendientes}
        alertaEnviando={asistencia.alertaEnviando}
        onClose={asistencia.cerrarModalDetalleAsistencia}
        onAbrirObservacion={asistencia.abrirModalObservacion}
        onAbrirAlerta={asistencia.abrirModalAlerta}
      />

      <ModalAsistenciaManual
        visible={asistencia.modalAsistenciaManual}
        fechaSesion={asistencia.fechaSesion}
        grupoActual={asistencia.grupoActual}
        etiquetaSesion={asistencia.etiquetaSesion}
        aprendices={asistencia.aprendices}
        asistenciaHabilitada={asistencia.asistenciaHabilitada}
        alertaEnviando={asistencia.alertaEnviando}
        onClose={asistencia.cerrarModalAsistenciaManual}
        onCambiarEstadoManual={asistencia.cambiarEstadoManual}
        onAbrirObservacion={asistencia.abrirModalObservacion}
        onAbrirAlerta={asistencia.abrirModalAlerta}
      />

      <ModalRegistrosAsistencia
        visible={asistencia.modalInasistencias}
        pendientes={asistencia.pendientes}
        aprendicesRegistrados={asistencia.aprendicesRegistrados}
        aprendicesPendientes={asistencia.aprendicesPendientes}
        asistenciaHabilitada={asistencia.asistenciaHabilitada}
        alertaEnviando={asistencia.alertaEnviando}
        onClose={asistencia.cerrarModalInasistencias}
        onAplicarNovedad={asistencia.aplicarNovedadAprendiz}
        onAbrirObservacion={asistencia.abrirModalObservacion}
        onAbrirAlerta={asistencia.abrirModalAlerta}
      />

      <ModalObservacion
        aprendiz={asistencia.modalObservacion}
        grupoActual={asistencia.grupoActual}
        observacionForm={asistencia.observacionForm}
        observacionError={asistencia.observacionError}
        longitudMinimaDescripcion={asistencia.longitudMinimaDescripcion}
        onClose={asistencia.cerrarModalObservacion}
        onSubmit={asistencia.guardarObservacion}
        onChangeForm={asistencia.setObservacionForm}
      />

      <ModalAlerta
        aprendiz={asistencia.modalAlerta}
        grupoActual={asistencia.grupoActual}
        alertaForm={asistencia.alertaForm}
        onClose={asistencia.cerrarModalAlerta}
        onAlertaCreada={asistencia.registrarAlertaCreada}
      />

      <ModalSesionGuardada
        sesion={asistencia.modalSesionDetalle}
        onClose={asistencia.cerrarDetalleSesionGuardada}
      />
    </div>
  );
}
