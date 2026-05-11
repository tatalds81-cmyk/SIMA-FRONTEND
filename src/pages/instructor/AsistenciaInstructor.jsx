import "./asistenciaInstructor.css";

import {
  AsistenciaEncabezado,
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

      <SesionesAsistenciaPanel
        sesiones={asistencia.sesionesVisibles}
        metricas={asistencia.metricasSesiones}
        alcanceSesiones={asistencia.alcanceSesiones}
        onVerSesion={asistencia.abrirDetalleSesionGuardada}
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
