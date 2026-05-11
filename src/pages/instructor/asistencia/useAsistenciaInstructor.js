import { useCallback, useEffect, useMemo, useState } from "react";

import {
  aprendicesIniciales,
  gruposSimulados,
  observacionesIniciales,
  sesionesIniciales,
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
  normalizarTexto,
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
const FUENTE_GRUPO_PRUEBA = "prueba";
const STORAGE_SESIONES = "asistencia_sesiones";
const GRUPO_SIN_ASIGNACION = {
  id: "",
  idGrupo: "",
  ficha: "Sin ficha",
  programa: "No tienes grupos asignados para asistencia",
  jornada: "Mañana",
  rolInstructor: "",
  horarios: [],
  fuente: "sin-acceso",
};

function obtenerUsuarioGuardado() {
  try {
    const usuario = localStorage.getItem("user_data");
    return usuario ? JSON.parse(usuario) || {} : {};
  } catch (error) {
    console.warn("No fue posible leer los datos del usuario:", error);
    return {};
  }
}

function normalizarClave(valor) {
  return String(valor || "").trim();
}

function normalizarListaClaves(valor) {
  const lista = Array.isArray(valor)
    ? valor
    : String(valor || "")
        .split(/[,\s|/]+/)
        .filter(Boolean);

  return lista.map(normalizarClave).filter(Boolean);
}

function obtenerPerfilInstructorActual() {
  const usuario = obtenerUsuarioGuardado();
  const persona = usuario.persona || {};
  const infoRol = usuario.informacion_rol || {};
  const nombrePersona = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();

  const ids = normalizarListaClaves([
    localStorage.getItem("id_instructor"),
    localStorage.getItem("id_usuario"),
    localStorage.getItem("user_id"),
    usuario.id_instructor,
    usuario.idInstructor,
    usuario.id_usuario,
    usuario.id,
    usuario.instructor?.id_instructor,
    usuario.instructor?.id,
  ]);

  const documentos = normalizarListaClaves([
    localStorage.getItem("user_documento"),
    persona.numero_documento,
    usuario.numero_documento,
    usuario.documento,
  ]);

  const nombres = [
    obtenerInstructorActual(),
    nombrePersona,
    usuario.nombre_completo,
    usuario.nombre,
    usuario.username,
    usuario.email,
  ]
    .map(normalizarTexto)
    .filter(Boolean);

  const fichasActivas = [
    ...normalizarListaClaves(infoRol.fichas_activas),
    ...normalizarListaClaves(infoRol.fichas_asignadas),
  ];
  const fichasLideradas = normalizarListaClaves(infoRol.fichas_lideradas || []);
  const textoRol = normalizarTexto(
    [
      localStorage.getItem("tipoInstructor"),
      localStorage.getItem("tipo_instructor"),
      localStorage.getItem("rol_asistencia"),
      localStorage.getItem("rol"),
      usuario.tipo_instructor,
      usuario.tipoInstructor,
      usuario.rol,
      infoRol.tipo_instructor,
      infoRol.tipoInstructor,
    ]
      .filter(Boolean)
      .join(" ")
  );

  return {
    ids: [...new Set(ids)],
    documentos: [...new Set(documentos)],
    nombres: [...new Set(nombres)],
    fichasActivas: [...new Set(fichasActivas)],
    fichasLideradas: [...new Set(fichasLideradas)],
    esLiderGlobal:
      textoRol.includes("lider") ||
      textoRol.includes("líder") ||
      textoRol.includes("lead"),
  };
}

function obtenerInstructorActual() {
  return (
    localStorage.getItem("username") ||
    localStorage.getItem("usuario") ||
    localStorage.getItem("nombre_usuario") ||
    "Franco Reina"
  );
}

function obtenerInstructorIdActual() {
  return (
    localStorage.getItem("id_instructor") ||
    localStorage.getItem("id_usuario") ||
    localStorage.getItem("user_id") ||
    normalizarTexto(obtenerInstructorActual()).replace(/\s+/g, "-")
  );
}

function obtenerClavesGrupo(grupo) {
  return [
    grupo?.idGrupo,
    grupo?.id_grupo,
    grupo?.id,
    grupo?.grupoId,
    grupo?.ficha,
    grupo?.numero_ficha,
  ]
    .map(normalizarClave)
    .filter(Boolean);
}

function referenciaCoincideConInstructor(referencia, perfilInstructor) {
  if (!referencia) return false;

  const id = normalizarClave(referencia.id || referencia.id_instructor);
  const documento = normalizarClave(
    referencia.documento || referencia.numero_documento
  );
  const nombre = normalizarTexto(referencia.nombre || referencia.nombre_completo);

  return (
    (id && perfilInstructor.ids.includes(id)) ||
    (documento && perfilInstructor.documentos.includes(documento)) ||
    (nombre && perfilInstructor.nombres.includes(nombre))
  );
}

function grupoAsignadoAInstructor(grupo, perfilInstructor) {
  const clavesGrupo = obtenerClavesGrupo(grupo);
  const fichasPermitidas = [
    ...perfilInstructor.fichasActivas,
    ...perfilInstructor.fichasLideradas,
  ];

  if (
    fichasPermitidas.length &&
    clavesGrupo.some((clave) => fichasPermitidas.includes(clave))
  ) {
    return true;
  }

  const referencias = [
    {
      id: grupo?.instructorId,
      documento: grupo?.instructorDocumento,
      nombre: grupo?.instructorNombre,
    },
    ...(Array.isArray(grupo?.instructores) ? grupo.instructores : []),
  ];

  return referencias.some((referencia) =>
    referenciaCoincideConInstructor(referencia, perfilInstructor)
  );
}

function instructorPuedeVerTodo(perfilInstructor) {
  return (
    perfilInstructor.esLiderGlobal || perfilInstructor.fichasLideradas.length > 0
  );
}

function instructorPuedeGestionarGrupo(grupo, perfilInstructor, esInstructorLider) {
  if (!grupo?.id || grupo?.fuente === "sin-acceso") return false;
  if (grupo.fuente === FUENTE_GRUPO_PRUEBA) return MODO_PRUEBA_ASISTENCIA;
  if (esInstructorLider) return true;

  return grupoAsignadoAInstructor(grupo, perfilInstructor);
}

function filtrarGruposPorInstructor(grupos, perfilInstructor, esInstructorLider) {
  if (esInstructorLider) return grupos;

  return grupos.filter((grupo) => grupoAsignadoAInstructor(grupo, perfilInstructor));
}

function obtenerGruposDePrueba() {
  return gruposSimulados.map((grupo) => ({
    ...grupo,
    fuente: FUENTE_GRUPO_PRUEBA,
  }));
}

function resolverGruposParaAsistencia(grupos, perfilInstructor, esInstructorLider) {
  const gruposPermitidos = filtrarGruposPorInstructor(
    grupos,
    perfilInstructor,
    esInstructorLider
  );

  if (gruposPermitidos.length || !MODO_PRUEBA_ASISTENCIA) {
    return {
      grupos: gruposPermitidos,
      modoPrueba: false,
    };
  }

  return {
    grupos: obtenerGruposDePrueba(),
    modoPrueba: true,
  };
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

function cargarSesionesLocales() {
  try {
    const guardadas = localStorage.getItem(STORAGE_SESIONES);
    const lista = guardadas ? JSON.parse(guardadas) : null;
    return Array.isArray(lista) ? lista : sesionesIniciales;
  } catch (error) {
    console.warn("No fue posible cargar sesiones locales:", error);
    return sesionesIniciales;
  }
}

function limpiarRegistroAprendiz(aprendiz) {
  return {
    ...aprendiz,
    estado: "",
    observacion: "",
    metodoRegistro: "",
    horaRegistro: "",
  };
}

function limpiarSegmentoSesion(valor) {
  return String(valor || "sin-dato")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function crearIdSesion(grupo, fechaSesion, horario) {
  return [
    "sesion",
    limpiarSegmentoSesion(grupo?.idGrupo || grupo?.id || grupo?.ficha),
    limpiarSegmentoSesion(fechaSesion),
    limpiarSegmentoSesion(horario?.id || horario?.nombre || "sin-horario"),
  ].join("-");
}

function obtenerEstadoSesion(estadoHorario) {
  if (estadoHorario.abierta) return "Abierta";
  if (estadoHorario.estado === "programada") return "Programada";
  return "Cerrada";
}

function contarRegistrosPorMetodo(registros, metodoBuscado) {
  return registros.filter((registro) =>
    normalizarTexto(registro.metodoRegistro || registro.metodo_registro).includes(
      metodoBuscado
    )
  ).length;
}

function calcularMetricasSesiones(sesiones) {
  const totales = sesiones.reduce(
    (acumulado, sesion) => {
      const registros = Array.isArray(sesion.registros) ? sesion.registros : [];
      const resumen = sesion.resumen || {};

      const presentes =
        Number(resumen.presentes) ||
        registros.filter((registro) =>
          ["Asistió", "Tarde"].includes(registro.estado)
        ).length;

      const ausentes =
        Number(resumen.ausentes) ||
        registros.filter((registro) => registro.estado === "Ausente").length;

      const tardes =
        Number(resumen.tardes) ||
        registros.filter((registro) => registro.estado === "Tarde").length;

      const justificadas =
        Number(resumen.justificadas) ||
        registros.filter((registro) => registro.estado === "Justificada").length;

      const total = Number(resumen.total) || registros.length;

      return {
        totalSesiones: acumulado.totalSesiones + 1,
        totalAprendices: acumulado.totalAprendices + total,
        presentes: acumulado.presentes + presentes,
        ausentes: acumulado.ausentes + ausentes,
        tardes: acumulado.tardes + tardes,
        justificadas: acumulado.justificadas + justificadas,
        huellas:
          acumulado.huellas +
          (Number(resumen.biometricos) || contarRegistrosPorMetodo(registros, "huella")),
        qr:
          acumulado.qr +
          (Number(resumen.qr) || contarRegistrosPorMetodo(registros, "qr")),
      };
    },
    {
      totalSesiones: 0,
      totalAprendices: 0,
      presentes: 0,
      ausentes: 0,
      tardes: 0,
      justificadas: 0,
      huellas: 0,
      qr: 0,
    }
  );

  return {
    ...totales,
    promedio:
      totales.totalAprendices > 0
        ? Math.round((totales.presentes / totales.totalAprendices) * 100)
        : 0,
  };
}

export function useAsistenciaInstructor() {
  const [gruposDisponibles, setGruposDisponibles] = useState([
    GRUPO_SIN_ASIGNACION,
  ]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("");
  const [fechaSesion, setFechaSesion] = useState(() => obtenerFechaInput());
  const [jornada, setJornada] = useState("Mañana");
  const [horarioSeleccionadoId, setHorarioSeleccionadoId] = useState("");
  const [fechaHoraActual, setFechaHoraActual] = useState(() => new Date());
  const [sesionesGuardadas, setSesionesGuardadas] = useState(cargarSesionesLocales);
  const [qrSesion, setQrSesion] = useState(null);

  const [aprendices, setAprendices] = useState([]);
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
  const [modalSesionDetalle, setModalSesionDetalle] = useState(null);

  const instructorActual = useMemo(() => obtenerInstructorActual(), []);
  const instructorIdActual = useMemo(() => obtenerInstructorIdActual(), []);
  const perfilInstructor = useMemo(() => obtenerPerfilInstructorActual(), []);
  const esInstructorLider = useMemo(
    () => instructorPuedeVerTodo(perfilInstructor),
    [perfilInstructor]
  );

  const grupoActual =
    gruposDisponibles.find((grupo) => grupo.id === grupoSeleccionado) ||
    gruposDisponibles[0] ||
    GRUPO_SIN_ASIGNACION;

  const grupoActualPermitido = instructorPuedeGestionarGrupo(
    grupoActual,
    perfilInstructor,
    esInstructorLider
  );

  const aplicarGruposPermitidos = useCallback((grupos, modoPrueba = false) => {
    const primerGrupo = grupos[0];

    if (!primerGrupo) {
      setGruposDisponibles([GRUPO_SIN_ASIGNACION]);
      setGrupoSeleccionado("");
      setJornada("Mañana");
      setAprendices([]);
      mostrarMensajeAsistencia(
        "No tienes grupos asignados para tomar asistencia.",
        "warning"
      );
      return;
    }

    setGruposDisponibles(grupos);
    setGrupoSeleccionado(primerGrupo.id);
    setJornada(primerGrupo.jornada || "Mañana");
    setAprendices([]);
    setMensajeAsistencia(
      modoPrueba
        ? {
            texto:
              "Modo prueba activo: usando grupos simulados para validar asistencia.",
            tipo: "warning",
          }
        : null
    );
  }, []);

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
    localStorage.setItem(STORAGE_SESIONES, JSON.stringify(sesionesGuardadas));
  }, [sesionesGuardadas]);

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
        const gruposAsistencia = resolverGruposParaAsistencia(
          gruposBackend,
          perfilInstructor,
          esInstructorLider
        );

        if (!activo) return;

        aplicarGruposPermitidos(
          gruposAsistencia.grupos,
          gruposAsistencia.modoPrueba
        );
      } catch (error) {
        console.warn("Asistencia en modo local:", error);

        if (!activo) return;

        const gruposAsistencia = resolverGruposParaAsistencia(
          gruposSimulados,
          perfilInstructor,
          esInstructorLider
        );

        aplicarGruposPermitidos(
          gruposAsistencia.grupos,
          gruposAsistencia.modoPrueba
        );
      } finally {
        if (activo) setCargandoGrupos(false);
      }
    }

    cargarGruposReales();

    return () => {
      activo = false;
    };
  }, [aplicarGruposPermitidos, esInstructorLider, perfilInstructor]);

  useEffect(() => {
    let activo = true;
    const idGrupo = grupoActual?.idGrupo;

    if (!grupoActualPermitido) {
      const timeout = window.setTimeout(() => {
        if (activo) setAprendices([]);
      }, 0);

      return () => {
        activo = false;
        window.clearTimeout(timeout);
      };
    }

    if (!idGrupo) {
      const timeout = window.setTimeout(() => {
        if (activo) {
          setAprendices(grupoActual?.id ? aprendicesIniciales : []);
        }
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
  }, [grupoActual?.id, grupoActual?.idGrupo, grupoActualPermitido]);

  const horariosGrupoActual = useMemo(
    () =>
      grupoActualPermitido ? obtenerHorariosGrupo(grupoActual, jornada) : [],
    [grupoActual, grupoActualPermitido, jornada]
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
    grupoActualPermitido &&
    (estadoHorario.abierta || MODO_PRUEBA_ASISTENCIA) &&
    !cargandoAprendices;

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
  const registrosQr = aprendices.filter(
    (aprendiz) => obtenerMetodoRegistro(aprendiz) === "Código QR"
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

  const sesionActual = useMemo(() => {
    const idGrupo = grupoActual?.idGrupo || grupoActual?.id || grupoActual?.ficha;
    const id = crearIdSesion(grupoActual, fechaSesion, horarioSeleccionado);
    const horarioTexto = horarioSeleccionado
      ? `${formatearHora(horarioSeleccionado.inicio)} - ${formatearHora(
          horarioSeleccionado.fin
        )}`
      : "Sin horario";

    const registros = aprendices.map((aprendiz) => ({
      id_aprendiz: aprendiz.id_aprendiz || aprendiz.id,
      nombre: aprendiz.nombre,
      documento: aprendiz.documento,
      estado: aprendiz.estado || "Sin marcar",
      metodoRegistro: obtenerMetodoRegistro(aprendiz),
      metodo_registro: obtenerMetodoRegistro(aprendiz),
      horaRegistro: aprendiz.horaRegistro || "",
      hora_registro: aprendiz.horaRegistro || "",
      observacion: aprendiz.observacion || "",
    }));

    return {
      id,
      codigo: `SES-${grupoActual?.ficha || "SF"}-${fechaSesion.replaceAll(
        "-",
        ""
      )}`,
      idGrupo,
      ficha: grupoActual.ficha,
      programa: grupoActual.programa,
      fecha: fechaSesion,
      jornada,
      horarioId: horarioSeleccionado?.id || "",
      nombre: horarioSeleccionado?.nombre || etiquetaSesion,
      horarioTexto,
      ambiente: horarioSeleccionado?.ambiente || "Ambiente por asignar",
      instructor: instructorActual,
      instructorId: instructorIdActual,
      estado: obtenerEstadoSesion(estadoHorario),
      estadoTecnico: estadoHorario.estado,
      qr: qrSesion?.sesionId === id ? qrSesion : null,
      resumen: {
        total,
        presentes,
        ausentes,
        tardes: tarde,
        justificadas,
        pendientes,
        porcentaje,
        biometricos: registrosBiometricos,
        manuales: ajustesManuales,
        qr: registrosQr,
      },
      registros,
      lecturasBiometricas,
    };
  }, [
    ajustesManuales,
    aprendices,
    ausentes,
    estadoHorario,
    etiquetaSesion,
    fechaSesion,
    grupoActual,
    instructorActual,
    instructorIdActual,
    jornada,
    justificadas,
    lecturasBiometricas,
    pendientes,
    porcentaje,
    presentes,
    qrSesion,
    registrosBiometricos,
    registrosQr,
    horarioSeleccionado,
    tarde,
    total,
  ]);

  const sesionesVisibles = useMemo(() => {
    const ordenarSesiones = (sesiones) =>
      [...sesiones].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

    if (esInstructorLider) return ordenarSesiones(sesionesGuardadas);
    if (!grupoActualPermitido) return [];

    const clavesGrupo = obtenerClavesGrupo(grupoActual);

    return ordenarSesiones(
      sesionesGuardadas
      .filter((sesion) => {
        const clavesSesion = [
          sesion.idGrupo,
          sesion.id_grupo,
          sesion.grupoId,
          sesion.ficha,
        ]
          .filter(Boolean)
          .map(String);

        return clavesSesion.some((clave) => clavesGrupo.includes(clave));
      })
      .filter((sesion) => {
        return (
          String(sesion.instructorId || "") === String(instructorIdActual) ||
          normalizarTexto(sesion.instructor) === normalizarTexto(instructorActual)
        );
      })
    );
  }, [
    esInstructorLider,
    grupoActual,
    grupoActualPermitido,
    instructorActual,
    instructorIdActual,
    sesionesGuardadas,
  ]);

  const metricasSesiones = useMemo(
    () => calcularMetricasSesiones(sesionesVisibles),
    [sesionesVisibles]
  );

  const alcanceSesiones = esInstructorLider
    ? "Instructor lider: ves todas las sesiones disponibles."
    : grupoActualPermitido
    ? "Instructor asignado: ves las sesiones donde figuras como encargado."
    : "Sin grupos asignados para este instructor.";

  function validarGrupoPermitido() {
    if (grupoActualPermitido) return true;

    mostrarMensajeAsistencia(
      "No puedes gestionar asistencia de un grupo que no tienes asignado.",
      "warning"
    );
    return false;
  }

  function validarSesionAbierta() {
    if (!validarGrupoPermitido()) return false;
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
    setQrSesion(null);
    setMensajeAsistencia(null);
    setAprendices((lista) => lista.map(limpiarRegistroAprendiz));
  }

  function seleccionarGrupo(idGrupo) {
    const nuevoGrupo = gruposDisponibles.find((grupo) => grupo.id === idGrupo);

    if (
      !nuevoGrupo ||
      !instructorPuedeGestionarGrupo(
        nuevoGrupo,
        perfilInstructor,
        esInstructorLider
      )
    ) {
      mostrarMensajeAsistencia(
        "No puedes abrir un grupo que no tienes asignado.",
        "warning"
      );
      return;
    }

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
    setQrSesion(null);
    setMensajeAsistencia(null);
    setAprendices((lista) => lista.map(limpiarRegistroAprendiz));
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

  function abrirDetalleSesionGuardada(sesion) {
    setModalSesionDetalle(sesion);
  }

  function cerrarDetalleSesionGuardada() {
    setModalSesionDetalle(null);
  }

  function generarQrSesion() {
    if (!validarSesionAbierta()) return;

    const fecha = new Date();
    const codigo = `${sesionActual.codigo}-${fecha
      .getTime()
      .toString(36)
      .toUpperCase()}`;

    setQrSesion({
      sesionId: sesionActual.id,
      codigo,
      generadoEn: obtenerHoraActualTexto(fecha),
      venceEn: horarioSeleccionado?.fin
        ? formatearHora(horarioSeleccionado.fin)
        : "Cierre de la sesión",
    });

    mostrarMensajeAsistencia("QR generado para la sesión actual.", "success");
  }

  function registrarQrSesion() {
    if (!validarSesionAbierta()) return;

    if (!qrSesion || qrSesion.sesionId !== sesionActual.id) {
      mostrarMensajeAsistencia("Primero genera el QR de esta sesión.", "warning");
      return;
    }

    const aprendiz = proximoAprendizBiometria;

    if (!aprendiz) {
      alert("Todos los aprendices ya tienen registro para esta sesión.");
      return;
    }

    const fechaRegistro = new Date();
    const horaRegistro = obtenerHoraActualTexto(fechaRegistro);
    const estadoQr = obtenerEstadoPorHuella(
      horarioSeleccionado,
      fechaRegistro,
      MINUTOS_TOLERANCIA_TARDE
    );

    setAprendices((lista) =>
      lista.map((item) =>
        item.id === aprendiz.id
          ? {
              ...item,
              estado: estadoQr,
              metodoRegistro: "Código QR",
              horaRegistro,
              observacion:
                estadoQr === "Tarde"
                  ? `QR validado después de ${MINUTOS_TOLERANCIA_TARDE} minutos de tolerancia.`
                  : item.observacion,
            }
          : item
      )
    );

    mostrarMensajeAsistencia(
      `${aprendiz.nombre}: asistencia registrada por QR.`,
      "success"
    );
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
    if (!validarGrupoPermitido()) return;

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

    if (!validarGrupoPermitido()) return;

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
    if (!validarGrupoPermitido()) return;

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

  function registrarAlertaCreada(aprendiz, resultado) {
    if (!validarGrupoPermitido()) return;

    const justificacion =
      resultado?.payload?.descripcion ||
      alertaForm.justificacion ||
      alertaForm.descripcion ||
      "Alerta manual registrada por el instructor.";

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

    mostrarMensajeAsistencia(
      `Alerta manual registrada para ${aprendiz.nombre}.`,
      "success"
    );
  }

  async function crearAlertaManual(e) {
    e.preventDefault();

    if (!validarGrupoPermitido()) return;

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
      id_sesion: sesionActual.id,
      sesion: etiquetaSesion,
      sesion_contexto: {
        ...sesionActual,
        guardadaEn: formatearFechaHora(new Date()),
      },
      resumen: {
        total,
        presentes,
        ausentes,
        tardes: tarde,
        justificadas,
        porcentaje,
        biometricos: registrosBiometricos,
        manuales: ajustesManuales,
        qr: registrosQr,
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

    const sesionGuardada = {
      ...sesionActual,
      guardadaEn: formatearFechaHora(new Date()),
    };

    setSesionesGuardadas((actuales) => [
      sesionGuardada,
      ...actuales.filter((sesion) => sesion.id !== sesionGuardada.id),
    ]);

    mostrarMensajeAsistencia(
      guardadoBackend
        ? "Asistencia guardada correctamente."
        : "Asistencia guardada localmente.",
      guardadoBackend ? "success" : "warning"
    );
  }

  return {
    grupoActual,
    sesionActual,
    sesionesVisibles,
    metricasSesiones,
    alcanceSesiones,
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
    registrosQr,
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
    modalSesionDetalle,
    qrSesion,
    longitudMinimaDescripcion: LONGITUD_MINIMA_DESCRIPCION,
    seleccionarGrupo,
    cambiarFechaSesion,
    cambiarJornada,
    cambiarHorarioSeleccionado,
    generarQrSesion,
    registrarQrSesion,
    registrarHuellaBiometrica,
    abrirModalInasistencias,
    cerrarModalInasistencias,
    abrirModalDetalleAsistencia,
    cerrarModalDetalleAsistencia,
    abrirModalAsistenciaManual,
    cerrarModalAsistenciaManual,
    abrirDetalleSesionGuardada,
    cerrarDetalleSesionGuardada,
    aplicarNovedadAprendiz,
    cambiarEstadoManual,
    abrirModalObservacion,
    cerrarModalObservacion,
    guardarObservacion,
    setObservacionForm,
    abrirModalAlerta,
    cerrarModalAlerta,
    crearAlertaManual,
    registrarAlertaCreada,
    setAlertaForm,
    limpiarAsistencia,
    marcarPendientesComoAusentes,
    guardarAsistencia,
  };
}
