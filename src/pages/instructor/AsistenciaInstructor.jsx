import "./asistenciaInstructor.css";

import {
  AccionesAsistencia,
  AsistenciaEncabezado,
  BiometriaOperacion,
  FiltrosAsistencia,
  HorarioSesionPanel,
  MensajeAsistencia,
} from "./asistencia/AsistenciaPaneles";

import {
  ModalAlerta,
  ModalAsistenciaManual,
  ModalDetalleAsistencia,
  ModalObservacion,
  ModalRegistrosAsistencia,
} from "./asistencia/AsistenciaModals";

import { useAsistenciaInstructor } from "./asistencia/useAsistenciaInstructor";

export default function AsistenciaInstructor() {
  const asistencia = useAsistenciaInstructor();

  return (
    <div className="asistencia-page">
      <AsistenciaEncabezado
        grupoActual={asistencia.grupoActual}
        porcentaje={asistencia.porcentaje}
        presentes={asistencia.presentes}
        total={asistencia.total}
      />

      <MensajeAsistencia mensaje={asistencia.mensajeAsistencia} />

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

      <HorarioSesionPanel
        estadoHorario={asistencia.estadoHorario}
        etiquetaSesion={asistencia.etiquetaSesion}
        fechaSesion={asistencia.fechaSesion}
        horarioSeleccionado={asistencia.horarioSeleccionado}
        fechaHoraActual={asistencia.fechaHoraActual}
      />

      <BiometriaOperacion
        asistenciaHabilitada={asistencia.asistenciaHabilitada}
        proximoAprendizBiometria={asistencia.proximoAprendizBiometria}
        registrosBiometricos={asistencia.registrosBiometricos}
        pendientes={asistencia.pendientes}
        porcentaje={asistencia.porcentaje}
        onRegistrarHuella={asistencia.registrarHuellaBiometrica}
        onVerDetalle={asistencia.abrirModalDetalleAsistencia}
        onVerRegistrados={asistencia.abrirModalInasistencias}
        onRegistrarObservacion={() =>
          asistencia.proximoAprendizBiometria &&
          asistencia.abrirModalObservacion(asistencia.proximoAprendizBiometria)
        }
      />

      <AccionesAsistencia
        asistenciaHabilitada={asistencia.asistenciaHabilitada}
        pendientes={asistencia.pendientes}
        presentes={asistencia.presentes}
        total={asistencia.total}
        onAsistenciaManual={asistencia.abrirModalAsistenciaManual}
        onLimpiar={asistencia.limpiarAsistencia}
        onCerrarPendientes={asistencia.marcarPendientesComoAusentes}
        onGuardar={asistencia.guardarAsistencia}
      />

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
        alertaForm={asistencia.alertaForm}
        alertaError={asistencia.alertaError}
        longitudMinimaDescripcion={asistencia.longitudMinimaDescripcion}
        onClose={asistencia.cerrarModalAlerta}
        onSubmit={asistencia.crearAlertaManual}
        onChangeForm={asistencia.setAlertaForm}
      />
    </div>
  );
}
