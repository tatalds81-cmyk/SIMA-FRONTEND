import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Search, Layers } from "lucide-react";
import "../fichas/fichas.css"; // Reuse the same CSS

export default function MisGrupos() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroJornada, setFiltroJornada] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [grupos, setGrupos] = useState([]);
  const [loading, setLoading] = useState(false);

  const GRUPOS_POR_PAGINA = 10;
  const API_URL = "/api";

  function getHeaders() {
    const token = localStorage.getItem("access") || localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token && token !== "undefined") headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  async function cargarGruposInstructor() {
    setLoading(true);
    try {
      // Si existiera un endpoint real seria algo como /api/instructor/grupos
      // Por ahora consumimos /api/groups y simulamos que son los del instructor
      const res = await fetch(`${API_URL}/groups`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const gruposExtraidos =
          data?.data?.grupos ||
          data?.data?.fichas ||
          data?.data ||
          data?.results ||
          (Array.isArray(data) ? data : []);

        setGrupos(Array.isArray(gruposExtraidos) ? gruposExtraidos : []);
      }
    } catch (error) {
      console.error("Error cargando grupos del instructor:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarGruposInstructor();
  }, []);

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

  function cambiarPagina(nuevaPagina) {
    const paginaSegura = Math.min(Math.max(nuevaPagina, 1), totalPaginas);
    setPaginaActual(paginaSegura);
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

  return (
    <div className="grupos-page">
      <header className="grupos-header">
        <div>
          <span className="grupos-eyebrow">Area del Instructor</span>
          <h1>Mis Grupos Asignados</h1>
          <p>Consulta los grupos donde eres instructor lider o estas asignado.</p>
        </div>
      </header>

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
            <h2>Grupos Activos</h2>
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
                <th>Trimestres</th>
                <th>Estado</th>
                <th aria-label="Acciones">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="grupos-empty">Cargando grupos...</td>
                </tr>
              ) : gruposPagina.length > 0 ? (
                gruposPagina.map((grupo, index) => (
                  <tr key={grupo.id_grupo || grupo.id || index}>
                    <td className="grupos-highlight">{obtenerCodigo(grupo)}</td>
                    <td>{obtenerPrograma(grupo)}</td>
                    <td>{grupo.jornada || "Manana"}</td>
                    <td>{grupo.trimestres || 6}</td>
                    <td>
                      <span className={`grupos-status ${obtenerEstadoClase(grupo.estado)}`}>
                        {grupo.estado || "ACTIVO"}
                      </span>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="grupos-icon-btn" 
                        onClick={() => navigate(`/fichas/${grupo.id_grupo || grupo.id || index}`)} 
                        title="Ver informacion academica"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="grupos-empty">
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px'}}>
                      <Layers size={32} style={{opacity: 0.5}} />
                      <span>No tienes grupos asignados que coincidan con la busqueda</span>
                    </div>
                  </td>
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
    </div>
  );
}
