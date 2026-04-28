import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Row, Col, Table } from "react-bootstrap";
import "./GruposFormativos.css";

export default function GruposFormativos() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarToast, setMostrarToast] = useState(false);
  const [mensajeToast, setMensajeToast] = useState("");
  const [toastError, setToastError] = useState(false);

  // Estados de datos
  const [grupos, setGrupos] = useState([]);
  const [areas, setAreas] = useState([]);

  // Estados del formulario
  const [numeroGrupo, setNumeroGrupo] = useState("");
  const [areaFormacion, setAreaFormacion] = useState("");
  const [jornada, setJornada] = useState("");
  const [programaFormacion, setProgramaFormacion] = useState("");
  const [trimestres, setTrimestres] = useState("");
  const [instructorLider, setInstructorLider] = useState("");
  const [instructores, setInstructores] = useState([]);
  const [programas, setProgramas] = useState([]);

  // Validaciones
  const [errores, setErrores] = useState({});
  const [estadoNumero, setEstadoNumero] = useState(null); // 'disponible', 'ocupado', 'buscando', null
  const API_URL = "/api";

  const navigate = useNavigate();

  useEffect(() => {
    cargarGrupos();
    cargarAreas();
    cargarInstructores();
  }, []);

  const cargarInstructores = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const users = data.results || data.data || data;
        setInstructores(users.length > 0 ? users : [
          { id_usuario: "1", nombre: "Carlos Pérez (Demo)" },
          { id_usuario: "2", nombre: "María Gómez (Demo)" }
        ]);
      } else {
        setInstructores([
          { id_usuario: "1", nombre: "Carlos Pérez (Demo)" },
          { id_usuario: "2", nombre: "María Gómez (Demo)" }
        ]);
      }
    } catch (error) {
      setInstructores([
        { id_usuario: "1", nombre: "Carlos Pérez (Demo)" },
        { id_usuario: "2", nombre: "María Gómez (Demo)" }
      ]);
    }
  };

  const getHeaders = () => {
    const token = localStorage.getItem("access") || localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const cargarGrupos = async () => {
    try {
      const res = await fetch(`${API_URL}/groups`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const gruposExtraidos = data?.data?.grupos || data?.data || data?.results || [];
        setGrupos(Array.isArray(gruposExtraidos) ? gruposExtraidos : []);
      } else {
        setGrupos([]);
      }
    } catch (error) {
      console.error("Error cargando grupos:", error);
    }
  };

  const cargarAreas = async () => {
    try {
      const res = await fetch(`${API_URL}/areas`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const areasExtraidas = data?.data || data?.results || [];
        setAreas(Array.isArray(areasExtraidas) ? areasExtraidas : []);
      }
    } catch (error) { }
  };

  useEffect(() => {
    if (areaFormacion) {
      cargarProgramas(areaFormacion);
    } else {
      setProgramas([]);
      setProgramaFormacion("");
    }
  }, [areaFormacion]);

  const cargarProgramas = async (idArea) => {
    try {
      const res = await fetch(`${API_URL}/formative-programs/area/${idArea}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const progs = data?.data || data?.results || [];
        setProgramas(progs);
      } else {
        setProgramas([]);
      }
    } catch (error) {
      console.error("Error al cargar programas", error);
      setProgramas([]);
    }
  };

  useEffect(() => {
    if (!numeroGrupo.trim()) {
      setEstadoNumero(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/groups/verify/${numeroGrupo.trim()}`, {
          headers: getHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          const isDisponible = data?.data?.disponible ?? data?.disponible;
          setEstadoNumero(isDisponible ? "disponible" : "ocupado");
        } else {
          setEstadoNumero(null);
        }
      } catch (error) {
        setEstadoNumero(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [numeroGrupo]);

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!numeroGrupo.trim()) nuevosErrores.numeroGrupo = "Este campo es obligatorio";
    if (estadoNumero === "ocupado") nuevosErrores.numeroGrupo = "Este número ya está registrado";
    if (!areaFormacion) nuevosErrores.areaFormacion = "Este campo es obligatorio";
    if (!jornada) nuevosErrores.jornada = "Este campo es obligatorio";
    if (!programaFormacion.trim()) nuevosErrores.programaFormacion = "Este campo es obligatorio";
    if (!trimestres || isNaN(trimestres)) nuevosErrores.trimestres = "Este campo es obligatorio";

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarGrupo = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    try {
      const payload = {
        numero_ficha: numeroGrupo.trim(),
        id_programa: parseInt(programaFormacion, 10),
        jornada: jornada,
        id_instructor_lider: instructorLider || null,
        trimestres: parseInt(trimestres, 10),
      };

      const res = await fetch(`${API_URL}/groups`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        setErrores({ ...errores, numeroGrupo: "Este número ya está registrado" });
        setEstadoNumero("ocupado");
        return;
      }

      if (res.ok) {
        const creadoNumero = numeroGrupo.trim();
        setToastError(false);
        setMensajeToast(`Grupo ${creadoNumero} creado correctamente. Redirigiendo al listado...`);
        setMostrarToast(true);
        setMostrarFormulario(false);
        limpiarFormulario();
        cargarGrupos();
        setTimeout(() => {
          setMostrarToast(false);
          setMensajeToast("");
        }, 3000);
      } else {
        setToastError(true);
        setMensajeToast("No fue posible crear el grupo. Verifica los datos e intenta de nuevo.");
        setMostrarToast(true);
        setTimeout(() => {
          setMostrarToast(false);
          setMensajeToast("");
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      setToastError(true);
      setMensajeToast("Error de conexión. No se pudo crear el grupo.");
      setMostrarToast(true);
      setTimeout(() => {
        setMostrarToast(false);
        setMensajeToast("");
      }, 3000);
    }
  };

  const limpiarFormulario = () => {
    setNumeroGrupo("");
    setAreaFormacion("");
    setJornada("");
    setProgramaFormacion("");
    setInstructorLider("");
    setTrimestres("");
    setErrores({});
    setEstadoNumero(null);
  };

  const mesesEquivalentes = trimestres && !isNaN(trimestres) ? parseInt(trimestres) * 3 : 0;

  return (
    <>
      <div className="sima-content-wrapper">
        <div className="sima-page-header">
          <div>
            <h1 className="sima-page-title">Mis grupos</h1>
            <p className="sima-page-subtitle">Registro y consulta de grupos de formación</p>
          </div>
          {!mostrarFormulario && (
            <button
              className="sima-btn-primary"
              onClick={() => setMostrarFormulario(true)}
            >
              + NUEVO GRUPO
            </button>
          )}
        </div>

        {mostrarFormulario ? (
          <div className="sima-card" style={{ padding: "40px" }}>
            <div className="sima-card-title">CREAR NUEVO GRUPO FORMATIVO
            </div>

            <Form onSubmit={guardarGrupo}>
              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="sima-form-label">Número de grupo<span>*</span></Form.Label>
                    <Form.Control
                      type="text"
                      className={`sima-input ${errores.numeroGrupo ? "is-invalid" : ""} ${estadoNumero === "disponible" ? "is-valid" : ""}`}
                      value={numeroGrupo}
                      onChange={(e) => setNumeroGrupo(e.target.value)}
                    />
                    {estadoNumero === "disponible" && !errores.numeroGrupo && (
                      <span className="sima-feedback-success">✓ Numero disponible</span>
                    )}
                    {errores.numeroGrupo && (
                      <span className="sima-feedback-error">✕ {errores.numeroGrupo}</span>
                    )}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="sima-form-label">Area de formacion <span>*</span></Form.Label>
                    <Form.Select
                      className={`sima-input ${errores.areaFormacion ? "is-invalid" : ""}`}
                      value={areaFormacion}
                      onChange={(e) => setAreaFormacion(e.target.value)}
                    >
                      <option value="">Seleccione...</option>
                      {areas.map(a => (
                        <option key={a.id_area} value={a.id_area}>
                          {a.nombre_area || a.nombre}
                        </option>
                      ))}
                    </Form.Select>
                    {errores.areaFormacion && <span className="sima-feedback-error">✕ {errores.areaFormacion}</span>}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="sima-form-label">Jornada academica <span>*</span></Form.Label>
                    <Form.Select
                      className={`sima-input ${errores.jornada ? "is-invalid" : ""}`}
                      value={jornada}
                      onChange={(e) => setJornada(e.target.value)}
                    >
                      <option value="">Seleccione...</option>
                      <option value="Mañana">Mañana - 6:00 am a 12:00 m</option>
                      <option value="Tarde">Tarde - 12:00 m a 6:00 pm</option>
                      <option value="Noche">Noche - 6:00 pm a 10:00 pm</option>
                    </Form.Select>
                    {errores.jornada && <span className="sima-feedback-error">✕ {errores.jornada}</span>}
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mb-4">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="sima-form-label">Programa de formacion <span>*</span></Form.Label>
                    <Form.Select
                      className={`sima-input ${errores.programaFormacion ? "is-invalid" : ""}`}
                      value={programaFormacion}
                      onChange={(e) => setProgramaFormacion(e.target.value)}
                      disabled={!areaFormacion}
                    >
                      <option value="">Selecciona un programa</option>
                      {programas.map((prog, idx) => (
                        <option key={idx} value={prog.id_programa}>
                          {prog.nombre_programa}
                        </option>
                      ))}
                    </Form.Select>
                    {errores.programaFormacion && <span className="sima-feedback-error">✕ {errores.programaFormacion}</span>}
                    {!areaFormacion && <span className="sima-hint">Selecciona un área primero</span>}
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="sima-form-label">Instructor Lider</Form.Label>
                    <Form.Select
                      className="sima-input"
                      value={instructorLider}
                      onChange={(e) => setInstructorLider(e.target.value)}
                    >
                      <option value="">Seleccionar Usuario</option>
                      {instructores.map(i => (
                        <option key={i.id_usuario || i.id} value={i.id_usuario || i.id}>
                          {i.nombre_completo || i.nombre || "Instructor"}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="sima-form-label">Duracion de trimestre <span>*</span></Form.Label>
                    <Form.Control
                      type="number"
                      className={`sima-input ${errores.trimestres ? "is-invalid" : ""}`}
                      value={trimestres}
                      onChange={(e) => setTrimestres(e.target.value)}
                      min="1"
                    />
                    {!errores.trimestres && trimestres && (
                      <span className="sima-hint">Equivale a {mesesEquivalentes} meses de formación</span>
                    )}
                    {errores.trimestres && <span className="sima-feedback-error">✕ {errores.trimestres}</span>}
                  </Form.Group>
                </Col>
              </Row>

              <div className="sima-info-box">
                <p>
                  El estado inicial de la ficha será <strong>Activo</strong> y estará disponible inmediatamente para vincular aprendices.
                </p>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  className="sima-btn-outline"
                  onClick={() => {
                    setMostrarFormulario(false);
                    limpiarFormulario();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="sima-btn-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  CREAR GRUPO
                </button>
              </div>
            </Form>
          </div>
        ) : (
          <div className="sima-card">
            <div className="sima-table-header-flex">
              <h3 className="sima-table-header-title">GRUPOS REGISTRADOS</h3>
              <div className="sima-table-filters">
                <button className="sima-filter-btn">
                  Jornada
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <button className="sima-filter-btn">
                  Todos
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
              </div>
            </div>

            <Table className="sima-table" responsive>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Programa</th>
                  <th>Jornada</th>
                  <th className="text-center">Aprendices</th>
                  <th className="text-center">Trimestres</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {grupos.length > 0 ? (
                  grupos.map((g, idx) => {
                    const codigoFicha = g.numero_ficha || g.numero_grupo || g.codigo || "2847621";
                    return (
                      <tr
                        key={idx}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/coordinador/ficha/${codigoFicha}`)}
                        title="Ver dashboard del grupo"
                      >
                        <td className="sima-td-highlight">{codigoFicha}</td>
                        <td className="sima-td-highlight">
                          {g.programa_formacion?.nombre_programa || g.programa || "Análisis y Desarrollo de Software"}
                        </td>
                        <td>{g.jornada || "Mañana"}</td>
                        <td className="text-center">{g.aprendices !== undefined ? g.aprendices : 24}</td>
                        <td className="text-center">{g.trimestres || 6}</td>
                        <td className="text-center">
                          <span className={`sima-badge-table ${
                            g.estado === 'CERRADO' ? 'sima-bg-desactiva'
                            : g.estado === 'SUSPENDIDO' ? 'sima-bg-espera'
                            : 'sima-bg-activa'
                          }`}>
                            {g.estado || 'ACTIVO'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  // Mock data explícito por si el usuario no tiene la BD arriba y quiere ver el disenho idéntico
                  <>
                    <tr style={{ cursor: "pointer" }} onClick={() => navigate("/coordinador/ficha/2847621")} title="Ver dashboard">
                      <td className="sima-td-highlight">2847621</td>
                      <td className="sima-td-highlight">Análisis y Desarrollo de Software</td>
                      <td>Mañana</td>
                      <td className="text-center">32</td>
                      <td className="text-center">6</td>
                      <td className="text-center"><span className="sima-badge-table sima-bg-activa">ACTIVO</span></td>
                    </tr>
                    <tr style={{ cursor: "pointer" }} onClick={() => navigate("/coordinador/ficha/2068574")} title="Ver dashboard">
                      <td className="sima-td-highlight">2068574</td>
                      <td className="sima-td-highlight">Redes y Comunicación de Datos</td>
                      <td>Tarde</td>
                      <td className="text-center">28</td>
                      <td className="text-center">4</td>
                      <td className="text-center"><span className="sima-badge-table sima-bg-espera">SUSPENDIDO</span></td>
                    </tr>
                    <tr style={{ cursor: "pointer" }} onClick={() => navigate("/coordinador/ficha/3064975")} title="Ver dashboard">
                      <td className="sima-td-highlight">3064975</td>
                      <td className="sima-td-highlight">Contabilidad y Finanzas</td>
                      <td>Mañana</td>
                      <td className="text-center">19</td>
                      <td className="text-center">3</td>
                      <td className="text-center"><span className="sima-badge-table sima-bg-desactiva">CERRADO</span></td>
                    </tr>
                  </>
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>
      {/* Toast Animado */}
      {mostrarToast && (
        <div style={{
          position: "fixed", top: "30px", right: "30px", backgroundColor: toastError ? "#d11a2a" : "#39d10a", color: "white", padding: "16px 24px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", display: "flex", alignItems: "center", gap: "12px", fontWeight: "bold", zIndex: 9999, animation: "slideUp 0.3s ease-out", minWidth: "360px"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          {mensajeToast || (toastError ? "No fue posible crear el grupo." : "Grupo creado correctamente. Redirigiendo al listado...")}
        </div>
      )}
    </>
  );
}
