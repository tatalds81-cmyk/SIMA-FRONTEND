import { useEffect, useState, useRef } from "react";

function Profile({ onClose }) {
  const [user, setUser] = useState(null);
  const ref = useRef();

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access");

    //  CAMBIO 1: evitar request si no hay token
    if (!token) return;

    fetch("http://localhost:3000/api/profile/overview", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data.data))
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

  //  CAMBIO 2: estado de carga más seguro
  if (!user) {
    return <p style={styles.container}>Cargando...</p>;
  }

  return (
    <div style={styles.container}>
      <div ref={ref} style={styles.card}>
        <img
          src="https://i.pravatar.cc/100"
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
          <button style={styles.edit}>Editar</button>
        </div>
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