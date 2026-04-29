import { useEffect, useState, useRef } from "react";

function Profile({ onClose }) {
  const [user, setUser] = useState(null);
  const ref = useRef();

  // ESTO ES LO NUEVO: ESTADOS PARA EDITAR PERFIL
  const [editMode, setEditMode] = useState(false);
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access");

    if (!token) return;

    fetch("http://localhost:3000/api/profile/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.data);

        // ESTO ES LO NUEVO (BIEN UBICADO)
        setEmail(data.data.email || "");
        setTelefono(data.data.persona?.telefono || "");
      })
      .catch((err) => console.error(err));
  }, []);

  // cerrar al hacer click afuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!user) {
    return <p style={styles.container}>Cargando...</p>;
  }

  // ESTO ES LO NUEVO: ACTUALIZAR PERFIL
  function actualizarPerfil() {
    const token =
      localStorage.getItem("access") || localStorage.getItem("token");

    fetch("http://localhost:3000/api/profile/overview", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email,
        telefono,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Perfil actualizado:", data);
        alert("Perfil actualizado correctamente");

        // actualizar UI sin recargar
        setUser((prev) => ({
          ...prev,
          email,
          persona: {
            ...prev.persona,
            telefono,
          },
        }));

        setEditMode(false);
      })
      .catch((err) => console.error(err));
  }

  return (
    <div style={styles.container}>
      <div ref={ref} style={styles.card}>
        <img
          src="https://tse1.mm.bing.net/th/id/OIP.SrNVtChSzi8meulfz6_K4QHaET?r=0&rs=1&pid=ImgDetMain&o=7&rm=3"
          alt="avatar"
          style={styles.avatar}
        />

        <h3>
          {user.persona.nombres} {user.persona.apellidos}
        </h3>

        <p>{user.rol}</p>

        <p>
          <strong>Correo:</strong> {user.email}
        </p>

        <p>
          <strong>Documento:</strong> {user.persona.numero_documento}
        </p>

        <p>
          <strong>Teléfono:</strong> {user.persona.telefono}
        </p>

        <p>
          <strong>Estado:</strong> ACTIVO
        </p>

        <div style={styles.buttons}>
          <button onClick={onClose}>Cerrar</button>

          <button
            style={styles.edit}
            onClick={() => setEditMode(true)}
          >
            Editar
          </button>
        </div>

        {/* ESTO ES LO NUEVO: FORMULARIO DE EDICIÓN */}
        {editMode && (
          <div style={{ marginTop: "10px" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
            />

            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Teléfono"
            />

            <div style={{ marginTop: "10px" }}>
              <button onClick={actualizarPerfil}>Guardar</button>
              <button onClick={() => setEditMode(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "absolute",
    top: "60px",
    right: "0",
    zIndex: 1000,
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.2)",
    width: "280px",
    textAlign: "center",
  },
  avatar: {
    borderRadius: "50%",
    marginBottom: "10px",
  },
  buttons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },
  edit: {
    background: "green",
    color: "white",
  },
};

export default Profile;