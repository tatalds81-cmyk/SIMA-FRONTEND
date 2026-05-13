import { useEffect, useMemo, useState } from "react";
import "./Observaciones.css";

export default function Observaciones() {
  const API_URL = "/api";


  function safeParse(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch {
      return null;
    }
  }

  const usuario =
    safeParse("user_data") ||
    safeParse("usuario") ||
    {};

  const rol = (
    localStorage.getItem("rol") ||
    usuario?.rol ||
    usuario?.tipo_rol ||
    ""
  ).toLowerCase();

  const ID_GRUPO =
    usuario?.id_grupo ||
    usuario?.grupo?.id_grupo ||
    1;


  const puedeRegistrar =
    rol === "instructor";


  const [mostrarModal, setMostrarModal] =
    useState(false);

  const [observaciones, setObservaciones] =
    useState([]);

  const [aprendices, setAprendices] =
    useState([]);

  const [historial, setHistorial] =
    useState([]);

  const [
    mostrarHistorial,
    setMostrarHistorial,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [pagina, setPagina] =
    useState(1);

  const [total, setTotal] =
    useState(0);


  const [fichas, setFichas] =
    useState([
      {
        id: 1,
        codigo: "2874057",
      },
      {
        id: 2,
        codigo: "2874058",
      },
      {
        id: 3,
        codigo: "2874059",
      },
    ]);


  const [
    mostrarAprendices,
    setMostrarAprendices,
  ] = useState(false);

  const [
    busquedaAprendiz,
    setBusquedaAprendiz,
  ] = useState("");



  const [filtros, setFiltros] =
    useState({
      busqueda: "",
      tipo: "",
      severidad: "",
      estado: "",
      ficha: "",
      fecha_desde: "",
    });


  const [editando, setEditando] =
    useState(null);


  const [form, setForm] = useState({
    id_aprendiz: "",
    tipo_observacion: "ACADEMICA",
    severidad: "LEVE",
    descripcion: "",
  });


  function getHeaders() {
    const token =
      localStorage.getItem("access") ||
      localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
    };

    if (
      token &&
      token !== "undefined"
    ) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }


  useEffect(() => {
    fetchObservaciones();
  }, [pagina, filtros]);

  useEffect(() => {
    fetchAprendices();
  }, []);

 
  async function fetchObservaciones() {
    try {
      setLoading(true);

      const params =
        new URLSearchParams();

      params.append("page", pagina);
      params.append("limit", 10);

      if (filtros.tipo)
        params.append(
          "tipo_observacion",
          filtros.tipo
        );

      if (filtros.severidad)
        params.append(
          "severidad",
          filtros.severidad
        );

      if (filtros.estado)
        params.append(
          "estado",
          filtros.estado
        );

      if (filtros.fecha_desde)
        params.append(
          "fecha_desde",
          filtros.fecha_desde
        );

      // FILTRO FICHA
      if (filtros.ficha)
        params.append(
          "ficha",
          filtros.ficha
        );

      const res = await fetch(
        `${API_URL}/observations/group/${ID_GRUPO}?${params}`,
        {
          headers: getHeaders(),
        }
      );

      if (!res.ok)
        throw new Error(
          "Error cargando observaciones"
        );

      const data = await res.json();

      const lista =
        data?.data?.observaciones || [];

      setObservaciones(
        Array.isArray(lista)
          ? lista
          : []
      );

      setTotal(
        data?.data?.total || 0
      );
    } catch (error) {
      console.error(error);
      setObservaciones([]);
    } finally {
      setLoading(false);
    }
  }


  async function fetchAprendices() {
    try {
      const res = await fetch(
        `${API_URL}/apprentices/grupo/${ID_GRUPO}`,
        {
          headers: getHeaders(),
        }
      );

      if (!res.ok)
        throw new Error(
          "No se pudieron cargar aprendices"
        );

      const data = await res.json();

      const lista =
        data?.data?.aprendices || [];

      setAprendices(
        Array.isArray(lista)
          ? lista
          : []
      );
    } catch (error) {
      console.error(error);
      setAprendices([]);
    }
  }


  async function fetchHistorial(
    idAprendiz
  ) {
    try {
      const res = await fetch(
        `${API_URL}/observations/apprentice/${idAprendiz}`,
        {
          headers: getHeaders(),
        }
      );

      if (!res.ok)
        throw new Error(
          "No se pudo cargar historial"
        );

      const data = await res.json();

      const lista =
        data?.data?.observaciones || [];

      setHistorial(lista);
      setMostrarHistorial(true);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }



  async function handleSubmit() {
    try {
      if (!form.id_aprendiz) {
        alert(
          "Selecciona un aprendiz"
        );
        return;
      }

      if (
        form.descripcion.trim()
          .length < 20
      ) {
        alert(
          "La descripcion debe tener minimo 20 caracteres"
        );
        return;
      }

      const payload = editando
        ? {
            tipo_observacion:
              form.tipo_observacion,
            severidad:
              form.severidad,
            descripcion:
              form.descripcion.trim(),
          }
        : {
            id_aprendiz:
              Number(
                form.id_aprendiz
              ),
            id_grupo: ID_GRUPO,
            tipo_observacion:
              form.tipo_observacion,
            severidad:
              form.severidad,
            descripcion:
              form.descripcion.trim(),
          };

      const url = editando
        ? `${API_URL}/observations/${editando}`
        : `${API_URL}/observations`;

      const method = editando
        ? "PATCH"
        : "POST";

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(
          payload
        ),
      });

      const data = await res
        .json()
        .catch(() => null);

      if (!res.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Error guardando observacion"
        );
      }

      setMostrarModal(false);

      setEditando(null);

      setForm({
        id_aprendiz: "",
        tipo_observacion:
          "ACADEMICA",
        severidad: "LEVE",
        descripcion: "",
      });

      fetchObservaciones();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  function handleEditar(obs) {
    if (
      obs.estado &&
      obs.estado !== "ABIERTA"
    ) {
      alert(
        "Solo se pueden editar observaciones ABIERTAS"
      );
      return;
    }

    setEditando(
      obs.id_observacion ||
        obs.id
    );

    setForm({
      id_aprendiz:
        obs.id_aprendiz,
      tipo_observacion:
        obs.tipo_observacion,
      severidad:
        obs.severidad,
      descripcion:
        obs.descripcion,
    });

    setMostrarModal(true);
  }



  const observacionesFiltradas =
    useMemo(() => {
      return observaciones.filter(
        (obs) => {
          const nombre = (
            obs.aprendiz_nombre ||
            obs.nombre_aprendiz ||
            obs.aprendiz
              ?.nombre_completo ||
            ""
          ).toLowerCase();

          return nombre.includes(
            filtros.busqueda.toLowerCase()
          );
        }
      );
    }, [
      observaciones,
      filtros.busqueda,
    ]);



  return (
    <div className="coordinador-panel obs-page">

      {/* HEADER */}

      <div className="coordinador-card">
        <div className="coordinador-card-header obs-header">

          <div>
            <h2>
              Consultar observaciones
            </h2>

            <p>
              Visualiza y administra
              observaciones del
              grupo.
            </p>
          </div>

          {puedeRegistrar && (
            <button
              className="obs-btn-primary"
              onClick={() => {
                setEditando(null);

                setForm({
                  id_aprendiz: "",
                  tipo_observacion:
                    "ACADEMICA",
                  severidad:
                    "LEVE",
                  descripcion: "",
                });

                setMostrarModal(
                  true
                );
              }}
            >
              + Registrar observacion
            </button>
          )}
        </div>

        {/* FILTROS */}

        <div className="obs-filters">

          {/* BUSQUEDA */}

          <input
            placeholder="Buscar aprendiz"
            value={
              filtros.busqueda
            }
            onChange={(e) =>
              setFiltros({
                ...filtros,
                busqueda:
                  e.target.value,
              })
            }
          />

          {/* TIPO */}

          <select
            value={filtros.tipo}
            onChange={(e) =>
              setFiltros({
                ...filtros,
                tipo:
                  e.target.value,
              })
            }
          >
            <option value="">
              Tipo
            </option>

            <option value="ACADEMICA">
              ACADEMICA
            </option>

            <option value="CONVIVENCIAL">
              CONVIVENCIAL
            </option>
          </select>

          {/* SEVERIDAD */}

          <select
            value={
              filtros.severidad
            }
            onChange={(e) =>
              setFiltros({
                ...filtros,
                severidad:
                  e.target.value,
              })
            }
          >
            <option value="">
              Severidad
            </option>

            <option value="LEVE">
              LEVE
            </option>

            <option value="MODERADA">
              MODERADA
            </option>

            <option value="GRAVE">
              GRAVE
            </option>
          </select>

          {/* ESTADO */}

          <select
            value={
              filtros.estado
            }
            onChange={(e) =>
              setFiltros({
                ...filtros,
                estado:
                  e.target.value,
              })
            }
          >
            <option value="">
              Estado
            </option>

            <option value="ABIERTA">
              ABIERTA
            </option>

            <option value="CERRADA">
              CERRADA
            </option>
          </select>

          {/* NUEVO FILTRO MIS FICHAS */}

          <select
            value={
              filtros.ficha
            }
            onChange={(e) =>
              setFiltros({
                ...filtros,
                ficha:
                  e.target.value,
              })
            }
          >
            <option value="">
              Mis fichas
            </option>

            {fichas.map((ficha) => (
              <option
                key={ficha.id}
                value={ficha.codigo}
              >
                Ficha {ficha.codigo}
              </option>
            ))}
          </select>

          {/* FECHA */}

          <input
            type="date"
            value={
              filtros.fecha_desde
            }
            onChange={(e) =>
              setFiltros({
                ...filtros,
                fecha_desde:
                  e.target.value,
              })
            }
          />

          {/* LIMPIAR */}

          <button
            className="obs-btn-secondary"
            onClick={() =>
              setFiltros({
                busqueda: "",
                tipo: "",
                severidad: "",
                estado: "",
                ficha: "",
                fecha_desde: "",
              })
            }
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* TABLA */}

      <div className="coordinador-card">

        <h2>
          Observaciones registradas
        </h2>

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <div className="obs-table">
              <table>
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Tipo</th>
                    <th>Severidad</th>
                    <th>Estado</th>
                    <th>
                      Descripcion
                    </th>
                    <th>Fecha</th>
                    <th>Autor</th>
                    <th>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {observacionesFiltradas.length >
                  0 ? (
                    observacionesFiltradas.map(
                      (obs) => {

                        const nombreAprendiz =
                          obs
                            .aprendiz
                            ?.usuario
                            ?.persona
                            ? `${obs.aprendiz.usuario.persona.nombres} ${obs.aprendiz.usuario.persona.apellidos}`
                            : "Sin nombre";

                        const nombreInstructor =
                          obs
                            .instructor
                            ?.usuario
                            ?.persona
                            ? `${obs.instructor.usuario.persona.nombres} ${obs.instructor.usuario.persona.apellidos}`
                            : "Instructor";

                        return (
                          <tr
                            key={
                              obs.id_observacion ||
                              obs.id
                            }
                          >
                            <td>
                              {
                                nombreAprendiz
                              }
                            </td>

                            <td>
                              {
                                obs.tipo_observacion
                              }
                            </td>

                            <td>
                              <span
                                className={`badge ${(obs.severidad || "").toLowerCase()}`}
                              >
                                {
                                  obs.severidad
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={`badge ${(obs.estado || "").toLowerCase()}`}
                              >
                                {
                                  obs.estado
                                }
                              </span>
                            </td>

                            <td>
                              {obs
                                .descripcion
                                ?.length >
                              80
                                ? obs.descripcion.slice(
                                    0,
                                    80
                                  ) +
                                  "..."
                                : obs.descripcion}
                            </td>

                            <td>
                              {obs.fecha_observacion ||
                                obs.fecha ||
                                "Sin fecha"}
                            </td>

                            <td>
                              {
                                nombreInstructor
                              }
                            </td>

                            <td>
                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: 8,
                                }}
                              >
                                <button
                                  onClick={() =>
                                    fetchHistorial(
                                      obs.id_aprendiz
                                    )
                                  }
                                >
                                  Historial
                                </button>

                                {obs.estado ===
                                  "ABIERTA" && (
                                  <button
                                    onClick={() =>
                                      handleEditar(
                                        obs
                                      )
                                    }
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }
                    )
                  ) : (
                    <tr>
                      <td colSpan="8">
                        No hay
                        observaciones
                        registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINACION */}

            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                disabled={
                  pagina === 1
                }
                onClick={() =>
                  setPagina(
                    pagina - 1
                  )
                }
              >
                Anterior
              </button>

              <span>
                Página {pagina}
              </span>

              <button
                disabled={
                  observaciones.length <
                  10
                }
                onClick={() =>
                  setPagina(
                    pagina + 1
                  )
                }
              >
                Siguiente
              </button>

              <span>
                Total registros:{" "}
                {total}
              </span>
            </div>
          </>
        )}
      </div>

      {/* MODAL */}

      {mostrarModal && (
        <div className="modal-overlay">
          <div className="modal-card">

            <span className="modal-tag">
              {editando
                ? "EDITANDO"
                : "NUEVO REGISTRO"}
            </span>

            <h2>
              {editando
                ? "Editar observacion"
                : "Registrar observacion"}
            </h2>

            <div className="modal-grid">

              {/* APRENDIZ */}

              <div>
                <label>
                  Aprendiz
                </label>

                <div className="multi-select">

                  <button
                    type="button"
                    className="multi-select-trigger"
                    disabled={
                      !!editando
                    }
                    onClick={() =>
                      setMostrarAprendices(
                        !mostrarAprendices
                      )
                    }
                  >
                    {form.id_aprendiz
                      ? (() => {

                          const aprendizSeleccionado =
                            aprendices.find(
                              (
                                a
                              ) =>
                                a.id_aprendiz ===
                                form.id_aprendiz
                            );

                          return (
                            aprendizSeleccionado?.nombre_completo ||
                            `${aprendizSeleccionado?.nombres || ""} ${
                              aprendizSeleccionado?.apellidos || ""
                            }`.trim() ||
                            "1 aprendiz seleccionado"
                          );
                        })()
                      : "Seleccione"}
                  </button>

                  {mostrarAprendices &&
                    !editando && (
                      <div className="multi-select-dropdown">

                        <input
                          type="text"
                          placeholder="Buscar aprendiz..."
                          value={
                            busquedaAprendiz
                          }
                          onChange={(
                            e
                          ) =>
                            setBusquedaAprendiz(
                              e.target
                                .value
                            )
                          }
                          className="multi-select-search"
                        />

                        <div className="multi-select-options">

                          {aprendices
                            .filter(
                              (
                                aprendiz
                              ) => {

                                const nombre =
                                  aprendiz.nombre_completo ||
                                  `${aprendiz.nombres || ""} ${aprendiz.apellidos || ""}`.trim();

                                if (
                                  !busquedaAprendiz.trim()
                                )
                                  return true;

                                return nombre
                                  .toLowerCase()
                                  .includes(
                                    busquedaAprendiz.toLowerCase()
                                  );
                              }
                            )
                            .map(
                              (
                                aprendiz
                              ) => {

                                const nombre =
                                  aprendiz.nombre_completo ||
                                  `${aprendiz.nombres || ""} ${aprendiz.apellidos || ""}`.trim() ||
                                  `Aprendiz ${aprendiz.id_aprendiz}`;

                                return (
                                  <label
                                    key={
                                      aprendiz.id_aprendiz
                                    }
                                    className="multi-select-option"
                                  >
                                    <input
                                      type="radio"
                                      name="aprendiz"
                                      checked={
                                        form.id_aprendiz ===
                                        aprendiz.id_aprendiz
                                      }
                                      onChange={() => {

                                        setForm(
                                          {
                                            ...form,
                                            id_aprendiz:
                                              aprendiz.id_aprendiz,
                                          }
                                        );

                                        setMostrarAprendices(
                                          false
                                        );
                                      }}
                                    />

                                    <span>
                                      {
                                        nombre
                                      }
                                    </span>
                                  </label>
                                );
                              }
                            )}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* TIPO */}

              <div>
                <label>Tipo</label>

                <select
                  value={
                    form.tipo_observacion
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo_observacion:
                        e.target
                          .value,
                    })
                  }
                >
                  <option value="ACADEMICA">
                    Academica
                  </option>

                  <option value="CONVIVENCIAL">
                    Convivencial
                  </option>
                </select>
              </div>

              {/* SEVERIDAD */}

              <div>
                <label>
                  Severidad
                </label>

                <select
                  value={
                    form.severidad
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      severidad:
                        e.target
                          .value,
                    })
                  }
                >
                  <option value="LEVE">
                    Leve
                  </option>

                  <option value="MODERADA">
                    Moderada
                  </option>

                  <option value="GRAVE">
                    Grave
                  </option>
                </select>
              </div>
            </div>

            {/* DESCRIPCION */}

            <div className="modal-full">

              <label>
                Descripcion
              </label>

              <textarea
                placeholder="Describe la observacion..."
                value={
                  form.descripcion
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    descripcion:
                      e.target
                        .value,
                  })
                }
              />
            </div>

            {/* BOTONES */}

            <div className="modal-actions">

              <button
                onClick={() => {

                  setMostrarModal(
                    false
                  );

                  setEditando(
                    null
                  );
                }}
              >
                Cancelar
              </button>

              <button
                className="obs-btn-primary"
                onClick={
                  handleSubmit
                }
              >
                {editando
                  ? "Actualizar"
                  : "Guardar observacion"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HISTORIAL */}

      {mostrarHistorial && (
        <div className="modal-overlay">
          <div className="modal-card">

            <h2>
              Historial del
              aprendiz
            </h2>

            <div
              style={{
                maxHeight: 400,
                overflow: "auto",
              }}
            >
              {historial.length >
              0 ? (
                historial.map(
                  (item) => (
                    <div
                      key={
                        item.id_observacion ||
                        item.id
                      }
                      style={{
                        border:
                          "1px solid #ccc",
                        padding: 12,
                        marginBottom: 10,
                        borderRadius: 8,
                      }}
                    >
                      <p>
                        <strong>
                          Tipo:
                        </strong>{" "}
                        {
                          item.tipo_observacion
                        }
                      </p>

                      <p>
                        <strong>
                          Severidad:
                        </strong>{" "}
                        {
                          item.severidad
                        }
                      </p>

                      <p>
                        <strong>
                          Estado:
                        </strong>{" "}
                        {
                          item.estado
                        }
                      </p>

                      <p>
                        <strong>
                          Fecha:
                        </strong>{" "}
                        {
                          item.fecha_observacion
                        }
                      </p>

                      <p>
                        <strong>
                          Descripcion:
                        </strong>{" "}
                        {
                          item.descripcion
                        }
                      </p>

                      <p>
                        <strong>
                          Instructor:
                        </strong>{" "}
                        {item
                          .instructor
                          ?.usuario
                          ?.persona
                          ? `${item.instructor.usuario.persona.nombres} ${item.instructor.usuario.persona.apellidos}`
                          : "Sin datos"}
                      </p>
                    </div>
                  )
                )
              ) : (
                <p>
                  No hay historial
                  disponible
                </p>
              )}
            </div>

            <div className="modal-actions">

              <button
                onClick={() =>
                  setMostrarHistorial(
                    false
                  )
                }
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}