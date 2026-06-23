export function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function extraerLista(data, llave = "") {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  if (llave && Array.isArray(data?.data?.[llave])) return data.data[llave];
  if (llave && Array.isArray(data?.[llave])) return data[llave];
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

export function obtenerCodigo(grupo) {
  return grupo?.numero_ficha || grupo?.numero_grupo || grupo?.codigo || grupo?.ficha || grupo?.id_grupo || "Sin ficha";
}

export function obtenerPrograma(grupo) {
  return (
    grupo?.programa_formacion?.nombre_programa ||
    grupo?.programa?.nombre_programa ||
    grupo?.nombre_programa ||
    grupo?.programa ||
    "Sin programa"
  );
}

export function obtenerIdGrupo(grupo) {
  return grupo?.id_grupo || grupo?.id || grupo?.codigo || grupo?.numero_ficha || "";
}

export function obtenerIdSesion(sesion) {
  return sesion?.id_sesion_formacion || sesion?.id || "";
}

export function obtenerNombreAprendiz(aprendiz, index) {
  const persona = aprendiz?.usuario?.persona || aprendiz?.persona || aprendiz?.aprendiz?.usuario?.persona || {};
  const nombre = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
  return nombre || aprendiz?.nombre || aprendiz?.aprendizNombre || aprendiz?.nombre_completo || `Sin nombre ${index + 1}`;
}

export function normalizarEstadoAsistencia(estado) {
  const valor = normalizarTexto(estado).replaceAll(" ", "_");
  const equivalencias = {
    presente: "presente",
    asistio: "presente",
    asistencia: "presente",
    presente_ep05: "presente",
    a_tiempo: "presente",
    registrado: "presente",
    valida: "presente",
    valido: "presente",
    tarde: "retardado",
    tardanza: "retardado",
    retardado: "retardado",
    retardo: "retardado",
    llego_tarde: "retardado",
    inasistente: "ausente",
    ausente: "ausente",
    falta: "ausente",
    no_asistio: "ausente",
    sin_registro: "ausente",
    justificada: "justificado",
    justificado: "justificado",
    excusado: "justificado",
    excusa: "justificado",
    pendiente: ""
  };
  return equivalencias[valor] || valor;
}

export function normalizarMetodoAsistencia(metodo) {
  const valor = normalizarTexto(metodo || "");
  const equivalencias = {
    biometrico: "Huella",
    iot_huella: "Huella",
    huella: "Huella",
    manual: "Manual",
    qr: "QR",
    biometria_movil: "Biometria movil",
    geolocalizacion: "Geolocalizacion",
    automatico_cierre: "Automatico"
  };
  return equivalencias[valor] || metodo || "-";
}

function obtenerMetodoAsistencia(registro) {
  const evidencia = Array.isArray(registro?.evidencias) ? registro.evidencias[0] : null;
  return normalizarMetodoAsistencia(
    evidencia?.metodo ||
    registro?.origen ||
    registro?.metodo_registro ||
    registro?.metodo ||
    "-"
  );
}

function formatearHoraAsistencia(hora) {
  if (!hora) return "-";
  const texto = String(hora);
  const partes = texto.match(/^(\d{1,2}):(\d{2})/);
  if (!partes) return texto;

  const horas = Number(partes[1]);
  const minutos = partes[2];
  if (Number.isNaN(horas)) return texto;

  const periodo = horas >= 12 ? "p. m." : "a. m.";
  const hora12 = horas % 12 || 12;
  return `${hora12}:${minutos} ${periodo}`;
}

export function prepararAprendiz(aprendiz, index) {
  const asistencia = aprendiz?.asistencia || aprendiz?.registro_asistencia || {};
  const estado = asistencia.estado_asistencia || asistencia.estado || aprendiz.estado_asistencia || aprendiz.estado || "";

  return {
    id: aprendiz.id_aprendiz || aprendiz.id || index + 1,
    idAsistencia: asistencia.id_asistencia || asistencia.id || aprendiz.id_asistencia || "",
    nombre: obtenerNombreAprendiz(aprendiz, index),
    hora: formatearHoraAsistencia(asistencia.hora_registro || asistencia.hora || aprendiz.hora_registro || aprendiz.hora),
    estado: normalizarEstadoAsistencia(estado),
    metodo: obtenerMetodoAsistencia({ ...aprendiz, ...asistencia }),
    fecha: asistencia.fecha_clase || asistencia.fecha || asistencia.fecha_registro || aprendiz.fecha_clase || aprendiz.fecha || aprendiz.fecha_registro || "",
    historial: aprendiz.historial || aprendiz.historial_asistencia || aprendiz.asistencias || []
  };
}

export function prepararAsistenciaSesion(asistencia, index) {
  const aprendiz = asistencia?.aprendiz || {};
  const sesion = asistencia?.sesion || {};
  const fechaSesion = sesion?.fecha_clase || asistencia?.fecha_clase || asistencia?.fecha || "";

  return {
    id: asistencia.id_aprendiz || aprendiz.id_aprendiz || aprendiz.id || index + 1,
    idAsistencia: asistencia.id_asistencia || asistencia.id || "",
    idSesion: asistencia.id_sesion_formacion || sesion.id_sesion_formacion || "",
    nombre: obtenerNombreAprendiz(aprendiz, index),
    hora: formatearHoraAsistencia(asistencia.hora_registro || asistencia.hora),
    estado: normalizarEstadoAsistencia(asistencia.estado_ep05 || asistencia.estado_asistencia || asistencia.estado || ""),
    metodo: obtenerMetodoAsistencia(asistencia),
    fecha: fechaSesion,
    historial: [asistencia]
  };
}

export function combinarAprendicesConAsistencias(aprendicesGrupo = [], asistenciasSesion = []) {
  const aprendicesPreparados = aprendicesGrupo.map(prepararAprendiz);
  const asistenciasPreparadas = asistenciasSesion.map(prepararAsistenciaSesion);
  const registrosPorAprendiz = new Map(
    asistenciasPreparadas.map((asistencia) => [String(asistencia.id), asistencia])
  );

  const listaCombinada = aprendicesPreparados.map((aprendiz) => {
    const asistencia = registrosPorAprendiz.get(String(aprendiz.id));
    if (!asistencia) return aprendiz;
    registrosPorAprendiz.delete(String(aprendiz.id));
    return {
      ...aprendiz,
      ...asistencia,
      nombre: asistencia.nombre || aprendiz.nombre,
      historial: asistencia.historial?.length ? asistencia.historial : aprendiz.historial
    };
  });

  return [...listaCombinada, ...registrosPorAprendiz.values()];
}

export function formatearFecha(fechaISO) {
  if (!fechaISO) return "Sin fecha";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return fecha.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export function obtenerHoraActual() {
  return new Date().toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true });
}

