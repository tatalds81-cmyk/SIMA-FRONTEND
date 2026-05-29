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

export function obtenerNombreAprendiz(aprendiz, index) {
  const persona = aprendiz?.usuario?.persona || aprendiz?.persona || aprendiz?.aprendiz?.usuario?.persona || {};
  const nombre = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
  return nombre || aprendiz?.nombre || aprendiz?.aprendizNombre || aprendiz?.nombre_completo || `Sin nombre ${index + 1}`;
}

export function prepararAprendiz(aprendiz, index) {
  const asistencia = aprendiz?.asistencia || aprendiz?.registro_asistencia || {};
  const estado = asistencia.estado_asistencia || asistencia.estado || aprendiz.estado_asistencia || aprendiz.estado || "";

  return {
    id: aprendiz.id_aprendiz || aprendiz.id || index + 1,
    nombre: obtenerNombreAprendiz(aprendiz, index),
    hora: asistencia.hora_registro || asistencia.hora || aprendiz.hora_registro || aprendiz.hora || "-",
    estado: String(estado).toLowerCase(),
    metodo: asistencia.metodo_registro || asistencia.metodo || aprendiz.metodo_registro || aprendiz.metodo || "-",
    fecha: asistencia.fecha || asistencia.fecha_registro || aprendiz.fecha || aprendiz.fecha_registro || "",
    historial: aprendiz.historial || aprendiz.historial_asistencia || aprendiz.asistencias || []
  };
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
    estado: String(item.estado_asistencia || item.estado || "").toLowerCase(),
    fecha: item.fecha || item.fecha_registro || "",
    hora: item.hora_registro || item.hora || "-",
    metodo: item.metodo_registro || item.metodo || "-",
    nota: item.nota || item.observacion || item.descripcion || ""
  }));
}
