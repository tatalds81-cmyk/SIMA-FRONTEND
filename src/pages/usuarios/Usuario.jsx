import { useEffect, useState } from "react";
import "./usuario.css";

export default function Usuario() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState([]);

  const [busquedaDocumento, setBusquedaDocumento] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    id_rol: "",
    tipo_documento: "",
    numero_documento: "",
    nombres: "",
    apellidos: "",
    telefono: "",
  });

  const [editandoId, setEditandoId] = useState(null);
  const [filaEditando, setFilaEditando] = useState({
    email: "",
    id_rol: "",
    tipo_documento: "",
    numero_documento: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    estado: "ACTIVO",
  });

  const URL_USUARIOS = "/api/users";
  const URL_ROLES = "/api/roles";

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  function obtenerHeaders() {
    const token = localStorage.getItem("access");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  function obtenerData(respuesta) {
    if (Array.isArray(respuesta)) return respuesta;
    if (Array.isArray(respuesta?.data)) return respuesta.data;
    if (Array.isArray(respuesta?.results)) return respuesta.results;
    return [];
  }

  async function cargarUsuarios() {
    try {
      setError("");

      const res = await fetch(URL_USUARIOS, {
        method: "GET",
        headers: obtenerHeaders(),
      });

      const respuesta = await res.json();

      if (!res.ok) {
        throw respuesta;
      }

      const lista = obtenerData(respuesta);

      setUsuarios(lista);
      setUsuariosFiltrados(lista);
    } catch (err) {
      console.log("Error usuarios:", err);
      setError(err?.message || err?.error || "Error al cargar usuarios");
    }
  }

  async function cargarRoles() {
    try {
      const res = await fetch(URL_ROLES, {
        method: "GET",
        headers: obtenerHeaders(),
      });

      const respuesta = await res.json();

      if (!res.ok) {
        throw respuesta;
      }

      setRoles(obtenerData(respuesta));
    } catch (err) {
      console.log("Error roles:", err);
      setError(err?.message || err?.error || "Error al cargar roles");
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function limpiarFormulario() {
    setForm({
      email: "",
      id_rol: "",
      tipo_documento: "",
      numero_documento: "",
      nombres: "",
      apellidos: "",
      telefono: "",
    });
  }

  async function guardarUsuario(e) {
    e.preventDefault();
    setMensaje("");
    setError("");

    const data = {
      email: form.email.trim(),
      id_rol: Number(form.id_rol),
      tipo_documento: form.tipo_documento,
      numero_documento: form.numero_documento.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      telefono: form.telefono.trim(),
    };

    try {
      const res = await fetch(URL_USUARIOS, {
        method: "POST",
        headers: obtenerHeaders(),
        body: JSON.stringify(data),
      });

      const respuesta = await res.json();

      if (!res.ok) {
        throw respuesta;
      }

      setMensaje(respuesta?.message || "Usuario creado correctamente");
      limpiarFormulario();
      cargarUsuarios();
    } catch (err) {
      console.log("Error crear:", err);
      setError(err?.message || err?.error || "Error al crear usuario");
    }
  }

  function iniciarEdicion(usuario) {
    setEditandoId(usuario.id_usuario);

    setFilaEditando({
      email: usuario.email || "",
      id_rol: usuario.rol?.id_rol || "",
      tipo_documento: usuario.persona?.tipo_documento || "",
      numero_documento: usuario.persona?.numero_documento || "",
      nombres: usuario.persona?.nombres || "",
      apellidos: usuario.persona?.apellidos || "",
      telefono: usuario.persona?.telefono || "",
      estado: usuario.estado || "ACTIVO",
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setFilaEditando({
      email: "",
      id_rol: "",
      tipo_documento: "",
      numero_documento: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      estado: "ACTIVO",
    });
  }

  function cambiarFilaEditando(e) {
    setFilaEditando({
      ...filaEditando,
      [e.target.name]: e.target.value,
    });
  }

  async function guardarEdicion(id) {
    setMensaje("");
    setError("");

    const data = {
      email: filaEditando.email.trim(),
      id_rol: Number(filaEditando.id_rol),
      tipo_documento: filaEditando.tipo_documento,
      numero_documento: filaEditando.numero_documento.trim(),
      nombres: filaEditando.nombres.trim(),
      apellidos: filaEditando.apellidos.trim(),
      telefono: filaEditando.telefono.trim(),
      estado: filaEditando.estado,
    };

    try {
      const res = await fetch(`${URL_USUARIOS}/${id}`, {
        method: "PUT",
        headers: obtenerHeaders(),
        body: JSON.stringify(data),
      });

      const respuesta = await res.json();

      if (!res.ok) {
        throw respuesta;
      }

      setMensaje(respuesta?.message || "Usuario actualizado correctamente");
      cancelarEdicion();
      cargarUsuarios();
    } catch (err) {
      console.log("Error actualizar:", err);
      setError(err?.message || err?.error || "Error al actualizar usuario");
    }
  }

  async function eliminarUsuario(id) {
    const confirmar = window.confirm("¿Desea deshabilitar este usuario?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${URL_USUARIOS}/${id}`, {
        method: "DELETE",
        headers: obtenerHeaders(),
      });

      const respuesta = await res.json();

      if (!res.ok) {
        throw respuesta;
      }

      setMensaje(respuesta?.message || "Usuario deshabilitado correctamente");
      cargarUsuarios();
    } catch (err) {
      console.log("Error eliminar:", err);
      setError(err?.message || err?.error || "Error al eliminar usuario");
    }
  }

  function buscarUsuarioPorDocumento() {
    const texto = busquedaDocumento.trim().toLowerCase();

    if (texto === "") {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const resultado = usuarios.filter((u) => {
      const documento = String(u.persona?.numero_documento || "").toLowerCase();
      const nombres = String(u.persona?.nombres || "").toLowerCase();
      const apellidos = String(u.persona?.apellidos || "").toLowerCase();
      const correo = String(u.email || "").toLowerCase();

      return (
        documento.includes(texto) ||
        nombres.includes(texto) ||
        apellidos.includes(texto) ||
        correo.includes(texto)
      );
    });

    setUsuariosFiltrados(resultado);
  }

  function limpiarBusqueda() {
    setBusquedaDocumento("");
    setUsuariosFiltrados(usuarios);
  }

  return (
    <div className="usuarios-modulo">
      <div className="usuarios-titulo">Gestión de usuarios</div>

      {mensaje && <div className="usuarios-alerta info">{mensaje}</div>}
      {error && <div className="usuarios-alerta error">{error}</div>}

      <div className="usuarios-card">
        <div className="usuarios-section-title">Buscar usuario</div>

        <div className="usuarios-busqueda">
          <input
            type="text"
            placeholder="Buscar por documento, nombre o correo"
            value={busquedaDocumento}
            onChange={(e) => setBusquedaDocumento(e.target.value)}
          />

          <button type="button" className="usuarios-btn verde" onClick={buscarUsuarioPorDocumento}>
            Buscar
          </button>

          <button type="button" className="usuarios-btn gris" onClick={limpiarBusqueda}>
            Limpiar
          </button>
        </div>
      </div>

      <div className="usuarios-card">
        <div className="usuarios-section-title">Crear usuario</div>

        <form onSubmit={guardarUsuario}>
          <div className="usuarios-form-grid">
            <input
              type="text"
              name="nombres"
              placeholder="Nombres"
              value={form.nombres}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="apellidos"
              placeholder="Apellidos"
              value={form.apellidos}
              onChange={handleChange}
              required
            />
          </div>

          <div className="usuarios-form-grid">
            <select
              name="tipo_documento"
              value={form.tipo_documento}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione tipo de documento</option>
              <option value="CC">Cédula de ciudadanía</option>
              <option value="TI">Tarjeta de identidad</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="PPT">Permiso por Protección Temporal</option>
              <option value="PAS">Pasaporte</option>
            </select>

            <input
              type="text"
              name="numero_documento"
              placeholder="Número de documento"
              value={form.numero_documento}
              onChange={handleChange}
              required
            />
          </div>

          <div className="usuarios-form-grid tres">
            <input
              type="email"
              name="email"
              placeholder="Correo"
              value={form.email}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={form.telefono}
              onChange={handleChange}
            />

            <select name="id_rol" value={form.id_rol} onChange={handleChange} required>
              <option value="">Seleccione un rol</option>
              {roles.map((rol) => (
                <option key={rol.id_rol} value={rol.id_rol}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="usuarios-btn verde ancho">
            Guardar usuario
          </button>
        </form>
      </div>

      <div className="usuarios-card">
        <div className="usuarios-section-title">Usuarios registrados</div>

        <div className="usuarios-tabla-contenedor">
          <table className="usuarios-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Tipo Doc.</th>
                <th>Documento</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((item) => (
                  <tr key={item.id_usuario}>
                    <td>{item.id_usuario}</td>

                    {editandoId === item.id_usuario ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="nombres"
                            value={filaEditando.nombres}
                            onChange={cambiarFilaEditando}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            name="apellidos"
                            value={filaEditando.apellidos}
                            onChange={cambiarFilaEditando}
                          />
                        </td>

                        <td>
                          <select
                            name="tipo_documento"
                            value={filaEditando.tipo_documento}
                            onChange={cambiarFilaEditando}
                          >
                            <option value="CC">CC</option>
                            <option value="TI">TI</option>
                            <option value="CE">CE</option>
                            <option value="PPT">PPT</option>
                            <option value="PAS">PAS</option>
                          </select>
                        </td>

                        <td>
                          <input
                            type="text"
                            name="numero_documento"
                            value={filaEditando.numero_documento}
                            onChange={cambiarFilaEditando}
                          />
                        </td>

                        <td>
                          <input
                            type="email"
                            name="email"
                            value={filaEditando.email}
                            onChange={cambiarFilaEditando}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            name="telefono"
                            value={filaEditando.telefono}
                            onChange={cambiarFilaEditando}
                          />
                        </td>

                        <td>
                          <select
                            name="id_rol"
                            value={filaEditando.id_rol}
                            onChange={cambiarFilaEditando}
                          >
                            <option value="">Seleccione</option>
                            {roles.map((rol) => (
                              <option key={rol.id_rol} value={rol.id_rol}>
                                {rol.nombre}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>{filaEditando.estado}</td>

                        <td>
                          <div className="usuarios-acciones">
                            <button
                              type="button"
                              className="usuarios-btn pequeno verde"
                              onClick={() => guardarEdicion(item.id_usuario)}
                            >
                              Guardar
                            </button>

                            <button
                              type="button"
                              className="usuarios-btn pequeno gris"
                              onClick={cancelarEdicion}
                            >
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.persona?.nombres}</td>
                        <td>{item.persona?.apellidos}</td>
                        <td>{item.persona?.tipo_documento}</td>
                        <td>{item.persona?.numero_documento}</td>
                        <td>{item.email}</td>
                        <td>{item.persona?.telefono || "Sin teléfono"}</td>
                        <td>{item.rol?.nombre}</td>
                        <td>{item.estado}</td>

                        <td>
                          <div className="usuarios-acciones">
                            <button
                              type="button"
                              className="usuarios-btn pequeno amarillo"
                              onClick={() => iniciarEdicion(item)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="usuarios-btn pequeno rojo"
                              onClick={() => eliminarUsuario(item.id_usuario)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="usuarios-text-center">
                    No hay usuarios para mostrar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}