import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  PencilLine,
  UsersRound
} from "lucide-react";
import "../coordinador/coordinador.css";
import "./instructor.css";
import SesionActivaModal from "./asistencia/components/SesionActivaModal";

const obtenerNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string") return Number.parseFloat(valor.replace("%", "")) || 0;
  return 0;
};

const calcularProgreso = (valor, maximo) => {
  const numero = obtenerNumero(valor);
  if (!numero || !maximo) return 0;
  return Math.min(100, Math.max(0, Math.round((numero / maximo) * 100)));
};

const coloresBarras = ["verde", "azul", "morado"];
const coloresRiesgo = ["#ef4444", "#f5b400", "#f5b400"];

const nombresRiesgo = {
  INASISTENCIA: "Inasistencia",
  ASISTENCIAL: "Asistencial",
  OBSERVACIONES_RECURRENTES: "Observaciones recurrentes",
  CONVIVENCIAL: "Convivencial",
  MANUAL: "Manual"
};

const formatearFechaISO = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const inicioMesActual = (fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  return formatearFechaISO(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
};

const finMesActual = (fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  return formatearFechaISO(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0));
};

const inicioSemanaActual = (fechaBase = new Date()) => {
  const fecha = new Date(fechaBase);
  const dia = fecha.getDay() || 7;
  fecha.setDate(fecha.getDate() - dia + 1);
  return formatearFechaISO(fecha);
};

const finSemanaActual = (fechaBase = new Date()) => {
  const fecha = new Date(`${inicioSemanaActual(fechaBase)}T12:00:00`);
  fecha.setDate(fecha.getDate() + 4);
  return formatearFechaISO(fecha);
};

const formatearFechaCorta = (fechaISO) => {
  if (!fechaISO) return "";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "";
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
};

const normalizarHora = (valor) => String(valor || "").slice(0, 5) || "--:--";

const getHeaders = () => {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;
  return headers;
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: getHeaders() });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || data?.error || "No fue posible cargar la informacion");
  return data?.data ?? data;
}

const extraerGrupos = (data) => {
  const grupos = data?.grupos || data?.fichas || data?.results || data;
  return Array.isArray(grupos) ? grupos : [];
};

const extraerAlertas = (data) => {
  const alertas = data?.alerts || data?.alertas || data?.data || data?.results || data;
  return Array.isArray(alertas) ? alertas : [];
};

const extraerSesiones = (data) => {
  const sesiones = data?.sesiones || data?.data?.sesiones || data?.results || data;
  return Array.isArray(sesiones) ? sesiones : [];
};

const extraerHorarios = (data) => {
  const horarios =
    data?.horarios ||
    data?.horario ||
    data?.schedule ||
    data?.schedules ||
    data?.sesiones ||
    data?.results ||
    data;
  return Array.isArray(horarios) ? horarios : [];
};

const extraerAsignacionesInstructor = (data) => {
  const asignaciones = data?.data || data?.instructores || data?.items || data?.results || data;
  return Array.isArray(asignaciones) ? asignaciones : [];
};

const extraerAsistencias = (data) => {
  const asistencias = data?.asistencias || data?.data?.asistencias || data?.results || data;
  return Array.isArray(asistencias) ? asistencias : [];
};

