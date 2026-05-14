import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FilterX,
  Layers,
  Search,
  UsersRound,
} from "lucide-react";
import "../fichas/fichas.css";

const API_URL = "/api";
const GRUPOS_POR_PAGINA = 6;
const ENDPOINTS_GRUPOS_INSTRUCTOR = [
  `${API_URL}/groups/mis-grupos`,
  `${API_URL}/groups/instructor`,
  `${API_URL}/apprentices/grupos-activos`,
  `${API_URL}/groups`,
];
const FICHAS_OCULTAS = new Set(["2850312"]);
const JORNADAS_BASE = ["Mañana", "Tarde", "Noche"];

function getHeaders() {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };

  if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;

  return headers;
}

function normalizarTexto(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function extraerListaGrupos(data) {
  const lista =
    data?.data?.grupos ||
    data?.data?.fichas ||
    data?.data?.items ||
    data?.data ||
    data?.results ||
    data?.grupos ||
    data?.items ||
    data;

  return Array.isArray(lista) ? lista : [];
}

function obtenerPrograma(grupo) {
  return (
    grupo.programa_formacion?.nombre_programa ||
    grupo.programa?.nombre_programa ||
    grupo.nombre_programa ||
    grupo.programa ||
    "Programa de formacion"
  );
}

function obtenerCodigo(grupo) {
  return (
    grupo.numero_ficha ||
    grupo.numero_grupo ||
    grupo.codigo ||
    grupo.ficha ||
    grupo.id_grupo ||
    grupo.id ||
    "Sin ficha"
  );
}

function obtenerEstado(grupo) {
  return String(grupo.estado || "ACTIVO").toUpperCase();
}

function obtenerEstadoClase(estado) {
  if (estado === "CERRADO") return "cerrado";
  if (estado === "SUSPENDIDO") return "suspendido";
  return "activo";
}

function obtenerIdGrupo(grupo, index = 0) {
  return grupo.id_grupo || grupo.id || grupo.codigo || grupo.numero_ficha || index;
}

function prepararGrupoDetalle(grupo) {
  return {
    ...grupo,
    id_grupo: grupo.id_grupo || grupo.id || null,
    numero_ficha: obtenerCodigo(grupo),
    programa: obtenerPrograma(grupo),
    jornada: grupo.jornada || "",
    estado: obtenerEstado(grupo),
    fecha_inicio: grupo.fecha_inicio || "",
    fecha_fin: grupo.fecha_fin || "",
    trimestres: grupo.trimestres || "",
  };
}

function obtenerMetricas(grupos) {
  const total = grupos.length;
  const activos = grupos.filter((grupo) => obtenerEstado(grupo) === "ACTIVO").length;
  const suspendidos = grupos.filter(
    (grupo) => obtenerEstado(grupo) === "SUSPENDIDO"
  ).length;
  const cerrados = grupos.filter((grupo) => obtenerEstado(grupo) === "CERRADO").length;
  const jornadas = new Set(grupos.map((grupo) => grupo.jornada || "Sin jornada"));

  return {
    total,
    activos,
    suspendidos,
    cerrados,
    jornadas: jornadas.size,
  };
}

function ordenarGruposImportantes(grupos) {
  return [...grupos].sort((a, b) => {
    const prioridadEstado = (grupo) => {
      const estado = obtenerEstado(grupo);
      if (estado === "ACTIVO") return 0;
      if (estado === "SUSPENDIDO") return 1;
      return 2;
    };

    return prioridadEstado(a) - prioridadEstado(b) ||
      String(obtenerCodigo(a)).localeCompare(String(obtenerCodigo(b)), "es", { numeric: true });
  });
}

function GrupoCompacto({ grupo, index, onVer }) {
  const estado = obtenerEstado(grupo);

  return (
    <article className="mis-grupo-card">
      <div className="mis-grupo-card-top">
        <span className={`grupos-status ${obtenerEstadoClase(estado)}`}>{estado}</span>
      </div>

      <strong>Ficha {obtenerCodigo(grupo)}</strong>
      <p>{obtenerPrograma(grupo)}</p>

      <div className="mis-grupo-card-meta">
        <span>
          <CalendarDays size={15} />
          {grupo.jornada || "Sin jornada"}
        </span>
      </div>

      <button
        type="button"
        className="mis-grupo-ver-btn"
        onClick={onVer}
        aria-label={`Ver ficha ${obtenerCodigo(grupo) || index}`}
      >
        <span>Abrir ficha</span>
        <ChevronRight size={16} />
      </button>
    </article>
  );
}

export default function MisGrupos() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroJornada, setFiltroJornada] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeError, setMensajeError] = useState(false);

  useEffect(() => {
    let activo = true;

    async function cargarGruposInstructor() {
      setLoading(true);
      setMensaje("");
      setMensajeError(false);

      try {
        let ultimoError = null;

        for (const endpoint of ENDPOINTS_GRUPOS_INSTRUCTOR) {
          try {
            const res = await fetch(endpoint, { headers: getHeaders() });

            if (res.status === 404) {
              ultimoError = new Error(`Ruta no disponible: ${endpoint}`);
              continue;
            }

            const data = await res.json().catch(() => null);

            if (!res.ok) {
              throw new Error(
                data?.message ||
                  data?.error ||
                  "No fue posible cargar tus grupos asignados"
              );
            }

            const gruposExtraidos = extraerListaGrupos(data).filter(
              (grupo) => !FICHAS_OCULTAS.has(String(obtenerCodigo(grupo)))
            );

            if (activo) {
              setGrupos(gruposExtraidos);
              setPaginaActual(1);
              setMensaje("");
              setMensajeError(false);
            }

            return;
          } catch (error) {
            ultimoError = error;
          }
        }

        throw ultimoError || new Error("No fue posible cargar tus grupos asignados");
      } catch (error) {
        console.error("Error cargando grupos del instructor:", error);
        if (activo) {
          setGrupos([]);
          setMensajeError(true);
          setMensaje(
            error.message ||
              "No fue posible cargar tus grupos asignados desde el backend."
          );
        }
      } finally {
        if (activo) setLoading(false);
      }
    }

    const timeout = window.setTimeout(cargarGruposInstructor, 0);

    return () => {
      activo = false;
      window.clearTimeout(timeout);
    };
  }, []);

  const gruposFiltrados = useMemo(() => {
    let filtrados = grupos;

    if (busqueda.trim()) {
      const texto = normalizarTexto(busqueda);
      filtrados = filtrados.filter((grupo) =>
        normalizarTexto(
          `${obtenerCodigo(grupo)} ${obtenerPrograma(grupo)} ${grupo.jornada || ""}`
        ).includes(texto)
      );
    }

    if (filtroEstado) {
      filtrados = filtrados.filter((grupo) => obtenerEstado(grupo) === filtroEstado);
    }

    if (filtroJornada) {
      filtrados = filtrados.filter(
        (grupo) => normalizarTexto(grupo.jornada) === normalizarTexto(filtroJornada)
      );
    }

    return ordenarGruposImportantes(filtrados);
  }, [busqueda, filtroEstado, filtroJornada, grupos]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(gruposFiltrados.length / GRUPOS_POR_PAGINA)
  );
  const paginaSegura = Math.min(paginaActual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * GRUPOS_POR_PAGINA;
  const gruposPagina = gruposFiltrados.slice(
    inicioPagina,
    inicioPagina + GRUPOS_POR_PAGINA
  );
  const desde = gruposFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const hasta = Math.min(inicioPagina + GRUPOS_POR_PAGINA, gruposFiltrados.length);
  const metricas = useMemo(() => obtenerMetricas(grupos), [grupos]);

  const jornadasDisponibles = useMemo(
    () => [...new Set([...JORNADAS_BASE, ...grupos.map((grupo) => grupo.jornada).filter(Boolean)])],
    [grupos]
  );

  function cambiarPagina(nuevaPagina) {
    const pagina = Math.min(Math.max(nuevaPagina, 1), totalPaginas);
    setPaginaActual(pagina);
  }

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroEstado("");
    setFiltroJornada("");
    setPaginaActual(1);
  }

  function navegarGrupo(grupo, index = 0) {
    const idGrupo = obtenerIdGrupo(grupo, index);
    const grupoDetalle = prepararGrupoDetalle(grupo);

    try {
      sessionStorage.setItem(`sima_grupo_detalle_${idGrupo}`, JSON.stringify(grupoDetalle));
    } catch {
      // La navegacion sigue funcionando aunque el navegador bloquee sessionStorage.
    }

    navigate(`/instructor/grupos/${idGrupo}`, { state: { grupo: grupoDetalle } });
  }

  return (
    <div className="grupos-page mis-grupos-page">
      <header className="mis-grupos-header">
        <div>
          <span className="grupos-eyebrow">Area del instructor</span>
          <h1>Mis grupos</h1>
          <p>Tus fichas asignadas listas para consultar en un clic.</p>
        </div>

        <div className="mis-grupos-header-pill">
          <UsersRound size={18} />
          <span>{metricas.total} grupos asignados</span>
        </div>
      </header>

      {mensaje && (
        <div className={`grupos-alert ${mensajeError ? "danger" : "info"}`}>
          {mensaje}
        </div>
      )}

      <section className="mis-grupos-kpis" aria-label="Resumen de grupos">
        <article>
          <UsersRound size={20} />
          <span>Grupos</span>
          <strong>{metricas.total}</strong>
        </article>

        <article>
          <CheckCircle2 size={20} />
          <span>Activos</span>
          <strong>{metricas.activos}</strong>
        </article>

        <article>
          <CalendarDays size={20} />
          <span>Jornadas</span>
          <strong>{metricas.jornadas}</strong>
        </article>
      </section>

      <section className="mis-grupos-listado">
          <div className="mis-grupos-toolbar">
            <div className="grupos-search">
              <Search size={18} />
              <input
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar ficha, programa o jornada"
              />
            </div>

            <select
              className="grupos-select-filtro"
              value={filtroJornada}
              onChange={(e) => {
                setFiltroJornada(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="">Todas las jornadas</option>
              {jornadasDisponibles.map((jornada) => (
                <option key={jornada} value={jornada}>
                  {jornada}
                </option>
              ))}
            </select>

            <select
              className="grupos-select-filtro"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPaginaActual(1);
              }}
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="SUSPENDIDO">Suspendido</option>
              <option value="CERRADO">Cerrado</option>
            </select>

            <button type="button" className="ghost" onClick={limpiarFiltros}>
              <FilterX size={16} />
              Limpiar
            </button>
          </div>

          <div className="mis-grupos-list-head">
            <div>
              <h2>Grupos asignados</h2>
              <p>
                Mostrando {desde}-{hasta} de {gruposFiltrados.length} grupos
              </p>
            </div>

          </div>

          {loading ? (
            <div className="grupos-empty">Cargando grupos...</div>
          ) : gruposPagina.length ? (
            <div className="mis-grupos-card-grid">
              {gruposPagina.map((grupo, index) => (
                <GrupoCompacto
                  key={obtenerIdGrupo(grupo, index)}
                  grupo={grupo}
                  index={index}
                  onVer={() => navegarGrupo(grupo, inicioPagina + index)}
                />
              ))}
            </div>
          ) : (
            <div className="mis-grupos-empty-inline">
              <Layers size={28} />
              <span>No hay grupos que coincidan con la busqueda.</span>
            </div>
          )}

          {gruposFiltrados.length > GRUPOS_POR_PAGINA && (
            <div className="grupos-pagination mis-grupos-pagination">
              <span>
                Pagina {paginaSegura} de {totalPaginas}
              </span>

              <div>
                <button
                  type="button"
                  onClick={() => cambiarPagina(paginaSegura - 1)}
                  disabled={paginaSegura === 1}
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() => cambiarPagina(paginaSegura + 1)}
                  disabled={paginaSegura === totalPaginas}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </section>

    </div>
  );
}