export function textoBusquedaFecha(fechaISO) {
  if (!fechaISO) return "";
  const fecha = new Date(`${fechaISO}T12:00:00`);
  if (Number.isNaN(fecha.getTime())) return "";
  const mes = fecha.toLocaleDateString("es-CO", { month: "long" });
  const dia = fecha.toLocaleDateString("es-CO", { day: "numeric" });
  const anio = fecha.toLocaleDateString("es-CO", { year: "numeric" });
  const mesNumero = String(fecha.getMonth() + 1).padStart(2, "0");
  const diaNumero = String(fecha.getDate()).padStart(2, "0");
  return `${fechaISO} ${dia} ${diaNumero} ${mes} ${mesNumero} ${anio} ${dia} de ${mes} de ${anio}`;
}

export function construirHistorialAsistencia(aprendiz) {
  const historial = extraerLista(aprendiz?.historial).length
    ? extraerLista(aprendiz.historial)
    : extraerLista(aprendiz?.historial_asistencia);

  return historial.map((item, index) => ({
    id: item.id || item.id_asistencia || `${aprendiz?.id || "aprendiz"}-${index}`,
    estado: normalizarEstadoAsistencia(item.estado_asistencia || item.estado || ""),
    fecha: item.fecha_clase || item.fecha || item.fecha_registro || "",
    hora: formatearHoraAsistencia(item.hora_registro || item.hora),
    metodo: obtenerMetodoAsistencia(item),
    nota: item.nota || item.observacion || item.descripcion || ""
  }));
}
