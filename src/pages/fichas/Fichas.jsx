import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Layers, Plus, Search, Trash2, Upload } from "lucide-react";
import "./fichas.css";

export default function GruposFormativos() {
  const navigate = useNavigate();
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [mensajeError, setMensajeError] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroJornada, setFiltroJornada] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [grupos, setGrupos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [programas, setProgramas] = useState([]);

  const [numeroGrupo, setNumeroGrupo] = useState("");
  const [areaFormacion, setAreaFormacion] = useState("");
  const [jornada, setJornada] = useState("");
  const [programaFormacion, setProgramaFormacion] = useState("");
  const [trimestres, setTrimestres] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [instructorLider, setInstructorLider] = useState("");
  const [errores, setErrores] = useState({});
  const [estadoNumero, setEstadoNumero] = useState(null);
  const [aprendicesPorGrupo, setAprendicesPorGrupo] = useState({});

  const API_URL = "/api";
  const URL_GRUPOS = `${API_URL}/groups`;
  const URL_INSTRUCTORES = `${URL_GRUPOS}/instructores-disponibles`;
  const GRUPOS_POR_PAGINA = 10;

  function getHeaders() {
    const token = localStorage.getItem("access") || localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function cargarGrupos() {
    try {
      const res = await fetch(URL_GRUPOS, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const gruposExtraidos =
          data?.data?.grupos ||
          data?.data?.fichas ||
          data?.data ||
          data?.results ||
          (Array.isArray(data) ? data : []);

        setGrupos(Array.isArray(gruposExtraidos) ? gruposExtraidos : []);
        setPaginaActual(1);
      }
    } catch (error) {
      console.error("Error cargando grupos:", error);
    }
  }

  async function cargarAreas() {
    try {
      const res = await fetch(`${API_URL}/dashboard/coordinador/resumen`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const areasExtraidas = data?.data?.areas || data?.areas || data?.results || [];
        setAreas(Array.isArray(areasExtraidas) ? areasExtraidas : []);
      }
    } catch (error) {
      console.error("Error cargando areas:", error);
      setAreas([]);
    }
  }

  async function cargarConteoAprendices(gruposBase) {
    try {
      const headers = getHeaders();
      const respuestas = await Promise.all(
        gruposBase.map(async (grupo) => {
          const idGrupo = grupo.id_grupo || grupo.id;
          if (!idGrupo) return [idGrupo, null];

          try {
            const res = await fetch(`${API_URL}/apprentices/grupo/${idGrupo}`, { headers });
            if (!res.ok) return [idGrupo, null];

            const data = await res.json().catch(() => null);
            const lista = data?.data?.aprendices || data?.data || [];
            const total = Array.isArray(lista) ? lista.length : 0;
            return [idGrupo, total];
          } catch (_error) {
            return [idGrupo, null];
          }
        })
      );

      setAprendicesPorGrupo(Object.fromEntries(respuestas.filter(([id]) => id)));
    } catch (error) {
      console.error("Error cargando conteo de aprendices:", error);
      setAprendicesPorGrupo({});
    }
  }

  async function cargarInstructores() {
    try {
      const res = await fetch(URL_INSTRUCTORES, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const lista = data?.data || data?.results || [];
        setInstructores(Array.isArray(lista) ? lista : []);
      }
    } catch (error) {
      console.error("Error cargando instructores:", error);
    }
  }

  async function cargarProgramas(idArea) {
    try {
      const res = await fetch(`${API_URL}/formative-programs/area/${idArea}`, {
        headers: getHeaders()
      });

      if (res.ok) {
        const data = await res.json();
        const progs = data?.data || data?.results || [];
        setProgramas(Array.isArray(progs) ? progs : []);
      } else {
        setProgramas([]);
      }
    } catch (error) {
      console.error("Error cargando programas:", error);
      setProgramas([]);
    }
  }

  useEffect(() => {
    cargarGrupos();
    cargarAreas();
    cargarInstructores();
  }, []);

  useEffect(() => {
    if (areaFormacion) {
      cargarProgramas(areaFormacion);
    } else {
      setProgramas([]);
      setProgramaFormacion("");
    }
  }, [areaFormacion]);

  useEffect(() => {
    if (!numeroGrupo.trim()) {
      setEstadoNumero(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${URL_GRUPOS}/verificar-ficha/${numeroGrupo.trim()}`, {
          headers: getHeaders()
        });

        if (res.ok) {
          const data = await res.json();
          const isDisponible = data?.data?.disponible ?? data?.disponible;
          setEstadoNumero(isDisponible ? "disponible" : "ocupado");
        } else {
          setEstadoNumero(null);
        }
      } catch (error) {
        console.error("Error verificando grupo:", error);
        setEstadoNumero(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [numeroGrupo]);

  const gruposFiltrados = useMemo(() => {
    let filtrados = grupos;

    if (busqueda.trim()) {
      const texto = busqueda.trim().toLowerCase();
      filtrados = filtrados.filter((grupo) => {
        const codigo = grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || "";
        const programa = grupo.programa_formacion?.nombre_programa || grupo.programa || "";
        const jornadaGrupo = grupo.jornada || "";
        return `${codigo} ${programa} ${jornadaGrupo}`.toLowerCase().includes(texto);
      });
    }

    if (filtroEstado) {
      filtrados = filtrados.filter(grupo => (grupo.estado || "ACTIVO") === filtroEstado);
    }

    if (filtroJornada) {
      filtrados = filtrados.filter(grupo => (grupo.jornada || "Manana") === filtroJornada);
    }

    return filtrados;
  }, [busqueda, filtroEstado, filtroJornada, grupos]);

  const totalPaginas = Math.max(1, Math.ceil(gruposFiltrados.length / GRUPOS_POR_PAGINA));
  const inicioPagina = (paginaActual - 1) * GRUPOS_POR_PAGINA;
  const gruposPagina = gruposFiltrados.slice(inicioPagina, inicioPagina + GRUPOS_POR_PAGINA);
  const desde = gruposFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const hasta = Math.min(inicioPagina + GRUPOS_POR_PAGINA, gruposFiltrados.length);
  const mesesEquivalentes = trimestres && !isNaN(trimestres) ? parseInt(trimestres, 10) * 3 : 0;

  function cambiarPagina(nuevaPagina) {
    const paginaSegura = Math.min(Math.max(nuevaPagina, 1), totalPaginas);
    setPaginaActual(paginaSegura);
  }

  function limpiarFormulario() {
    setNumeroGrupo("");
    setAreaFormacion("");
    setJornada("");
    setProgramaFormacion("");
    setInstructorLider("");
    setTrimestres("");
    setFechaInicio("");
    setErrores({});
    setEstadoNumero(null);
  }

  function validarFormulario() {
    const nuevosErrores = {};
    if (!numeroGrupo.trim()) nuevosErrores.numeroGrupo = "Este campo es obligatorio";
    if (estadoNumero === "ocupado") nuevosErrores.numeroGrupo = "Este numero ya esta registrado";
    if (!areaFormacion) nuevosErrores.areaFormacion = "Este campo es obligatorio";
    if (!jornada) nuevosErrores.jornada = "Este campo es obligatorio";
    if (!programaFormacion) nuevosErrores.programaFormacion = "Este campo es obligatorio";
    if (!trimestres || isNaN(trimestres)) nuevosErrores.trimestres = "Este campo es obligatorio";
    if (!fechaInicio) nuevosErrores.fechaInicio = "Este campo es obligatorio";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function guardarGrupo(e) {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      const payload = {
        numero_ficha: numeroGrupo.trim(),
        id_programa: parseInt(programaFormacion, 10),
        jornada,
        id_instructor_lider: instructorLider ? parseInt(instructorLider, 10) : null,
        trimestres: parseInt(trimestres, 10),
        fecha_inicio: fechaInicio
      };

      const res = await fetch(URL_GRUPOS, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });

      const responseData = await res.json().catch(() => null);

      if (res.status === 409) {
        setErrores({ numeroGrupo: "Este numero ya esta registrado" });
        setEstadoNumero("ocupado");
        return;
      }

      if (!res.ok) {
        const errorMsg = responseData?.message || responseData?.error || responseData?.detail || "No fue posible crear el grupo.";
        throw new Error(errorMsg);
      }

      setMensajeError(false);
      setMensaje(`Grupo ${numeroGrupo.trim()} creado correctamente.`);
      setModalCrearAbierto(false);
      limpiarFormulario();
      cargarGrupos();
    } catch (error) {
      console.error("Error guardando grupo:", error);
      setMensajeError(true);
      setMensaje(error.message || "Error de conexion. No se pudo crear el grupo.");
    }
  }

  async function eliminarGrupo(grupo) {
    const idGrupo = grupo.id_grupo || grupo.id;
    if (!idGrupo) return;

    const confirmar = window.confirm("Esta seguro de eliminar este grupo? Se marcara como cerrado.");
    if (!confirmar) return;

    try {
      const res = await fetch(`${URL_GRUPOS}/${idGrupo}/estado`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify({ estado: "CERRADO" })
      });

      const responseData = await res.json().catch(() => null);
      if (!res.ok) {
        throw responseData || { message: "No fue posible eliminar el grupo." };
      }

      setMensajeError(false);
      setMensaje(`Grupo ${obtenerCodigo(grupo)} eliminado correctamente.`);
      cargarGrupos();
    } catch (error) {
      console.error("Error eliminando grupo:", error);
      setMensajeError(true);
      setMensaje(error?.message || error?.error || "No fue posible eliminar el grupo.");
    }
  }

  function obtenerPrograma(grupo) {
    return grupo.programa_formacion?.nombre_programa || grupo.programa || "Analisis y Desarrollo de Software";
  }

  function obtenerCodigo(grupo) {
    return grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || "2847621";
  }

  function obtenerEstadoClase(estado) {
    if (estado === "CERRADO") return "cerrado";
    if (estado === "SUSPENDIDO") return "suspendido";
    return "activo";
  }

  function obtenerNombreInstructor(instructor) {
    if (!instructor) return "Sin asignar";
    const nombres = instructor.usuario?.persona?.nombres || instructor.nombres || "";
    const apellidos = instructor.usuario?.persona?.apellidos || instructor.apellidos || "";
    const nombreCompleto = `${nombres} ${apellidos}`.trim();
    return nombreCompleto || instructor.usuario?.email || `Instructor ${instructor.id_instructor || ''}`;
  }

  return (
    <div className="grupos-page">
      <header className="grupos-header">
        <div>
          <span className="grupos-eyebrow">Programacion academica</span>
          <h1>Gestion de grupos</h1>
          <p>Registra grupos de formacion y consulta su estado academico.</p>
        </div>

        <div className="grupos-header-actions">
          <button
            type="button"
            className="grupos-secondary-btn"
            onClick={() => setMensaje("La carga masiva de grupos aun no tiene endpoint disponible en el backend.")}
          >
            <Upload size={18} />
            Carga masiva
          </button>
          <button type="button" className="grupos-primary-btn" onClick={() => setModalCrearAbierto(true)}>
            <Plus size={19} />
            Crear grupo
          </button>
        </div>
      </header>

      {mensaje && <div className={`grupos-alert ${mensajeError ? "danger" : "info"}`}>{mensaje}</div>}

      <section className="grupos-toolbar">
        <div className="grupos-search">
          <Search size={19} />
          <input
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            placeholder="Buscar por codigo, programa o jornada"
          />
        </div>
        
        <select 
          className="grupos-select-filtro" 
          value={filtroJornada} 
          onChange={(e) => { setFiltroJornada(e.target.value); setPaginaActual(1); }}
        >
          <option value="">Todas las jornadas</option>
          <option value="Manana">Manana</option>
          <option value="Tarde">Tarde</option>
          <option value="Noche">Noche</option>
        </select>

        <select 
          className="grupos-select-filtro" 
          value={filtroEstado} 
          onChange={(e) => { setFiltroEstado(e.target.value); setPaginaActual(1); }}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="CERRADO">Cerrado</option>
          <option value="SUSPENDIDO">Suspendido</option>
        </select>

        <button
          type="button"
          className="ghost"
          onClick={() => {
            setBusqueda("");
            setFiltroEstado("");
            setFiltroJornada("");
            setPaginaActual(1);
          }}
        >
          Limpiar
        </button>
      </section>

      <section className="grupos-card">
        <div className="grupos-card-header">
          <div>
            <h2>Grupos registrados</h2>
            <p>Mostrando {desde}-{hasta} de {gruposFiltrados.length} grupos</p>
          </div>
        </div>

        <div className="grupos-table-wrap">
          <table className="grupos-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Programa</th>
                <th>Jornada</th>
                <th>Aprendices</th>
                <th>Trimestres</th>
                <th>Estado</th>
                <th>Lider</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {gruposPagina.length > 0 ? (
                gruposPagina.map((grupo, index) => (
                  <tr key={grupo.id_grupo || grupo.id || index}>
                    <td className="grupos-highlight">{obtenerCodigo(grupo)}</td>
                    <td>{obtenerPrograma(grupo)}</td>
                    <td>{grupo.jornada || "Manana"}</td>
                    <td>{aprendicesPorGrupo[grupo.id_grupo || grupo.id] ?? grupo.aprendices ?? "-"}</td>
                    <td>{grupo.trimestres || 6}</td>
                    <td>
                      <span className={`grupos-status ${obtenerEstadoClase(grupo.estado)}`}>
                        {grupo.estado || "ACTIVO"}
                      </span>
                    </td>
                    <td>{obtenerNombreInstructor(grupo.instructor_lider)}</td>
                    <td>
                      <div className="grupos-actions">
                        <button type="button" className="grupos-icon-btn" onClick={() => navigate(`/fichas/${grupo.id_grupo || grupo.id || index}`)} title="Ver detalle">
                          <Eye size={16} />
                        </button>
                        <button type="button" className="grupos-icon-btn danger" onClick={() => eliminarGrupo(grupo)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="grupos-empty">No hay grupos para mostrar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {gruposFiltrados.length > GRUPOS_POR_PAGINA && (
          <div className="grupos-pagination">
            <span>Pagina {paginaActual} de {totalPaginas}</span>
            <div>
              <button type="button" onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 1}>Anterior</button>
              {Array.from({ length: totalPaginas }, (_, index) => index + 1).map((pagina) => (
                <button key={pagina} type="button" className={pagina === paginaActual ? "active" : ""} onClick={() => cambiarPagina(pagina)}>
                  {pagina}
                </button>
              ))}
              <button type="button" onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas}>Siguiente</button>
            </div>
          </div>
        )}
      </section>

      {modalCrearAbierto && (
        <div className="grupos-modal-backdrop" role="presentation">
          <section className="grupos-modal" role="dialog" aria-modal="true" aria-labelledby="crear-grupo-title">
            <div className="grupos-modal-header">
              <div>
                <span className="grupos-eyebrow">Nuevo grupo formativo</span>
                <h2 id="crear-grupo-title">Crear grupo</h2>
                <p>Completa la informacion obligatoria para habilitar el grupo.</p>
              </div>
            </div>

            <form className="grupos-form" onSubmit={guardarGrupo}>
              <div className="grupos-form-grid">
                <label>
                  <span>Numero de grupo</span>
                  <input value={numeroGrupo} onChange={(e) => setNumeroGrupo(e.target.value)} className={errores.numeroGrupo ? "invalid" : ""} />
                  {estadoNumero === "disponible" && !errores.numeroGrupo && <small className="success">Numero disponible</small>}
                  {errores.numeroGrupo && <small className="error">{errores.numeroGrupo}</small>}
                </label>

                <label>
                  <span>Area de formacion</span>
                  <select value={areaFormacion} onChange={(e) => setAreaFormacion(e.target.value)} className={errores.areaFormacion ? "invalid" : ""}>
                    <option value="">Seleccione</option>
                    {areas.map((area) => (
                      <option key={area.id_area} value={area.id_area}>{area.nombre_area || area.nombre}</option>
                    ))}
                  </select>
                  {errores.areaFormacion && <small className="error">{errores.areaFormacion}</small>}
                </label>
              </div>

              <div className="grupos-form-grid">
                <label>
                  <span>Programa de formacion</span>
                  <select value={programaFormacion} onChange={(e) => setProgramaFormacion(e.target.value)} disabled={!areaFormacion} className={errores.programaFormacion ? "invalid" : ""}>
                    <option value="">Seleccione</option>
                    {programas.map((programa) => (
                      <option key={programa.id_programa} value={programa.id_programa}>{programa.nombre_programa}</option>
                    ))}
                  </select>
                  {!areaFormacion && <small>Selecciona un area primero</small>}
                  {errores.programaFormacion && <small className="error">{errores.programaFormacion}</small>}
                </label>

                <label>
                  <span>Jornada academica</span>
                  <select value={jornada} onChange={(e) => setJornada(e.target.value)} className={errores.jornada ? "invalid" : ""}>
                    <option value="">Seleccione</option>
                    <option value="Manana">Manana - 6:00 am a 12:00 m</option>
                    <option value="Tarde">Tarde - 12:00 m a 6:00 pm</option>
                    <option value="Noche">Noche - 6:00 pm a 10:00 pm</option>
                  </select>
                  {errores.jornada && <small className="error">{errores.jornada}</small>}
                </label>
              </div>

              <div className="grupos-form-grid">
                <label>
                  <span>Instructor lider</span>
                  <select value={instructorLider} onChange={(e) => setInstructorLider(e.target.value)}>
                    <option value="">Seleccione instructor</option>
                    {instructores.map((instructor) => (
                      <option key={instructor.id_instructor} value={instructor.id_instructor}>
                        {obtenerNombreInstructor(instructor)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Duracion en trimestres</span>
                  <input type="number" min="1" value={trimestres} onChange={(e) => setTrimestres(e.target.value)} className={errores.trimestres ? "invalid" : ""} />
                  {!errores.trimestres && trimestres && <small>Equivale a {mesesEquivalentes} meses de formacion</small>}
                  {errores.trimestres && <small className="error">{errores.trimestres}</small>}
                </label>
              </div>

              <div className="grupos-form-grid">
                <label>
                  <span>Fecha de inicio</span>
                  <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className={errores.fechaInicio ? "invalid" : ""} />
                  {errores.fechaInicio && <small className="error">{errores.fechaInicio}</small>}
                </label>
              </div>

              <div className="grupos-info-box">
                <Layers size={19} />
                <p>Una vez creado, el grupo quedara disponible para asignar aprendices, instructor lider y horarios.</p>
              </div>

              <div className="grupos-modal-actions">
                <button type="button" className="grupos-secondary-btn" onClick={() => { limpiarFormulario(); setModalCrearAbierto(false); }}>
                  Cancelar
                </button>
                <button type="submit" className="grupos-primary-btn">Crear grupo</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}