const obtenerPrograma = (grupo) => grupo.programa_formacion?.nombre_programa || grupo.programa || "Sin programa";
const obtenerCodigo = (grupo) => grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || "Sin ficha";
const obtenerIdSesion = (sesion) => sesion.id_sesion_formacion || sesion.id;
const obtenerIdGrupoSesion = (sesion) => sesion.id_grupo || sesion.grupo?.id_grupo;
const obtenerFechaSesion = (sesion) => {
  const valor = String(sesion.fecha_clase || sesion.fecha || sesion.fecha_sesion || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "";
};
const normalizarDiaSemana = (valor) => {
  const texto = String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const equivalencias = {
    "1": "lunes",
    "2": "martes",
    "3": "miercoles",
    "4": "jueves",
    "5": "viernes",
    lunes: "lunes",
    martes: "martes",
    miercoles: "miercoles",
    jueves: "jueves",
    viernes: "viernes"
  };
  return equivalencias[texto] || "";
};
const obtenerDiaSemanaSesion = (sesion) =>
  normalizarDiaSemana(
    sesion.dia_semana ||
    sesion.nombre_dia ||
    sesion.dia_nombre ||
    sesion.dia ||
    sesion.numero_dia ||
    sesion.bloque_jornada?.dia_semana ||
    sesion.horario?.dia_semana ||
    sesion.horario?.dia
  );
const obtenerFichaSesion = (sesion) => sesion.grupo?.numero_ficha || sesion.numero_ficha || sesion.id_grupo || "Sin ficha";
const obtenerCompetenciaSesion = (sesion) =>
  sesion.competencia?.nombre_competencia ||
  sesion.competencia?.nombre ||
  sesion.clase_competencia?.competencia?.nombre_competencia ||
  sesion.clase_competencia?.nombre_competencia ||
  sesion.nombre_competencia ||
  sesion.bloque_jornada?.nombre_bloque ||
  "Sesion de formacion";
const obtenerAmbienteSesion = (sesion) =>
  sesion.ambiente?.nombre_ambiente ||
  sesion.ambiente?.nombre ||
  sesion.nombre_ambiente ||
  "Ambiente asignado";
const obtenerHoraInicioSesion = (sesion) =>
  sesion.hora_inicio_programada || sesion.hora_inicio || sesion.horaInicio || sesion.inicio || sesion.bloque_jornada?.hora_inicio || "";
const obtenerHoraFinSesion = (sesion) =>
  sesion.hora_fin_programada || sesion.hora_fin || sesion.horaFin || sesion.fin || sesion.bloque_jornada?.hora_fin || "";
const BLOQUES_MANANA_DASHBOARD = [
  { inicio: "07:00", fin: "09:30" },
  { inicio: "10:00", fin: "12:30" }
];
const obtenerHorasBloqueDashboard = (sesion, index, sesionesDia = []) => {
  const inicio = normalizarHora(obtenerHoraInicioSesion(sesion));
  const fin = normalizarHora(obtenerHoraFinSesion(sesion));
  const sesionesVisibles = sesionesDia.slice(0, 2);
  const horaBase = normalizarHora(obtenerHoraInicioSesion(sesionesVisibles[0]));
  const horasRepetidas =
    sesionesVisibles.length > 1 &&
    horaBase !== "--:--" &&
    sesionesVisibles.every((item) => normalizarHora(obtenerHoraInicioSesion(item)) === horaBase);

  if (horasRepetidas && horaBase === "07:00" && index < BLOQUES_MANANA_DASHBOARD.length) {
    return BLOQUES_MANANA_DASHBOARD[index];
  }

  return { inicio, fin };
};
const agregarValor = (set, valor) => {
  if (valor !== null && valor !== undefined && valor !== "") set.add(String(valor));
};
const leerUsuarioActual = () => {
  try {
    return JSON.parse(localStorage.getItem("user_data") || "{}") || {};
  } catch {
    return {};
  }
};
const obtenerIdentidadInstructorActual = () => {
  const usuario = leerUsuarioActual();
  const persona = usuario.persona || {};
  const instructor = usuario.instructor || usuario.informacion_rol?.instructor || {};
  const idsInstructor = new Set();
  const idsUsuario = new Set();
  const documentos = new Set();
  const emails = new Set();

  [
    localStorage.getItem("id_instructor"),
    usuario.id_instructor,
    instructor.id_instructor,
    usuario.informacion_rol?.id_instructor
  ].forEach((valor) => agregarValor(idsInstructor, valor));

  [usuario.id_usuario, usuario.id, instructor.usuario?.id_usuario].forEach((valor) => agregarValor(idsUsuario, valor));
  [persona.numero_documento, usuario.numero_documento, localStorage.getItem("user_documento")].forEach((valor) => agregarValor(documentos, valor));
  [usuario.email, instructor.usuario?.email, localStorage.getItem("user_email")].forEach((valor) => agregarValor(emails, valor));

  return { idsInstructor, idsUsuario, documentos, emails };
};
const itemPerteneceInstructorActual = (item, identidad = obtenerIdentidadInstructorActual()) => {
  const persona = item?.usuario?.persona || item?.persona || item?.instructor?.usuario?.persona || item?.instructor_grupo?.instructor?.usuario?.persona || {};
  const idsInstructor = [
    item?.id_instructor,
    item?.instructor?.id_instructor,
    item?.instructor_grupo?.id_instructor,
    item?.instructor_grupo?.instructor?.id_instructor
  ].filter(Boolean).map(String);
  const idsUsuario = [
    item?.id_usuario,
    item?.usuario?.id_usuario,
    item?.instructor?.usuario?.id_usuario,
    item?.instructor_grupo?.instructor?.usuario?.id_usuario
  ].filter(Boolean).map(String);
  const documentos = [
    item?.numero_documento,
    persona?.numero_documento
  ].filter(Boolean).map(String);
  const emails = [
    item?.email,
    item?.usuario?.email,
    item?.instructor?.usuario?.email,
    item?.instructor_grupo?.instructor?.usuario?.email
  ].filter(Boolean).map(String);

  return (
    idsInstructor.some((valor) => identidad.idsInstructor.has(valor)) ||
    idsUsuario.some((valor) => identidad.idsUsuario.has(valor)) ||
    documentos.some((valor) => identidad.documentos.has(valor)) ||
    emails.some((valor) => identidad.emails.has(valor))
  );
};
const obtenerIdsAsignacionInstructorActual = (asignaciones = [], identidad = obtenerIdentidadInstructorActual()) => {
  return new Set(
    asignaciones
      .filter((item) => itemPerteneceInstructorActual(item, identidad))
      .map((item) => item.id_instructor_grupo)
      .filter(Boolean)
      .map(String)
  );
};
const horarioPerteneceInstructorActual = (horario, idsAsignacionActual, identidad = obtenerIdentidadInstructorActual()) => {
  const idAsignacion = horario.id_instructor_grupo || horario.instructor_grupo?.id_instructor_grupo;
  if (idAsignacion) return idsAsignacionActual.has(String(idAsignacion));

  const tieneInstructor =
    horario.id_instructor ||
    horario.instructor?.id_instructor ||
    horario.instructor_grupo?.id_instructor ||
    horario.instructor_grupo?.instructor?.id_instructor ||
    horario.usuario?.id_usuario ||
    horario.instructor?.usuario?.id_usuario;

  return tieneInstructor ? itemPerteneceInstructorActual(horario, identidad) : true;
};
const esInstructorLiderGrupo = (grupo) => {
  const identidad = obtenerIdentidadInstructorActual();
  const idsLider = [
    grupo?.id_instructor_lider,
    grupo?.instructor_lider?.id_instructor,
    grupo?.instructor?.id_instructor
  ].filter(Boolean).map(String);

  return idsLider.some((idInstructor) => identidad.idsInstructor.has(idInstructor));
};
const obtenerRol = (grupo) => {
  if (esInstructorLiderGrupo(grupo)) return "Lider";
  return grupo.id_instructor_lider ? "Asignado" : "Instructor";
};

const combinarGrupos = (...listas) => {
  const grupos = new Map();
  listas.flat().forEach((grupo) => {
    if (!grupo?.id_grupo) return;
    grupos.set(String(grupo.id_grupo), grupo);
  });
  return [...grupos.values()];
};

const estadoCuentaComoAsistencia = (estado) => (
  ["PRESENTE", "TARDE", "JUSTIFICADO", "JUSTIFICADA"].includes(String(estado || "").toUpperCase())
);

const claseEstadoSesion = (estado) => {
  const valor = String(estado || "").toUpperCase();
  if (valor === "ABIERTA" || valor === "ACTIVA" || valor === "EN_CURSO") return "activa";
  if (valor === "PROGRAMADA") return "proxima";
  if (valor === "CERRADA" || valor === "CERRADO" || valor === "FINALIZADA") return "cerrada";
  if (valor === "CANCELADA" || valor === "CANCELADO") return "cancelada";
  return "sin";
};

const etiquetaEstadoSesion = (estado) => {
  const valor = String(estado || "PROGRAMADA").toUpperCase();
  if (valor === "ABIERTA" || valor === "ACTIVA" || valor === "EN_CURSO") return "Activa";
  if (valor === "PROGRAMADA") return "Programada";
  if (valor === "CERRADA" || valor === "CERRADO" || valor === "FINALIZADA") return "Cerrada";
  if (valor === "CANCELADA" || valor === "CANCELADO") return "Cancelada";
  return String(estado || "Programada");
};

const crearFechaHoraSesion = (fechaISO, hora) => {
  const horaNormalizada = normalizarHora(hora);
  if (!fechaISO || horaNormalizada === "--:--") return null;
  const fecha = new Date(`${fechaISO}T${horaNormalizada}:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const obtenerEstadoSesionCalendario = (sesion, fechaISO, horas = null, ahora = new Date()) => {
  const estadoBackend = String(sesion.estado || "").toUpperCase();
  if (["CANCELADA", "CANCELADO"].includes(estadoBackend)) return "CANCELADA";
  if (["CERRADA", "CERRADO", "FINALIZADA"].includes(estadoBackend)) return "CERRADA";

  const idSesionActiva = localStorage.getItem("sima_asistencia_sesion_activa") || sessionStorage.getItem("sima_asistencia_sesion_activa");
  const idSesion = obtenerIdSesion(sesion);
  const ingresoAAsistencia = idSesionActiva && idSesion && String(idSesionActiva) === String(idSesion);
  const estaActiva = ["ABIERTA", "ACTIVA", "EN_CURSO"].includes(estadoBackend) || ingresoAAsistencia;

  if (estaActiva) {
    const fin = crearFechaHoraSesion(fechaISO, horas?.fin || obtenerHoraFinSesion(sesion));
    if (fin && ahora > fin) return "CERRADA";
    return "ACTIVA";
  }

  return "PROGRAMADA";
};

const obtenerClaseDiaCalendario = (sesiones = [], fechaISO = "") => {
  if (!sesiones.length) return "sin-sesiones";
  if (sesiones.some((sesion) => claseEstadoSesion(sesion.estadoCalendario || sesion.estado) === "activa")) return "activa";
  if (sesiones.some((sesion) => claseEstadoSesion(sesion.estadoCalendario || sesion.estado) === "cerrada")) return "cerrada";
  if (sesiones.some((sesion) => claseEstadoSesion(sesion.estadoCalendario || sesion.estado) === "cancelada")) return "cancelada";
  return "con-sesiones";
};

const normalizarHorarioComoSesion = (horario, grupo) => ({
  ...horario,
  id: horario.id_horario || horario.id_sesion_formacion || horario.id,
  id_grupo: horario.id_grupo || grupo?.id_grupo,
  grupo: horario.grupo || grupo,
  numero_ficha: horario.numero_ficha || grupo?.numero_ficha || grupo?.numero_grupo || grupo?.codigo,
  estado: obtenerFechaSesion(horario) ? (horario.estado || "PROGRAMADA") : "PROGRAMADA",
  dia_semana: horario.dia_semana || horario.dia || horario.nombre_dia || horario.day,
  hora_inicio_programada: obtenerHoraInicioSesion(horario),
  hora_fin_programada: obtenerHoraFinSesion(horario),
  competencia: horario.competencia || horario.clase_competencia?.competencia || horario.clase_competencia,
  ambiente: horario.ambiente || horario.bloque_jornada?.ambiente
});

const obtenerClaveSesionCalendario = (sesion) => [
  obtenerFechaSesion(sesion) || obtenerDiaSemanaSesion(sesion),
  obtenerHoraInicioSesion(sesion),
  obtenerHoraFinSesion(sesion),
  obtenerIdGrupoSesion(sesion) || sesion.id_grupo,
  obtenerCompetenciaSesion(sesion)
].join("|");

const combinarSesionesCalendario = (...listas) => {
  const sesiones = new Map();
  listas.flat().forEach((sesion) => {
    const clave = obtenerClaveSesionCalendario(sesion);
    if (!clave.replaceAll("|", "")) return;
    if (!sesiones.has(clave) || obtenerFechaSesion(sesion)) {
      sesiones.set(clave, sesion);
    }
  });
  return [...sesiones.values()];
};

export default function PanelInstructor() {
  const [grupos, setGrupos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [sesionesSemana, setSesionesSemana] = useState([]);
  const [asistenciaPromedioMes, setAsistenciaPromedioMes] = useState(null);
  const [asistenciaPorGrupo, setAsistenciaPorGrupo] = useState({});
  const [totalObservacionesMes, setTotalObservacionesMes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ahora, setAhora] = useState(() => new Date());
  const [semanaReferencia] = useState(() => formatearFechaISO(new Date()));

  const inicioSemana = useMemo(() => inicioSemanaActual(semanaReferencia), [semanaReferencia]);
  const finSemana = useMemo(() => finSemanaActual(semanaReferencia), [semanaReferencia]);

  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAhora(new Date());
    }, 30000);
    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargarDashboard() {
      try {
        setCargando(true);
        const [
          resumen,
          alertasResultado,
          sesionesSemanaResultado
        ] = await Promise.all([
          fetchJson("/api/dashboard/instructor/resumen"),
          fetchJson("/api/alerts?estado=ABIERTA&limit=50").catch(() => ({ alertas: [] })),
          fetchJson(`/api/educational-sessions?fecha_desde=${inicioSemana}&fecha_hasta=${finSemana}&solo_responsable=true&limit=100`).catch(() => ({ sesiones: [] }))
        ]);

        if (!activo) return;

        const gruposInstructor = combinarGrupos(
          extraerGrupos(resumen?.grupos_liderados),
          extraerGrupos(resumen?.grupos_asignados)
        );
        const sesionesSemanaData = extraerSesiones(sesionesSemanaResultado);

        setGrupos(gruposInstructor);
        setAlertas(extraerAlertas(alertasResultado));
        setSesionesSemana(sesionesSemanaData);
        setTotalObservacionesMes(Number(resumen?.kpis?.total_observaciones_abiertas) || 0);
        setError("");
        setCargando(false);

        const identidadInstructor = obtenerIdentidadInstructorActual();
        const horariosPorGrupo = await Promise.allSettled(
          gruposInstructor.map(async (grupo) => {
            const idGrupoSeguro = encodeURIComponent(grupo.id_grupo);
            const [horariosData, asignacionesData] = await Promise.all([
              fetchJson(`/api/educational-schedules/group/${idGrupoSeguro}`).catch(() => []),
              fetchJson(`/api/instructor-groups/grupo/${idGrupoSeguro}`).catch(() => [])
            ]);
            const idsAsignacionActual = obtenerIdsAsignacionInstructorActual(
              extraerAsignacionesInstructor(asignacionesData),
              identidadInstructor
            );

            return extraerHorarios(horariosData)
              .filter((horario) => horarioPerteneceInstructorActual(horario, idsAsignacionActual, identidadInstructor))
              .map((horario) => normalizarHorarioComoSesion(horario, grupo));
          })
        );
        if (!activo) return;

        const horariosInstructor = horariosPorGrupo.flatMap((result) =>
          result.status === "fulfilled" ? result.value : []
        );
        if (horariosInstructor.length) {
          setSesionesSemana((actual) => combinarSesionesCalendario(actual, horariosInstructor));
        }

        const sesionesMesResultado = await fetchJson(`/api/educational-sessions?fecha_desde=${inicioMesActual()}&fecha_hasta=${finMesActual()}&solo_responsable=true&limit=100`).catch(() => ({ sesiones: [] }));
        if (!activo) return;

        const sesionesMes = extraerSesiones(sesionesMesResultado);
        const asistenciasPorSesion = await Promise.allSettled(
          sesionesMes.map((sesion) =>
            fetchJson(`/api/educational-sessions/${obtenerIdSesion(sesion)}/attendances`)
              .then((data) => ({ sesion, asistencias: extraerAsistencias(data) }))
          )
        );

        if (!activo) return;

        const acumuladoAsistencia = asistenciasPorSesion.reduce((acc, result) => {
          if (result.status !== "fulfilled") return acc;
          const { sesion, asistencias } = result.value;
          const idGrupo = obtenerIdGrupoSesion(sesion);
          asistencias.forEach((asistencia) => {
            const estado = asistencia.estado_ep05 || asistencia.estado_asistencia || asistencia.estado;
            acc.total += 1;
            if (estadoCuentaComoAsistencia(estado)) acc.asisten += 1;

            if (idGrupo) {
              const clave = String(idGrupo);
              acc.porGrupo[clave] ||= { total: 0, asisten: 0 };
              acc.porGrupo[clave].total += 1;
              if (estadoCuentaComoAsistencia(estado)) acc.porGrupo[clave].asisten += 1;
            }
          });
          return acc;
        }, { total: 0, asisten: 0, porGrupo: {} });

        setAsistenciaPromedioMes(
          acumuladoAsistencia.total
            ? Math.round((acumuladoAsistencia.asisten / acumuladoAsistencia.total) * 100)
            : null
        );
        setAsistenciaPorGrupo(acumuladoAsistencia.porGrupo);
      } catch (err) {
        console.error("Error cargando dashboard del instructor:", err);
        if (activo) setError(err.message || "No fue posible cargar el dashboard del instructor");
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarDashboard();
    return () => {
      activo = false;
    };
  }, [finSemana, inicioSemana]);

  const alertasActivas = useMemo(
    () => alertas.filter((alerta) => String(alerta.estado || "").toUpperCase() === "ABIERTA"),
    [alertas]
  );

  const riesgos = useMemo(() => {
    const conteo = alertasActivas.reduce((acc, alerta) => {
      const tipo = alerta.tipo_alerta || alerta.tipoAlerta || "MANUAL";
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {});
    const total = Math.max(alertasActivas.length, 1);

    return Object.entries(conteo).map(([tipo, valor], index) => ({
      nombre: nombresRiesgo[tipo] || tipo,
      valor,
      porcentaje: Math.round((valor / total) * 100),
      color: coloresRiesgo[index % coloresRiesgo.length]
    }));
  }, [alertasActivas]);

  const barras = useMemo(() => (
    grupos.slice(0, 3).map((grupo, index) => {
      const asistenciaGrupo = asistenciaPorGrupo[String(grupo.id_grupo)] || { total: 0, asisten: 0 };
      const porcentaje = asistenciaGrupo.total
        ? Math.round((asistenciaGrupo.asisten / asistenciaGrupo.total) * 100)
        : 0;

      return {
        grupo: obtenerCodigo(grupo),
        programa: obtenerPrograma(grupo),
        porcentaje,
        tieneDatos: asistenciaGrupo.total > 0,
        color: coloresBarras[index % coloresBarras.length]
      };
    })
  ), [asistenciaPorGrupo, grupos]);

  const resumenCards = useMemo(() => ([
    {
      titulo: "Mis grupos asignados",
      valor: grupos.length,
      detalle: "Grupos visibles para el instructor",
      meta: null,
      icono: UsersRound,
      tono: "amarillo"
    },
    {
      titulo: "Asistencia promedio (este mes)",
      valor: asistenciaPromedioMes === null ? "N/D" : `${asistenciaPromedioMes}%`,
      detalle: "Calculada desde sesiones del mes",
      meta: asistenciaPromedioMes === null ? "Sin sesiones con asistencia este mes" : "Sesiones del mes",
      icono: CheckCircle2,
      tono: "verde"
    },
    {
      titulo: "Alertas activas",
      valor: alertasActivas.length,
      detalle: "Con alertas activas o en seguimiento",
      meta: null,
      icono: AlertTriangle,
      tono: "rojo",
      alerta: alertasActivas.length > 0
    },
    {
      titulo: "Observaciones registradas",
      valor: totalObservacionesMes,
      detalle: "Abiertas",
      meta: "Resumen del backend",
      icono: PencilLine,
      tono: "cyan"
    }
  ]), [alertasActivas.length, asistenciaPromedioMes, grupos.length, totalObservacionesMes]);

  const maximoResumen = Math.max(
    ...resumenCards
      .filter((card) => !card.valor?.toString().includes("%"))
      .map((card) => obtenerNumero(card.valor)),
    1
  );
  const cardsConProgreso = resumenCards.map((card) => ({
    ...card,
    progreso: calcularProgreso(card.valor, card.valor?.toString().includes("%") ? 100 : maximoResumen)
  }));

  const calendarioSemana = useMemo(() => {
    const dias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
    const inicio = new Date(`${inicioSemana}T12:00:00`);

    return dias.map((dia, index) => {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + index);
      const fechaISO = formatearFechaISO(fecha);
      const diaNormalizado = normalizarDiaSemana(dia);
      const sesionesDia = sesionesSemana
        .filter((sesion) => {
          const fechaSesion = obtenerFechaSesion(sesion);
          const diaSesion = obtenerDiaSemanaSesion(sesion);
          return fechaSesion === fechaISO || (!fechaSesion && diaSesion === diaNormalizado);
        })
        .sort((a, b) =>
          String(obtenerHoraInicioSesion(a)).localeCompare(String(obtenerHoraInicioSesion(b)))
        );
      const sesionesConEstado = sesionesDia.map((sesion, index) => {
        const horas = obtenerHorasBloqueDashboard(sesion, index, sesionesDia);
        return {
          ...sesion,
          estadoCalendario: obtenerEstadoSesionCalendario(sesion, fechaISO, horas, ahora)
        };
      });

      return {
        dia,
        fecha: fechaISO,
        clase: obtenerClaseDiaCalendario(sesionesConEstado, fechaISO),
        sesiones: sesionesConEstado
      };
    });
  }, [ahora, inicioSemana, sesionesSemana]);

  const totalSesionesSemana = useMemo(
    () => calendarioSemana.reduce((total, item) => total + item.sesiones.length, 0),
    [calendarioSemana]
  );

  if (cargando) {
    return (
      <div className="coordinador-panel instructor-panel-v2">
        <SesionActivaModal />
        <div className="grupos-alert info">Cargando dashboard del instructor...</div>
      </div>
    );
  }

  return (
    <div className="coordinador-panel instructor-panel-v2">
      <SesionActivaModal />

      {error && <div className="grupos-alert danger">{error}</div>}

      <section className="dashboard-welcome">
        <section className="dashboard-role-welcome">
          <h1>Bienvenido instructor</h1>
        </section>
      </section>

      <section className="instructor-kpi-grid" aria-label="Resumen del instructor">
        {cardsConProgreso.map((card) => {
          const Icon = card.icono;

          return (
            <article className={`coordinador-kpi-card instructor-kpi-card tono-${card.tono}`} key={card.titulo}>
              <div className="coordinador-kpi-top">
                <span className="coordinador-kpi-icon">
                  <Icon size={29} strokeWidth={2.1} />
                </span>
                <span
                  className="coordinador-kpi-ring"
                  style={{ "--kpi-progress": `${card.progreso}%` }}
                  role="img"
                  aria-label={`${card.progreso}% de avance`}
                ></span>
              </div>
              <h2>{card.titulo}</h2>
              <strong>{card.valor}</strong>
              <p className={card.alerta ? "negativo" : ""}>{card.alerta ? "Atencion requerida" : "Dato actualizado"}</p>
              <small>{card.meta || card.detalle}</small>
            </article>
          );
        })}
      </section>

      <section className="instructor-overview-grid">
        <article className="coordinador-card instructor-risk-card">
          <div className="coordinador-card-header">
            <h2>Alertas activas por causa</h2>
          </div>

          <div className="instructor-risk-layout">
            <div
              className="instructor-risk-donut"
              style={{
                background: riesgos.length
                  ? `conic-gradient(${riesgos
                    .reduce((segmentos, item) => {
                      const inicio = segmentos.total;
                      const fin = inicio + item.porcentaje;
                      segmentos.partes.push(`${item.color} ${inicio}% ${fin}%`);
                      segmentos.total = fin;
                      return segmentos;
                    }, { total: 0, partes: [] }).partes.join(", ")})`
                  : "#e5e7eb"
              }}
            >
              <div className="instructor-risk-donut-inner">
                <strong>{alertasActivas.length}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="instructor-risk-list">
              {riesgos.length ? riesgos.map((item) => (
                <div className="instructor-risk-item" key={item.nombre}>
                  <span className="dot" style={{ background: item.color }}></span>
                  <p>{item.nombre}</p>
                  <strong>{item.valor} ({item.porcentaje}%)</strong>
                </div>
              )) : (
                <div className="instructor-risk-item">
                  <span className="dot" style={{ background: "#94a3b8" }}></span>
                  <p>Sin alertas activas</p>
                  <strong>0</strong>
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="coordinador-card instructor-calendar-card instructor-calendar-card-dark">
          <div className="instructor-calendar-top">
            <div className="instructor-calendar-title-row">
              <h2>Horario semanal</h2>
              <span>{formatearFechaCorta(inicioSemana)} - {formatearFechaCorta(finSemana)}</span>
            </div>
            <strong>{totalSesionesSemana} sesiones</strong>
          </div>

          <div className="instructor-calendar-legend">
            <span><i className="activa"></i> Sesion activa</span>
            <span><i className="proxima"></i> Proxima sesion</span>
            <span><i className="cerrada"></i> Cerrada</span>
            <span><i className="cancelada"></i> Cancelada</span>
          </div>

          <div className="instructor-calendar-grid">
            {calendarioSemana.map((item) => (
              <div key={item.dia} className={`instructor-calendar-day ${item.clase}`}>
                <div className="instructor-calendar-head">
                  <strong>{item.dia.slice(0, 3).toUpperCase()}</strong>
                  <span>{Number(String(item.fecha).slice(8, 10))}</span>
                </div>
                {item.sesiones.length ? item.sesiones.slice(0, 2).map((sesion, index) => (
                  <div
                    className={`instructor-calendar-session ${claseEstadoSesion(sesion.estadoCalendario || sesion.estado)}`}
                    key={obtenerIdSesion(sesion) || `${item.dia}-${obtenerClaveSesionCalendario(sesion)}-${index}`}
                  >
                    <span className="instructor-calendar-time">
                      <Clock size={13} />
                      {obtenerHorasBloqueDashboard(sesion, index, item.sesiones).inicio} - {obtenerHorasBloqueDashboard(sesion, index, item.sesiones).fin}
                    </span>
                    <strong>{obtenerCompetenciaSesion(sesion)}</strong>
                    <small>Ficha {obtenerFichaSesion(sesion)}</small>
                    <em>{etiquetaEstadoSesion(sesion.estadoCalendario || sesion.estado)}</em>
                  </div>
                )) : (
                  <div className="instructor-calendar-empty">
                    <CalendarClock size={18} />
                    <p>Sin sesiones programadas</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="instructor-main-grid">
        <article className="coordinador-card instructor-chart-card">
          <div className="coordinador-card-header">
            <h2>Asistencia promedio por grupo (este mes)</h2>
          </div>

          <div className="instructor-group-chart">
            <div className="instructor-chart-scale">
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            <div className="instructor-bars-wrap">
              {barras.map((item) => (
                <div className="instructor-group-bar-item" key={item.grupo}>
                  <span>{item.tieneDatos ? `${item.porcentaje}%` : "Sin datos"}</span>
                  <div className="instructor-group-bar-track">
                    <span
                      className={`instructor-group-bar-fill ${item.color}`}
                      style={{ height: `${item.porcentaje}%` }}
                    ></span>
                  </div>
                  <strong>Grupo {item.grupo}</strong>
                  <small>{item.programa}</small>
                </div>
              ))}
              {!barras.length && (
                <div className="instructor-attendance-empty">Sin grupos con datos de asistencia.</div>
              )}
            </div>
          </div>
        </article>

      </section>


    </div>
  );
}




