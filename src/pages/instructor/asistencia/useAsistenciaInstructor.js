import { useEffect, useMemo, useState } from "react";

import {
  aprendicesIniciales,
  gruposSimulados,
  observacionesIniciales,
} from "./asistenciaData";

import {
  API_URL,
  URL_GRUPOS_ACTIVOS,
  extraerLista,
  getHeaders,
  normalizarAprendiz,
  normalizarGrupo,
} from "./asistenciaApi";

import { alertaFormInicial, observacionFormInicial } from "./asistenciaForms";

import {
  formatearFechaHora,
  formatearHora,
  obtenerEstadoHorario,
  obtenerEstadoPorHuella,
  obtenerFechaInput,
  obtenerHoraActualTexto,
  obtenerHorariosGrupo,
  obtenerHorariosParaFecha,
  obtenerMetodoRegistro,
} from "./asistenciaUtils";

const MINUTOS_APERTURA_ANTES = 15;
const MINUTOS_CIERRE_DESPUES = 20;
const MINUTOS_TOLERANCIA_TARDE = 10;
const LONGITUD_MINIMA_DESCRIPCION = 15;
const MODO_PRUEBA_ASISTENCIA = true;

function obtenerInstructorActual() {
  return (
    localStorage.getItem("username") ||
    localStorage.getItem("usuario") ||
    "Instructor del sistema"
  );
}

function cargarObservacionesLocales() {
  try {
    const guardadas = localStorage.getItem("asistencia_observaciones");
    const lista = guardadas ? JSON.parse(guardadas) : null;
    return Array.isArray(lista) && lista.length ? lista : observacionesIniciales;
  } catch (error) {
    console.warn("No fue posible cargar observaciones locales:", error);
    return observacionesIniciales;
  }
}

