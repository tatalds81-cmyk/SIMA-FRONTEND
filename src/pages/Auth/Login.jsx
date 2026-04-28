import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import OlvidePassword from "./OlvidePassword";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarOlvide, setMostrarOlvide] = useState(false);

  // Usamos ruta relativa gracias al proxy de Vite
  const URL_LOGIN = "/api/auth/login";

  function iniciarSesion(e) {
    if (e) e.preventDefault();
    setMensaje("");

    // El backend espera 'numero_documento' según el mensaje de error 400
    const data = {
      numero_documento: username.trim(),
      password: password
    };

    fetch(URL_LOGIN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((res) => {
        if (!res.ok) {
          // Si la respuesta no es exitosa, intentamos leer el JSON de error, 
          // si falla el parseo (como el 404), lanzamos un error genérico.
          return res.json()
            .catch(() => { throw new Error(`Error ${res.status}: No se pudo conectar con el servidor de autenticación.`); })
            .then((errData) => { throw errData; });
        }
        return res.json();
      })
      .then((data) => {
        // Guardamos token
        localStorage.setItem("access", data.data.access);

        // Guardamos información del usuario
        const nombreUsuario = data.data.user?.nombre || username.trim();
        localStorage.setItem("username", nombreUsuario);
        localStorage.setItem("usuario", nombreUsuario);

        if (data.data.user?.rol) {
          localStorage.setItem("rol", data.data.user.rol);
        }

        setMensaje("Inicio de sesión correcto");

        // Actualizamos estado global y redirigimos
        if (onLogin) {
          onLogin();
          navigate("/dashboard");
        }
      })
      .catch((error) => {
        console.log("Error login:", error);

        if (error instanceof TypeError && error.message === "Failed to fetch") {
          setMensaje("No se pudo conectar con el servidor. Verifica que el backend esté corriendo y los permisos CORS.");
        } else if (error.message) {
          setMensaje(error.message);
        } else if (error.error) {
          setMensaje(error.error);
        } else {
          setMensaje("Error al iniciar sesión");
        }
      });
  }

  function manejarCambioUsername(e) {
    setUsername(e.target.value);
    if (mensaje) setMensaje("");
  }

  function manejarCambioPassword(e) {
    setPassword(e.target.value);
    if (mensaje) setMensaje("");
  }

  if (mostrarOlvide) {
    return <OlvidePassword onVolver={() => setMostrarOlvide(false)} />;
  }

  return (
    <div className="login-sima-container">
      <div className="login-sima-logo">SIMA</div>

      <div className="login-sima-card">
        <h2 className="login-sima-title">INICIAR SESIÓN</h2>

        {mensaje && (
          <div className="alert alert-info mt-3">
            {mensaje}
          </div>
        )}

        <form onSubmit={iniciarSesion}>
          <div className="mb-3">
            <label className="login-sima-label">NÚMERO DE DOCUMENTO</label>
            <input
              type="text"
              className="form-control login-sima-input"
              placeholder="Ingrese su número de documento"
              value={username}
              onChange={manejarCambioUsername}
              required
            />
          </div>

          <div className="mb-3">
            <label className="login-sima-label">CONTRASEÑA</label>
            <input
              type="password"
              className="form-control login-sima-input"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={manejarCambioPassword}
              required
            />
          </div>

          <div className="login-sima-extra">
            <label className="login-sima-check">
              <input type="checkbox" /> Recuérdame
            </label>

            <button
              type="button"
              className="login-sima-link-btn"
              onClick={() => setMostrarOlvide(true)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button type="submit" className="login-sima-btn">
            Iniciar
          </button>
        </form>
      </div>

      <div className="login-sima-wave"></div>
    </div>
  );
}