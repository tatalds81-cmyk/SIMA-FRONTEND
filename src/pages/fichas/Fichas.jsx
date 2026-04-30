import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./fichas.css";

export default function Fichas() {
  const navigate = useNavigate();
  const [vistaActual, setVistaActual] = useState("LISTA"); // LISTA o CREAR
  
  // Data de listas
  const [grupos, setGrupos] = useState([]);
  const [areas, setAreas] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [instructores, setInstructores] = useState([]);
  
  // Estados para validación y feedback
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [fichaValida, setFichaValida] = useState(null); // null, true, false
  const [validandoFicha, setValidandoFicha] = useState(false);

  // Eliminar filtro seleccionado
  const removerFiltro = (tipo) => {
    setFiltros({ ...filtros, [tipo]: "" });
    setPaginaActual(1);
  };

  const handleCambiarEstado = async (e, grupo) => {
    e.stopPropagation();
    const nuevoEstado = grupo.estado === "ACTIVO" ? "SUSPENDIDO" : "ACTIVO";
    const confirmar = window.confirm(`¿Seguro que deseas cambiar el estado de la ficha ${grupo.numero_ficha} a ${nuevoEstado}?`);
    if (!confirmar) return;

    try {
      const token = localStorage.getItem("access");
      const res = await fetch(`${URL_BASE}/groups/${grupo.id_grupo}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      if (!res.ok) throw await res.json();
      
      cargarGrupos();
    } catch (err) {
      console.error(err);
      alert("Error al cambiar estado");
    }
  };

  const handleEditar = (e, grupo) => {
    e.stopPropagation();
    alert(`Funcionalidad de edición para la ficha ${grupo.numero_ficha} en construcción.`);
  };

  // Formulario de creación
  const [form, setForm] = useState({
    numero_ficha: "",
    id_area: "",
    id_programa: "",
    jornada: "",
    id_instructor_lider: "",
    trimestres: "",
    fecha_inicio: new Date().toISOString().split("T")[0], // Fecha default hoy
  });

  const URL_BASE = "/api";

  useEffect(() => {
    if (vistaActual === "LISTA") {
      cargarGrupos();
    } else if (vistaActual === "CREAR") {
      cargarDatosInicialesFormulario();
    }
  }, [vistaActual]);

  function obtenerHeaders() {
    const token = localStorage.getItem("access");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // --- MÉTODOS PARA LISTA ---
  async function cargarGrupos() {
    try {
      setError("");
      const res = await fetch(`${URL_BASE}/groups`, {
        method: "GET",
        headers: obtenerHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setGrupos(data.data.grupos || []);
    } catch (err) {
      console.log("Error grupos:", err);
      setError(err?.message || err?.error || "Error al cargar grupos");
    }
  }

  // --- MÉTODOS PARA CREACIÓN ---
  async function cargarDatosInicialesFormulario() {
    try {
      setError("");
      // 1. Obtener usuario actual para saber su ID
      const resMe = await fetch(`${URL_BASE}/auth/me`, {
        headers: obtenerHeaders(),
      });
      const dataMe = await resMe.json();
      if (!resMe.ok) throw dataMe;
      const idUsuario = dataMe.data.id_usuario;

      // 2. Obtener áreas del coordinador
      const resAreas = await fetch(`${URL_BASE}/coordinator-areas/${idUsuario}`, {
        headers: obtenerHeaders(),
      });
      const dataAreas = await resAreas.json();
      if (resAreas.ok) {
        setAreas(dataAreas.data || []);
      }

      // 3. Obtener instructores disponibles
      const resInst = await fetch(`${URL_BASE}/groups/instructores-disponibles`, {
        headers: obtenerHeaders(),
      });
      const dataInst = await resInst.json();
      if (resInst.ok) {
        setInstructores(dataInst.data || []);
      }
    } catch (err) {
      console.log("Error datos iniciales:", err);
      setError(err?.message || "Error al cargar datos del formulario");
    }
  }

  async function cargarProgramas(idArea) {
    if (!idArea) {
      setProgramas([]);
      return;
    }
    try {
      const res = await fetch(`${URL_BASE}/formative-programs/area/${idArea}`, {
        headers: obtenerHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setProgramas(data.data || []);
      }
    } catch (err) {
      console.log("Error programas:", err);
    }
  }

  // --- HANDLERS DEL FORMULARIO ---
  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "id_area") {
      cargarProgramas(value);
      setForm((prev) => ({ ...prev, id_programa: "" })); // Reset programa
    }

    if (name === "numero_ficha") {
      setFichaValida(null); // Reset validación si cambia
    }
  }

  async function handleBlurFicha() {
    if (!form.numero_ficha.trim()) {
      setFichaValida(null);
      return;
    }
    setValidandoFicha(true);
    try {
      const res = await fetch(`${URL_BASE}/groups/verificar-ficha/${form.numero_ficha}`, {
        headers: obtenerHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setFichaValida(data.data.disponible);
      }
    } catch (err) {
      console.log("Error verificando ficha:", err);
    } finally {
      setValidandoFicha(false);
    }
  }

  function limpiarFormulario() {
    setForm({
      numero_ficha: "",
      id_area: "",
      id_programa: "",
      jornada: "",
      id_instructor_lider: "",
      trimestres: "",
      fecha_inicio: new Date().toISOString().split("T")[0],
    });
    setFichaValida(null);
  }

  async function guardarGrupo(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (fichaValida === false) {
      setError("El número de ficha no está disponible.");
      return;
    }

    const dataAEnviar = {
      numero_ficha: form.numero_ficha.trim(),
      id_programa: Number(form.id_programa),
      jornada: form.jornada,
      trimestres: Number(form.trimestres),
      fecha_inicio: form.fecha_inicio,
    };

    if (form.id_instructor_lider) {
      dataAEnviar.id_instructor_lider = Number(form.id_instructor_lider);
    }

    try {
      const res = await fetch(`${URL_BASE}/groups`, {
        method: "POST",
        headers: obtenerHeaders(),
        body: JSON.stringify(dataAEnviar),
      });

      const respuesta = await res.json();

      if (!res.ok) {
        throw respuesta;
      }

      setMensaje(respuesta?.message || "Grupo creado correctamente");
      limpiarFormulario();
      setVistaActual("LISTA");
    } catch (err) {
      console.log("Error crear:", err);
      setError(err?.message || err?.error || "Error al crear grupo");
    }
  }

  // --- RENDERIZADO CONDICIONAL ---
  
  if (vistaActual === "CREAR") {
    return (
      <div className="fichas-modulo">
        <div className="fichas-header">
          <div>
            <h1 className="fichas-titulo">Mis grupos</h1>
            <p className="fichas-subtitulo">Registro y consulta de grupos de formación</p>
          </div>
          <button className="fichas-btn-nuevo" onClick={() => setVistaActual("LISTA")}>
            VOLVER A LISTA
          </button>
        </div>

        {error && <div className="fichas-alerta error">{error}</div>}

        <div className="fichas-card-form">
          <h2 className="fichas-section-title">CREAR NUEVO GRUPO FORMATIVO</h2>

          <form onSubmit={guardarGrupo} className="fichas-form">
            <div className="fichas-row">
              <div className="fichas-input-group">
                <label>Número de grupo *</label>
                <input
                  type="text"
                  name="numero_ficha"
                  value={form.numero_ficha}
                  onChange={handleChange}
                  onBlur={handleBlurFicha}
                  className={fichaValida === true ? "input-success" : fichaValida === false ? "input-error" : ""}
                  required
                />
                {validandoFicha && <span className="text-info">Validando...</span>}
                {fichaValida === true && <span className="text-success">✓ Número disponible</span>}
                {fichaValida === false && <span className="text-error">✗ Número no disponible</span>}
              </div>

              <div className="fichas-input-group">
                <label>Area de formacion *</label>
                <select name="id_area" value={form.id_area} onChange={handleChange} required>
                  <option value="">Seleccionar Area</option>
                  {areas.map(item => (
                    <option key={item.id_area} value={item.id_area}>{item.area?.nombre_area}</option>
                  ))}
                </select>
              </div>

              <div className="fichas-input-group">
                <label>Jornada academica *</label>
                <select name="jornada" value={form.jornada} onChange={handleChange} required>
                  <option value="">Seleccionar Jornada</option>
                  <option value="Mañana">Mañana - 6:00 am a 12:00 m</option>
                  <option value="Tarde">Tarde - 12:00 m a 6:00 pm</option>
                  <option value="Noche">Noche - 6:00 pm a 10:00 pm</option>
                  <option value="Mixta">Mixta</option>
                </select>
              </div>
            </div>

            <div className="fichas-row">
              <div className="fichas-input-group">
                <label>Programa de formacion *</label>
                <select name="id_programa" value={form.id_programa} onChange={handleChange} required disabled={!form.id_area}>
                  <option value="">Seleccionar Programa</option>
                  {programas.map(prog => (
                    <option key={prog.id_programa} value={prog.id_programa}>{prog.nombre_programa}</option>
                  ))}
                </select>
              </div>

              <div className="fichas-input-group">
                <label>Instructor Lider</label>
                <select name="id_instructor_lider" value={form.id_instructor_lider} onChange={handleChange}>
                  <option value="">Seleccionar Usuario</option>
                  {instructores.map(inst => (
                    <option key={inst.id_instructor} value={inst.id_instructor}>
                      {inst.usuario?.persona?.nombres} {inst.usuario?.persona?.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fichas-input-group">
                <label>Duracion de trimestre *</label>
                <input
                  type="number"
                  name="trimestres"
                  min="1"
                  value={form.trimestres}
                  onChange={handleChange}
                  required
                />
                {form.trimestres && <span className="text-info-small">Equivale a {form.trimestres * 3} meses de formación</span>}
              </div>
            </div>

            <div className="fichas-info-box">
              El sistema registrará automáticamente la <strong>fecha de creación</strong> y el <strong>usuario responsable</strong>. 
              El estado inicial de la ficha será <strong>Activa</strong> y estará disponible inmediatamente para vincular aprendices.
            </div>

            <div className="fichas-actions">
              <button type="button" className="fichas-btn-cancelar" onClick={() => { limpiarFormulario(); setVistaActual("LISTA"); }}>Cancelar</button>
              <button type="submit" className="fichas-btn-submit" disabled={fichaValida === false}>✓ CREAR GRUPO</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- VISTA LISTA ---
  return (
    <div className="fichas-modulo">
      <div className="fichas-header">
        <div>
          <h1 className="fichas-titulo">Mis grupos</h1>
          <p className="fichas-subtitulo">Registro y consulta de grupos de formación</p>
        </div>
        <button className="fichas-btn-nuevo" onClick={() => setVistaActual("CREAR")}>
          + NUEVO GRUPO
        </button>
      </div>

      {mensaje && <div className="fichas-alerta info">{mensaje}</div>}
      {error && <div className="fichas-alerta error">{error}</div>}

      <div className="fichas-card-list">
        <div className="fichas-list-header">
          <h2 className="fichas-section-title">GRUPOS REGISTRADOS</h2>
          <div className="fichas-filters">
            <button className="fichas-filter-btn">Jornada ∨</button>
            <button className="fichas-filter-btn">Todos ∨</button>
          </div>
        </div>

        <div className="fichas-tabla-contenedor">
          <table className="fichas-tabla">
            <thead>
              <tr>
                <th>Código</th>
                <th>Programa</th>
                <th>Jornada</th>
                <th>Aprendices</th>
                <th>Trimestres</th>
                <th>Estado</th>
                <th>Instructor Lider</th>
                <th style={{ textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length > 0 ? (
                grupos.map((grupo) => (
                  <tr 
                    key={grupo.id_grupo} 
                    onClick={() => navigate(`/fichas/${grupo.id_grupo}`)}
                    style={{ cursor: "pointer" }}
                    className="fichas-row-hover"
                  >
                    <td className="text-green-bold">{grupo.numero_ficha}</td>
                    <td>{grupo.programa_formacion?.nombre_programa}</td>
                    <td>{grupo.jornada}</td>
                    <td>-</td>
                    <td>{grupo.trimestres}</td>
                    <td>
                      <span className={`fichas-badge ${grupo.estado === "ACTIVO" ? "activo" : "espera"}`}>
                        {grupo.estado === "ACTIVO" ? "Activa" : "Suspendida"}
                      </span>
                    </td>
                    <td>
                      {grupo.instructor_lider?.usuario?.persona
                        ? `${grupo.instructor_lider.usuario.persona.nombres} ${grupo.instructor_lider.usuario.persona.apellidos}`
                        : "Sin asignar"}
                    </td>
                    <td style={{ textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button 
                        className="btn-accion btn-accion-editar"
                        onClick={(e) => handleEditar(e, grupo)}
                      >
                        Editar
                      </button>
                      <button 
                        className={`btn-accion ${grupo.estado === "ACTIVO" ? "btn-accion-suspender" : "btn-accion-activar"}`}
                        onClick={(e) => handleCambiarEstado(e, grupo)}
                      >
                        {grupo.estado === "ACTIVO" ? "Suspender" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="fichas-text-center">No hay grupos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
