import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import OlvidePassword from "./OlvidePassword";

export default function Login({ onLogin }) {
  const navigate = useNavigate();

  // Aquí guardamos lo que el usuario escribe:
  // puede ser correo, usuario o número de documento.
  const [usuarioLogin, setUsuarioLogin] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarOlvide, setMostrarOlvide] = useState(false);

  // Backend Express
  const URL_LOGIN = "http://localhost:3000/api/auth/login";

  async function iniciarSesion(e) {
    e.preventDefault();
    setMensaje("");

    // Validamos campos vacíos
    if (!usuarioLogin.trim() || !password.trim()) {
      setMensaje("Usuario/correo y contraseña son obligatorios");
      return;
    }

    // Enviamos varios nombres de campo para adaptarnos al backend
    const data = {
      email: usuarioLogin.trim(),
      correo: usuarioLogin.trim(),
      username: usuarioLogin.trim(),
      numero_documento: usuarioLogin.trim(),
      password: password
    };

    try {
      const res = await fetch(URL_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const respuesta = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw respuesta || { message: "Error al iniciar sesión" };
      }

      // Buscamos el token en varias posibles estructuras del backend
      const token =
        respuesta?.data?.access ||
        respuesta?.data?.token ||
        respuesta?.access ||
        respuesta?.token;

      if (!token) {
        console.log("Respuesta del login:", respuesta);
        setMensaje(
          respuesta?.message ||
            respuesta?.detail ||
            "El backend respondió, pero no envió token de acceso"
        );
        return;
      }

      // Guardamos datos para mantener la sesión
      localStorage.setItem("access", token);
      localStorage.setItem("token", token);
      localStorage.setItem("username", usuarioLogin.trim());
      localStorage.setItem("usuario", usuarioLogin.trim());

      // Guardamos rol si el backend lo envía
      const rol =
        respuesta?.data?.user?.rol ||
        respuesta?.data?.usuario?.rol ||
        respuesta?.user?.rol ||
        respuesta?.usuario?.rol;

      if (rol) {
        localStorage.setItem("rol", rol);
      }

      // Avisamos al componente principal que el login fue exitoso
      if (onLogin) {
        onLogin();
      }

      // Redirigimos al dashboard
      navigate("/dashboard");
    } catch (error) {
      console.log("Error login:", error);

      if (error?.message) {
        setMensaje(error.message);
      } else if (error?.error) {
        setMensaje(error.error);
      } else if (error?.errors) {
        setMensaje("Datos de inicio de sesión incorrectos");
      } else {
        setMensaje("Error al iniciar sesión");
      }
    }
  }

  if (mostrarOlvide) {
    return <OlvidePassword onVolver={() => setMostrarOlvide(false)} />;
  }

  return (
    <div className="login-sima-container">
      <div className="login-sima-logo">SIMA</div>

      <div className="login-sima-card">
        <h2 className="login-sima-title">INICIAR SESIÓN</h2>

        {mensaje && <div className="alert alert-info mt-3">{mensaje}</div>}

        <form onSubmit={iniciarSesion}>
          <div className="mb-3">
            <label className="login-sima-label">USUARIO O CORREO</label>
            <input
              type="text"
              className="form-control login-sima-input"
              placeholder="Ingrese su usuario o correo"
              value={usuarioLogin}
              onChange={(e) => {
                setUsuarioLogin(e.target.value);
                if (mensaje) setMensaje("");
              }}
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
              onChange={(e) => {
                setPassword(e.target.value);
                if (mensaje) setMensaje("");
              }}
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