export function useAsistenciaInstructor() {
  const [gruposDisponibles, setGruposDisponibles] = useState(gruposSimulados);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(
    gruposSimulados[0].id
  );
  const [fechaSesion, setFechaSesion] = useState(() => obtenerFechaInput());
  const [jornada, setJornada] = useState("Mañana");
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] = useState("");
  const [fechaHoraActual, setFechaHoraActual] = useState(() => new Date());

  const [aprendices, setAprendices] = useState(aprendicesIniciales);
  const [cargandoGrupos, setCargandoGrupos] = useState(false);
  const [cargandoAprendices, setCargandoAprendices] = useState(false);
  const [lecturasBiometricas, setLecturasBiometricas] = useState([]);

  const [mensajeAsistencia, setMensajeAsistencia] = useState(null);
  const [modalInasistencias, setModalInasistencias] = useState(false);
  const [modalDetalleAsistencia, setModalDetalleAsistencia] = useState(false);
  const [modalAsistenciaManual, setModalAsistenciaManual] = useState(false);

  const [modalObservacion, setModalObservacion] = useState(null);
  const [observaciones, setObservaciones] = useState(cargarObservacionesLocales);
  const [observacionForm, setObservacionForm] = useState(observacionFormInicial);
  const [observacionError, setObservacionError] = useState("");

  const [modalAlerta, setModalAlerta] = useState(null);
  const [alertaForm, setAlertaForm] = useState(alertaFormInicial);
  const [alertaError, setAlertaError] = useState("");
  const [alertaEnviando, setAlertaEnviando] = useState(null);

  const grupoActual =
    gruposDisponibles.find((grupo) => grupo.id === grupoSeleccionado) ||
    gruposDisponibles[0] ||
    gruposSimulados[0];

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setFechaHoraActual(new Date());
    }, 60000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "asistencia_observaciones",
      JSON.stringify(observaciones)
    );
  }, [observaciones]);

  useEffect(() => {
    let activo = true;

    async function cargarGruposReales() {
      setCargandoGrupos(true);

      try {
        const res = await fetch(URL_GRUPOS_ACTIVOS, {
          headers: getHeaders(),
        });

        if (!res.ok) {
          throw new Error("No fue posible cargar grupos reales");
        }

        const data = await res.json().catch(() => null);
        const gruposBackend = extraerLista(data)
          .map(normalizarGrupo)
          .filter((grupo) => grupo.id);

        if (!activo || !gruposBackend.length) return;

        setGruposDisponibles(gruposBackend);
        setGrupoSeleccionado(gruposBackend[0].id);
        setJornada(gruposBackend[0].jornada || "Mañana");
      } catch (error) {
        console.warn("Asistencia en modo local:", error);

        if (!activo) return;

        setGruposDisponibles(gruposSimulados);
        setGrupoSeleccionado(gruposSimulados[0].id);
        setJornada(gruposSimulados[0].jornada);
        setAprendices(aprendicesIniciales);
      } finally {
        if (activo) setCargandoGrupos(false);
      }
    }

    cargarGruposReales();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;
    const idGrupo = grupoActual?.idGrupo;

    if (!idGrupo) {
      const timeout = window.setTimeout(() => {
        if (activo) setAprendices(aprendicesIniciales);
      }, 0);

      return () => {
        activo = false;
        window.clearTimeout(timeout);
      };
    }

    async function cargarAprendicesReales() {
      setCargandoAprendices(true);

      try {
        const res = await fetch(
          `${API_URL}/apprentices/grupo/${idGrupo}?limit=500`,
          {
            headers: getHeaders(),
          }
        );

        if (!res.ok) {
          throw new Error("No fue posible cargar aprendices reales");
        }

        const data = await res.json().catch(() => null);
        const aprendicesBackend = extraerLista(data).map(normalizarAprendiz);

        if (activo) setAprendices(aprendicesBackend);
      } catch (error) {
        console.warn("Aprendices en modo local:", error);
        if (activo) setAprendices(aprendicesIniciales);
      } finally {
        if (activo) setCargandoAprendices(false);
      }
    }

    cargarAprendicesReales();

    return () => {
      activo = false;
    };
  }, [grupoActual?.idGrupo]);

  const horariosGrupoActual = useMemo(
    () => obtenerHorariosGrupo(grupoActual, jornada),
    [grupoActual, jornada]
  );

  const horariosFechaSeleccionada = useMemo(
    () => obtenerHorariosParaFecha(horariosGrupoActual, fechaSesion),
    [horariosGrupoActual, fechaSesion]
  );

  const horarioSeleccionado =
    horariosFechaSeleccionada.find(
      (horario) => horario.id === horarioSeleccionadoId
    ) ||
    horariosFechaSeleccionada[0] ||
    null;

  const estadoHorario = useMemo(
    () =>
      obtenerEstadoHorario({
        horario: horarioSeleccionado,
        horarios: horariosGrupoActual,
        fechaSesion,
        fechaHoraActual,
        minutosAperturaAntes: MINUTOS_APERTURA_ANTES,
        minutosCierreDespues: MINUTOS_CIERRE_DESPUES,
      }),
    [fechaHoraActual, fechaSesion, horarioSeleccionado, horariosGrupoActual]
  );

  const asistenciaHabilitada =
    (estadoHorario.abierta || MODO_PRUEBA_ASISTENCIA) && !cargandoAprendices;

  const etiquetaSesion = estadoHorario.festivo
    ? `Día festivo: ${estadoHorario.festivo.nombre}`
    : horarioSeleccionado
    ? `${horarioSeleccionado.nombre} (${formatearHora(
        horarioSeleccionado.inicio
      )} - ${formatearHora(horarioSeleccionado.fin)})`
    : "Sin sesión programada";

  const total = aprendices.length;
  const presentes = aprendices.filter((aprendiz) =>
    ["Asistió", "Tarde"].includes(aprendiz.estado)
  ).length;
  const ausentes = aprendices.filter(
    (aprendiz) => aprendiz.estado === "Ausente"
  ).length;
  const tarde = aprendices.filter(
    (aprendiz) => aprendiz.estado === "Tarde"
  ).length;
  const justificadas = aprendices.filter(
    (aprendiz) => aprendiz.estado === "Justificada"
  ).length;
  const pendientes = aprendices.filter((aprendiz) => !aprendiz.estado).length;
  const registrosBiometricos = aprendices.filter(
    (aprendiz) => obtenerMetodoRegistro(aprendiz) === "Huella biométrica"
  ).length;
  const ajustesManuales = aprendices.filter(
    (aprendiz) => obtenerMetodoRegistro(aprendiz) === "Ajuste manual"
  ).length;
  const proximoAprendizBiometria =
    aprendices.find((aprendiz) => !aprendiz.estado) || null;

  const aprendicesPendientes = useMemo(
    () => aprendices.filter((aprendiz) => !aprendiz.estado),
    [aprendices]
  );
  const aprendicesRegistrados = useMemo(
    () => aprendices.filter((aprendiz) => aprendiz.estado),
    [aprendices]
  );
  const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

  function validarSesionAbierta() {
    if (MODO_PRUEBA_ASISTENCIA) return true;
    if (estadoHorario.abierta) return true;

    alert(estadoHorario.bloqueo || "La sesión no está abierta según el horario.");
    return false;
  }

  function mostrarMensajeAsistencia(texto, tipo = "info") {
    setMensajeAsistencia({ texto, tipo });
  }

  function reiniciarSesionSeleccionada() {
    setHorarioSeleccionadoId("");
    setLecturasBiometricas([]);
    setMensajeAsistencia(null);
  }

  function seleccionarGrupo(idGrupo) {
    const nuevoGrupo = gruposDisponibles.find((grupo) => grupo.id === idGrupo);

    setGrupoSeleccionado(idGrupo);
    setJornada(nuevoGrupo?.jornada || jornada);
    reiniciarSesionSeleccionada();
  }

  function cambiarFechaSesion(nuevaFecha) {
    setFechaSesion(nuevaFecha);
    reiniciarSesionSeleccionada();
  }

  function cambiarJornada(nuevaJornada) {
    setJornada(nuevaJornada);
    reiniciarSesionSeleccionada();
  }

  function cambiarHorarioSeleccionado(idHorario) {
    setHorarioSeleccionadoId(idHorario);
    setLecturasBiometricas([]);
    setMensajeAsistencia(null);
  }

  function abrirModalInasistencias() {
    setModalInasistencias(true);
  }

  function cerrarModalInasistencias() {
    setModalInasistencias(false);
  }

  function abrirModalDetalleAsistencia() {
    setModalDetalleAsistencia(true);
  }

  function cerrarModalDetalleAsistencia() {
    setModalDetalleAsistencia(false);
  }

  function abrirModalAsistenciaManual() {
    setModalAsistenciaManual(true);
  }

  function cerrarModalAsistenciaManual() {
    setModalAsistenciaManual(false);
  }

  function registrarHuellaBiometrica() {
    if (!validarSesionAbierta()) return;

    const aprendiz = proximoAprendizBiometria;

    if (!aprendiz) {
      alert("Todos los aprendices ya tienen registro para esta sesión.");
      return;
    }

    const fechaRegistro = new Date();
    const horaRegistro = obtenerHoraActualTexto(fechaRegistro);
    const estadoBiometrico = obtenerEstadoPorHuella(
      horarioSeleccionado,
      fechaRegistro,
      MINUTOS_TOLERANCIA_TARDE
    );

    setAprendices((lista) =>
      lista.map((item) =>
        item.id === aprendiz.id
          ? {
              ...item,
              estado: estadoBiometrico,
              metodoRegistro: "Huella biométrica",
              horaRegistro,
              observacion:
                estadoBiometrico === "Tarde"
                  ? `Huella validada después de ${MINUTOS_TOLERANCIA_TARDE} minutos de tolerancia.`
                  : item.observacion,
            }
          : item
      )
    );

    setLecturasBiometricas((lista) =>
      [
        {
          id: `${aprendiz.id}-${fechaRegistro.getTime()}`,
          aprendizNombre: aprendiz.nombre,
          documento: aprendiz.documento,
          estado: estadoBiometrico,
          hora: horaRegistro,
          resultado: "Validada",
        },
        ...lista,
      ].slice(0, 5)
    );
  }

  function aplicarNovedadAprendiz(aprendizSeleccionado, nuevoEstado) {
    if (!validarSesionAbierta()) return;

    const horaRegistro = obtenerHoraActualTexto();

    setAprendices((lista) =>
      lista.map((aprendiz) =>
        aprendiz.id === aprendizSeleccionado.id
          ? {
              ...aprendiz,
              estado: nuevoEstado,
              metodoRegistro: "Ajuste manual",
              horaRegistro,
              observacion:
                aprendiz.observacion ||
                (nuevoEstado === "Justificada"
                  ? "Justificación registrada por el instructor."
                  : "Novedad registrada por el instructor."),
            }
          : aprendiz
      )
    );

    mostrarMensajeAsistencia(
      `${aprendizSeleccionado.nombre}: ${nuevoEstado.toLowerCase()} registrado.`,
      "success"
    );
  }

  function cambiarEstadoManual(aprendizSeleccionado, nuevoEstado) {
    if (!validarSesionAbierta()) return;

    const horaRegistro = obtenerHoraActualTexto();

    setAprendices((lista) =>
      lista.map((aprendiz) =>
        aprendiz.id === aprendizSeleccionado.id
          ? {
              ...aprendiz,
              estado: nuevoEstado,
              metodoRegistro: "Ajuste manual",
              horaRegistro,
            }
          : aprendiz
      )
    );

    mostrarMensajeAsistencia(
      `${aprendizSeleccionado.nombre}: asistencia actualizada a ${nuevoEstado.toLowerCase()}.`,
      "success"
    );
  }

  function marcarPendientesComoAusentes() {
    if (!validarSesionAbierta()) return;

    const horaRegistro = obtenerHoraActualTexto();

    setAprendices((lista) =>
      lista.map((aprendiz) =>
        aprendiz.estado
          ? aprendiz
          : {
              ...aprendiz,
              estado: "Ausente",
              metodoRegistro: "Cierre automático",
              horaRegistro,
              observacion:
                aprendiz.observacion || "Sin registro biométrico al cierre.",
            }
      )
    );
  }

  function limpiarAsistencia() {
    if (!validarSesionAbierta()) return;

    setLecturasBiometricas([]);

    setAprendices((lista) =>
      lista.map((aprendiz) => ({
        ...aprendiz,
        estado: "",
        observacion: "",
        metodoRegistro: "",
        horaRegistro: "",
      }))
    );
  }

  function abrirModalObservacion(aprendiz) {
    setModalInasistencias(false);
    setModalDetalleAsistencia(false);
    setModalAsistenciaManual(false);
    setModalObservacion(aprendiz);
    setObservacionForm({
      ...observacionFormInicial,
      descripcion: aprendiz.observacion || "",
    });
    setObservacionError("");
  }

  function cerrarModalObservacion() {
    setModalObservacion(null);
    setObservacionForm(observacionFormInicial);
    setObservacionError("");
  }

  function guardarObservacion(e) {
    e.preventDefault();

    const descripcion = String(observacionForm.descripcion || "").trim();

    if (descripcion.length < LONGITUD_MINIMA_DESCRIPCION) {
      setObservacionError(
        `La descripción debe tener al menos ${LONGITUD_MINIMA_DESCRIPCION} caracteres.`
      );
      return;
    }

    const fecha = new Date();
    const nuevaObservacion = {
      id: `obs-${fecha.getTime()}`,
      aprendizId: modalObservacion.id_aprendiz || modalObservacion.id,
      aprendizNombre: modalObservacion.nombre,
      documento: modalObservacion.documento,
      grupoId: grupoActual?.idGrupo || grupoActual?.id,
      ficha: grupoActual.ficha,
      tipo: observacionForm.tipo,
      severidad: observacionForm.severidad,
      descripcion,
      fechaISO: obtenerFechaInput(fecha),
      fechaTexto: formatearFechaHora(fecha),
      instructor: obtenerInstructorActual(),
    };

    setObservaciones((actuales) => [nuevaObservacion, ...actuales]);
    setAprendices((lista) =>
      lista.map((aprendiz) =>
        aprendiz.id === modalObservacion.id
          ? {
              ...aprendiz,
              estado: aprendiz.estado || "Ausente",
              observacion: descripcion,
              metodoRegistro: aprendiz.metodoRegistro || "Ajuste manual",
              horaRegistro: aprendiz.horaRegistro || obtenerHoraActualTexto(fecha),
            }
          : aprendiz
      )
    );

    cerrarModalObservacion();
    mostrarMensajeAsistencia("Observación registrada correctamente.", "success");
  }

  function abrirModalAlerta(aprendiz) {
    const tipoSugerido =
      aprendiz.estado === "Ausente" || aprendiz.estado === "Tarde" || !aprendiz.estado
        ? "inasistencia"
        : "seguimiento";

    setModalInasistencias(false);
    setModalDetalleAsistencia(false);
    setModalAsistenciaManual(false);
    setModalAlerta(aprendiz);
    setAlertaForm({
      ...alertaFormInicial,
      tipo: tipoSugerido,
      severidad: aprendiz.estado === "Ausente" ? "Moderada" : "Leve",
      justificacion: aprendiz.observacion || "",
    });
    setAlertaError("");
  }

  function cerrarModalAlerta() {
    setModalAlerta(null);
    setAlertaForm({
      ...alertaFormInicial,
      tipo: "inasistencia",
      severidad: "Moderada",
      justificacion: "",
    });
    setAlertaError("");
  }

  async function crearAlertaManual(e) {
    e.preventDefault();

    const justificacion = String(
      alertaForm.justificacion || alertaForm.descripcion || ""
    ).trim();

    if (justificacion.length < LONGITUD_MINIMA_DESCRIPCION) {
      setAlertaError(
        `La justificación debe tener al menos ${LONGITUD_MINIMA_DESCRIPCION} caracteres.`
      );
      return;
    }

    const aprendiz = modalAlerta;
    const idAprendiz = aprendiz.id_aprendiz || aprendiz.id;
    const idGrupo = grupoActual?.idGrupo;
    const descripcion = `Tipo de alerta: ${alertaForm.tipo}. Justificación: ${justificacion}. Estado de asistencia: ${
      aprendiz.estado || "Sin marcar"
    }.`;

    if (aprendiz.fuente === "backend" && idAprendiz && idGrupo) {
      try {
        setAlertaEnviando(idAprendiz);

        const res = await fetch(`${API_URL}/alerts/manual`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            id_aprendiz: idAprendiz,
            id_grupo: idGrupo,
            tipo_alerta: alertaForm.tipo,
            justificacion,
            severidad: String(alertaForm.severidad || "MODERADA").toUpperCase(),
            descripcion,
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || "No fue posible crear la alerta"
          );
        }

        mostrarMensajeAsistencia("Alerta manual registrada.", "success");
      } catch (error) {
        setAlertaError(error.message || "No fue posible crear la alerta.");
        return;
      } finally {
        setAlertaEnviando(null);
      }
    } else {
      mostrarMensajeAsistencia(
        `Alerta manual registrada localmente para ${aprendiz.nombre}.`,
        "warning"
      );
    }

    setAprendices((lista) =>
      lista.map((item) =>
        item.id === aprendiz.id
          ? {
              ...item,
              estado: item.estado || "Ausente",
              observacion: justificacion,
              metodoRegistro: item.metodoRegistro || "Ajuste manual",
              horaRegistro: item.horaRegistro || obtenerHoraActualTexto(),
            }
          : item
      )
    );

    cerrarModalAlerta();
  }

  async function guardarAsistencia() {
    if (!validarSesionAbierta()) return;

    if (pendientes > 0) {
      mostrarMensajeAsistencia(
        `Hay ${pendientes} aprendiz${pendientes === 1 ? "" : "ces"} sin marcar.`,
        "warning"
      );
      setModalInasistencias(true);
      return;
    }

    const registros = aprendices.map((aprendiz) => ({
      id_aprendiz: aprendiz.id_aprendiz || aprendiz.id,
      nombre: aprendiz.nombre,
      documento: aprendiz.documento,
      estado: aprendiz.estado,
      metodo_registro: obtenerMetodoRegistro(aprendiz),
      hora_registro: aprendiz.horaRegistro || "",
      observacion: aprendiz.observacion || "",
    }));

    const payload = {
      id_grupo: grupoActual?.idGrupo || grupoActual?.id,
      ficha: grupoActual.ficha,
      fecha: fechaSesion,
      jornada,
      horario_id: horarioSeleccionado?.id || "",
      sesion: etiquetaSesion,
      resumen: {
        total,
        presentes,
        ausentes,
        tardes: tarde,
        justificadas,
        porcentaje,
      },
      registros,
      lecturas_biometricas: lecturasBiometricas,
    };

    let guardadoBackend = false;

    if (grupoActual?.fuente === "backend") {
      try {
        const res = await fetch(`${API_URL}/attendance`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(
            data?.message || data?.error || "No fue posible guardar asistencia"
          );
        }

        guardadoBackend = true;
      } catch (error) {
        console.warn("Asistencia guardada solo en local:", error);
      }
    }

    mostrarMensajeAsistencia(
      guardadoBackend
        ? "Asistencia guardada correctamente."
        : "Asistencia guardada localmente.",
      guardadoBackend ? "success" : "warning"
    );
  }

  return {
    grupoActual,
    porcentaje,
    presentes,
    total,
    mensajeAsistencia,
    cargandoGrupos,
    grupoSeleccionado,
    gruposDisponibles,
    fechaSesion,
    jornada,
    horarioSeleccionado,
    horariosFechaSeleccionada,
    estadoHorario,
    etiquetaSesion,
    fechaHoraActual,
    asistenciaHabilitada,
    proximoAprendizBiometria,
    registrosBiometricos,
    ajustesManuales,
    ausentes,
    tarde,
    justificadas,
    pendientes,
    aprendices,
    modalInasistencias,
    modalDetalleAsistencia,
    modalAsistenciaManual,
    aprendicesRegistrados,
    aprendicesPendientes,
    alertaEnviando,
    modalObservacion,
    observacionForm,
    observacionError,
    modalAlerta,
    alertaForm,
    alertaError,
    longitudMinimaDescripcion: LONGITUD_MINIMA_DESCRIPCION,
    seleccionarGrupo,
    cambiarFechaSesion,
    cambiarJornada,
    cambiarHorarioSeleccionado,
    registrarHuellaBiometrica,
    abrirModalInasistencias,
    cerrarModalInasistencias,
    abrirModalDetalleAsistencia,
    cerrarModalDetalleAsistencia,
    abrirModalAsistenciaManual,
    cerrarModalAsistenciaManual,
    aplicarNovedadAprendiz,
    cambiarEstadoManual,
    abrirModalObservacion,
    cerrarModalObservacion,
    guardarObservacion,
    setObservacionForm,
    abrirModalAlerta,
    cerrarModalAlerta,
    crearAlertaManual,
    setAlertaForm,
    limpiarAsistencia,
    marcarPendientesComoAusentes,
    guardarAsistencia,
  };
}
