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
        console.log("Respuesta completa del servidor:", data);

        // Buscamos el token en varias posibles ubicaciones (resiliencia)
        const token = 
          data?.data?.access || 
          data?.data?.token || 
          data?.access || 
          data?.token;

        if (!token) {
          throw new Error("El servidor no envió un token de acceso válido. Revisa los logs.");
        }

        // Guardamos en ambas llaves para compatibilidad total
        localStorage.setItem("access", token);
        localStorage.setItem("token", token);

        // Guardamos información del usuario
        const nombreUsuario = data?.data?.user?.nombre || data?.user?.nombre || username.trim();
        localStorage.setItem("username", nombreUsuario);
        localStorage.setItem("usuario", nombreUsuario);

        const rol = data?.data?.user?.rol || data?.user?.rol || data?.rol;
        if (rol) {
          localStorage.setItem("rol", rol);
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
      {/* LADO IZQUIERDO: Branding y Mensaje de Bienvenida */}
      <div className="login-sima-left">
        <h1>SIMA</h1>
        <p>Sistema Integrado de Monitoreo y Aprendizaje. Gestiona tu información de forma eficiente, segura y centralizada.</p>
        <div className="login-sima-green-shape"></div>
      </div>

      {/* LADO DERECHO: Formulario de Acceso */}
      <div className="login-sima-right">
        <div className="login-sima-card">
          <h2 className="login-sima-title">INICIAR SESIÓN</h2>
          <p className="login-sima-subtitle">Bienvenido de nuevo, por favor ingresa tus datos para continuar.</p>

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
                className="login-sima-input"
                placeholder="Ingrese su documento"
                value={username}
                onChange={manejarCambioUsername}
                required
              />
            </div>

            <div className="mb-3">
              <label className="login-sima-label">CONTRASEÑA</label>
              <input
                type="password"
                className="login-sima-input"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={manejarCambioPassword}
                required
              />
            </div>

            <span 
              className="login-sima-link" 
              onClick={() => setMostrarOlvide(true)}
            >
              ¿Olvidaste tu contraseña?
            </span>

            <button type="submit" className="login-sima-btn">
              Entrar al sistema
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}