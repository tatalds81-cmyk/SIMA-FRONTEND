import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Edit3, Save } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import "./fichas.css";

export default function GrupoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grupo, setGrupo] = useState(null);
  const [aprendicesGrupo, setAprendicesGrupo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [detalleModoEdicion, setDetalleModoEdicion] = useState(false);
  const [detalleForm, setDetalleForm] = useState({
    numero_ficha: "",
    jornada: "",
    trimestres: "",
    fecha_inicio: ""
  });

  useEffect(() => {
    let activo = true;

    async function cargarDetalle() {
      try {
        const token = localStorage.getItem("access") || localStorage.getItem("token");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [grupoRes, aprendicesRes] = await Promise.all([
          fetch(`/api/groups/${id}`, { method: "GET", headers }),
          fetch(`/api/apprentices/grupo/${id}`, { method: "GET", headers })
        ]);

        const grupoData = await grupoRes.json().catch(() => null);
        const aprendicesData = await aprendicesRes.json().catch(() => null);

        if (!grupoRes.ok) throw grupoData;

        if (activo) {
          const grupoActual = grupoData?.data || null;
          const listaAprendices =
            aprendicesData?.data?.aprendices ||
            aprendicesData?.data?.items ||
            aprendicesData?.data ||
            [];

          setGrupo(grupoActual);
          setAprendicesGrupo(Array.isArray(listaAprendices) ? listaAprendices : []);
          setDetalleForm({
            numero_ficha: grupoActual?.numero_ficha || "",
            jornada: grupoActual?.jornada || "",
            trimestres: grupoActual?.trimestres || "",
            fecha_inicio: grupoActual?.fecha_inicio || ""
          });
          setError("");
        }
      } catch (err) {
        console.log("Error al cargar detalle:", err);
        if (activo) {
          setError(err?.message || err?.error || "Error al cargar la informacion del grupo");
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarDetalle();
    return () => {
      activo = false;
    };
  }, [id]);

  const detalle = useMemo(() => {
    if (!grupo) return null;

    const estado = `${grupo.estado || "ACTIVO"}`.toUpperCase();
    const estadoTexto = estado === "SUSPENDIDO" ? "En espera" : estado === "CERRADO" ? "Cerrada" : "Activa";
    const estadoClase = estado === "SUSPENDIDO" ? "suspendido" : estado === "CERRADO" ? "cerrado" : "activo";

    const personaInstructor = grupo.instructor_lider?.usuario?.persona;
    const instructor = personaInstructor
      ? `${personaInstructor.nombres} ${personaInstructor.apellidos}`
      : "Sin asignar";

    const iniciales = personaInstructor
      ? `${personaInstructor.nombres.charAt(0)}${personaInstructor.apellidos.charAt(0)}`
      : "?";

    return {
      ficha: grupo.numero_ficha || grupo.numero_grupo || grupo.codigo || id,
      estadoTexto,
      estadoClase,
      area: grupo.programa_formacion?.area?.nombre_area || "No especificada",
      programa: grupo.programa_formacion?.nombre_programa || "No especificado",
      jornada: grupo.jornada || "No especificada",
      trimestres: grupo.trimestres || 0,
      fechaInicio: grupo.fecha_inicio || "No registrada",
      fechaFin: grupo.fecha_fin || "No registrada",
      instructor,
      iniciales,
      ambiente: grupo.ambiente?.nombre_ambiente || "Sin asignar",
      ubicacion: grupo.ambiente?.ubicacion || "No registrada",
      aprendices: aprendicesGrupo.length || grupo.total_aprendices || 0,
    };
  }, [grupo, id, aprendicesGrupo]);

  const aprendicesPreview = useMemo(() => {
    return aprendicesGrupo.slice(0, 5).map((item) => {
      const persona = item.usuario?.persona || item.persona || {};
      return {
        id: item.id_aprendiz || item.id || persona.numero_documento,
        nombre: `${persona.nombres || item.nombres || ""} ${persona.apellidos || item.apellidos || ""}`.trim() || "Aprendiz",
        documento: persona.numero_documento || item.numero_documento || "-",
        estado: item.usuario?.estado || item.estado || "ACTIVO"
      };
    });
  }, [aprendicesGrupo]);

  function cambiarDetalleForm(e) {
    const { name, value } = e.target;
    setDetalleForm((actual) => ({ ...actual, [name]: value }));
  }

  function iniciarEdicion() {
    if (!grupo) return;
    setDetalleForm({
      numero_ficha: grupo.numero_ficha || "",
      jornada: grupo.jornada || "",
      trimestres: grupo.trimestres || "",
      fecha_inicio: grupo.fecha_inicio || ""
    });
    setDetalleModoEdicion(true);
  }

  function cancelarEdicion() {
    if (!grupo) return;
    setDetalleModoEdicion(false);
    setDetalleForm({
      numero_ficha: grupo.numero_ficha || "",
      jornada: grupo.jornada || "",
      trimestres: grupo.trimestres || "",
      fecha_inicio: grupo.fecha_inicio || ""
    });
  }

  async function guardarCambios() {
    try {
      const token = localStorage.getItem("access") || localStorage.getItem("token");
      const payload = {
        numero_ficha: detalleForm.numero_ficha.trim(),
        jornada: detalleForm.jornada,
        trimestres: parseInt(detalleForm.trimestres, 10),
        fecha_inicio: detalleForm.fecha_inicio
      };

      const res = await fetch(`/api/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw data;

      setGrupo(data?.data || grupo);
      setDetalleModoEdicion(false);
      setMensaje("Grupo actualizado correctamente.");
    } catch (err) {
      console.log("Error al actualizar grupo:", err);
      setMensaje(err?.message || err?.error || "No fue posible actualizar el grupo.");
    }
  }

  if (cargando) {
    return (
      <div className="fichas-modulo fichas-detail-state">
        <p>Cargando informacion de la ficha...</p>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="fichas-modulo fichas-detail-state">
        <div className="fichas-alerta error">{error || "No se pudo cargar la informacion del grupo."}</div>
        <button className="fichas-btn-cancelar" onClick={() => navigate("/fichas")}>Volver a Grupos</button>
      </div>
    );
  }

  return (
    <div className="fichas-modulo fichas-detail-page fichas-detail-page-v2">
      <button className="fichas-detail-back" onClick={() => navigate("/fichas")}>
        <ArrowLeft size={16} />
        Volver a Mis Grupos
      </button>

      {mensaje && <div className="grupos-alert info">{mensaje}</div>}

      <section className="fichas-banner">
        <div>
          <div className="fichas-banner-title-row">
            <h1>Ficha {detalleModoEdicion ? detalleForm.numero_ficha || detalle.ficha : detalle.ficha}</h1>
            <span className={`fichas-banner-badge ${detalle.estadoClase}`}>{detalle.estadoTexto}</span>
          </div>
          <p>{detalle.programa} - {detalle.area}</p>
        </div>
      </section>

      <section className="fichas-mini-kpis">
        <article className="fichas-mini-kpi green">
          <span>Aprendices</span>
          <strong>{detalle.aprendices || 0}</strong>
          <small>{detalle.aprendices ? "Registrados" : "Sin registros"}</small>
        </article>
        <article className="fichas-mini-kpi red muted">
          <span>Alertas activas</span>
          <strong>-</strong>
          <small>Sin endpoint</small>
        </article>
        <article className="fichas-mini-kpi yellow muted">
          <span>Observaciones</span>
          <strong>-</strong>
          <small>Sin endpoint</small>
        </article>
        <article className="fichas-mini-kpi blue muted">
          <span>Inasistencias</span>
          <strong>-</strong>
          <small>Sin endpoint</small>
        </article>
      </section>

      <section className="fichas-detail-layout-v2">
        <article className="fichas-panel fichas-panel-main">
          <div className="fichas-panel-header-actions">
            <h2>DETALLES ACADEMICOS</h2>
            {detalleModoEdicion ? (
              <div className="fichas-detail-actions">
                <button type="button" className="grupos-secondary-btn" onClick={cancelarEdicion}>Cancelar</button>
                <button type="button" className="grupos-primary-btn" onClick={guardarCambios}>
                  <Save size={16} />
                  Guardar
                </button>
              </div>
            ) : (
              <button type="button" className="grupos-secondary-btn" onClick={iniciarEdicion}>
                <Edit3 size={16} />
                Editar
              </button>
            )}
          </div>

          <div className="fichas-detail-rows">
            <div className="fichas-detail-field fichas-detail-field-full">
              <span>NUMERO DE FICHA</span>
              {detalleModoEdicion ? (
                <input name="numero_ficha" value={detalleForm.numero_ficha} onChange={cambiarDetalleForm} />
              ) : (
                <strong>{detalle.ficha}</strong>
              )}
            </div>

            <div className="fichas-detail-field fichas-detail-field-full">
              <span>AREA DE FORMACION</span>
              <strong>{detalle.area}</strong>
            </div>

            <div className="fichas-detail-field fichas-detail-field-full">
              <span>PROGRAMA DE FORMACION</span>
              <strong className="highlight">{detalle.programa}</strong>
            </div>

            <div className="fichas-detail-field">
              <span>JORNADA</span>
              {detalleModoEdicion ? (
                <select name="jornada" value={detalleForm.jornada} onChange={cambiarDetalleForm}>
                  <option value="Manana">Manana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                </select>
              ) : (
                <strong>{detalle.jornada}</strong>
              )}
            </div>

            <div className="fichas-detail-field">
              <span>DURACION</span>
              {detalleModoEdicion ? (
                <input type="number" min="1" name="trimestres" value={detalleForm.trimestres} onChange={cambiarDetalleForm} />
              ) : (
                <strong>{detalle.trimestres} Trimestres</strong>
              )}
            </div>

            <div className="fichas-detail-field">
              <span>FECHA DE INICIO</span>
              {detalleModoEdicion ? (
                <input type="date" name="fecha_inicio" value={detalleForm.fecha_inicio} onChange={cambiarDetalleForm} />
              ) : (
                <strong>{detalle.fechaInicio}</strong>
              )}
            </div>

            <div className="fichas-detail-field">
              <span>FECHA DE FIN (ESTIMADA)</span>
              <strong>{detalle.fechaFin}</strong>
            </div>
          </div>
        </article>

        <div className="fichas-side-stack">
          <article className="fichas-panel">
            <h2>INSTRUCTOR LIDER</h2>
            <div className="fichas-instructor-row">
              <div className="fichas-instructor-avatar">{detalle.iniciales}</div>
              <div>
                <strong>{detalle.instructor}</strong>
                <span>RESPONSABLE PRINCIPAL</span>
              </div>
            </div>
          </article>

          <article className="fichas-panel">
            <h2>AMBIENTE PRINCIPAL</h2>
            <div className="fichas-ambient-block">
              <span>NOMBRE DEL AMBIENTE</span>
              <strong>{detalle.ambiente}</strong>
            </div>
            <div className="fichas-ambient-block">
              <span>UBICACION</span>
              <strong>{detalle.ubicacion}</strong>
            </div>
          </article>
        </div>
      </section>

      <section className="fichas-panel fichas-panel-main" style={{ marginTop: "20px" }}>
        <div className="fichas-panel-header-actions">
          <h2>APRENDICES DEL GRUPO</h2>
          <span>{detalle.aprendices} registrados</span>
        </div>
        <div className="fichas-detail-rows">
          {aprendicesPreview.length > 0 ? aprendicesPreview.map((aprendiz) => (
            <div className="fichas-detail-field fichas-detail-field-full" key={aprendiz.id}>
              <span>{aprendiz.documento}</span>
              <strong>{aprendiz.nombre}</strong>
            </div>
          )) : (
            <div className="fichas-detail-field fichas-detail-field-full">
              <span>LISTADO</span>
              <strong>No hay aprendices registrados en esta ficha.</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
