import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, HelpCircle, Lock, Mail, ShieldCheck } from "lucide-react";
import "./Login.css";
import OlvidePassword from "./OlvidePassword";
import senaLogo from "../../assets/logoSena.png";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [mostrarOlvide, setMostrarOlvide] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const URL_LOGIN = "/api/auth/login";
  const URL_ME = "/api/auth/me";

  async function iniciarSesion(e) {
    if (e) e.preventDefault();
    setMensaje("");
    setCargando(true);

    try {
      const data = {
        numero_documento: username.trim(),
        documento: username.trim(),
        password
      };

      const res = await fetch(URL_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const loginData = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(loginData?.message || loginData?.error || `Error ${res.status}: No se pudo iniciar sesion.`);
      }

      const token =
        loginData?.data?.access ||
        loginData?.data?.token ||
        loginData?.data?.access_token ||
        loginData?.data?.user?.token ||
        loginData?.access ||
        loginData?.token;

      if (!token) {
        throw new Error("El servidor no envio un token de acceso valido.");
      }

      localStorage.setItem("access", token);
      localStorage.setItem("token", token);

      const userLogin = loginData?.data?.user || loginData?.user || null;
      let userMe = null;

      try {
        const meRes = await fetch(URL_ME, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        const meData = await meRes.json().catch(() => null);
        if (meRes.ok) {
          userMe = meData?.data || meData || null;
        }
      } catch (meError) {
        console.warn("No se pudo consultar /me:", meError);
      }

      const usuarioFinal = userMe || userLogin || {};
      const persona = usuarioFinal.persona || userLogin?.persona || {};
      const nombreCompleto = `${persona.nombres || ""} ${persona.apellidos || ""}`.trim();
      const nombreUsuario = nombreCompleto || usuarioFinal.email || username.trim();
      const rol = usuarioFinal.rol || userLogin?.rol || loginData?.rol || "";

      localStorage.setItem("username", nombreUsuario);
      localStorage.setItem("usuario", nombreUsuario);
      localStorage.setItem("rol", rol);
      localStorage.setItem("user_email", usuarioFinal.email || "");
      localStorage.setItem("user_documento", persona.numero_documento || username.trim());
      localStorage.setItem("user_data", JSON.stringify(usuarioFinal));

      setMensaje("Inicio de sesion correcto");

      const rolNormalizado = String(rol || "").toLowerCase();
      const rutaInicio = rolNormalizado === "instructor" ? "/instructor/dashboard" : "/dashboard";

      if (onLogin) {
        onLogin();
      }
      navigate(rutaInicio);
    } catch (error) {
      console.log("Error login:", error);

      if (error instanceof TypeError && error.message === "Failed to fetch") {
        setMensaje("No se pudo conectar con el servidor. Verifica que el backend este corriendo y los permisos CORS.");
      } else {
        setMensaje(error.message || "Error al iniciar sesion");
      }
    } finally {
      setCargando(false);
    }
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
      <section className="login-sima-hero" aria-label="Bienvenida al sistema SIMA">
        <div className="login-sima-brand" aria-label="SENA">
          <img src={senaLogo} alt="Logo SENA" className="login-sima-brand-logo" />
        </div>

        <div className="login-sima-copy">
          <p className="login-sima-eyebrow">Bienvenido al</p>
          <h1>Sistema de Asistencias y Observatorio</h1>
          <p>
            Gestiona tus asistencias y consulta tu desempeno academico de forma
            facil y eficiente.
          </p>
        </div>

        <div className="login-sima-visual" aria-hidden="true">
          <div className="login-sima-orbit"></div>
          <div className="login-sima-orbit-dot"></div>
          <div className="login-sima-green-shape"></div>
          <div className="login-sima-students">
            <span className="student student-one"></span>
            <span className="student student-two"></span>
          </div>
        </div>
      </section>

      <main className="login-sima-panel">
        <button className="login-sima-help" type="button">
          <HelpCircle size={18} aria-hidden="true" />
          <span>Necesitas ayuda?</span>
        </button>

        <div className="login-sima-card" role="region" aria-labelledby="login-title">
          <h2 className="login-sima-title" id="login-title">Iniciar sesion</h2>
          <p className="login-sima-subtitle">Ingresa tus credenciales para continuar</p>

          <form onSubmit={iniciarSesion} className="login-sima-form">
            <div className="login-sima-field">
              <label className="login-sima-label" htmlFor="login-user">
                Documento institucional
              </label>
              <div className="login-sima-input-wrap">
                <Mail size={21} aria-hidden="true" />
                <input
                  id="login-user"
                  type="text"
                  className="login-sima-input"
                  placeholder="Ingresa tu numero de documento"
                  value={username}
                  onChange={manejarCambioUsername}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="login-sima-field">
              <label className="login-sima-label" htmlFor="login-password">Contrasena</label>
              <div className="login-sima-input-wrap">
                <Lock size={21} aria-hidden="true" />
                <input
                  id="login-password"
                  type={mostrarPassword ? "text" : "password"}
                  className="login-sima-input"
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={manejarCambioPassword}
                  autoComplete="current-password"
                  required
                />
                <button
                  className="login-sima-password-btn"
                  type="button"
                  onClick={() => setMostrarPassword((value) => !value)}
                  aria-label={mostrarPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                >
                  {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="login-sima-link"
              onClick={() => setMostrarOlvide(true)}
            >
              Olvidaste tu contrasena?
            </button>

            {mensaje && (
              <div className="login-sima-message" role="status">
                {mensaje}
              </div>
            )}

            <button type="submit" className="login-sima-btn" disabled={cargando}>
              {cargando ? "Ingresando..." : "Iniciar sesion"}
            </button>
          </form>
        </div>

        <footer className="login-sima-footer">
          <div className="login-sima-secure">
            <ShieldCheck size={23} aria-hidden="true" />
            <span>Tu informacion esta protegida con los mas altos estandares de seguridad.</span>
          </div>
          <div className="login-sima-legal">
            <div>
              <a href="#privacidad">Politicas de privacidad</a>
              <span>|</span>
              <a href="#terminos">Terminos y condiciones</a>
            </div>
            <p>(c) 2024 SENA. Todos los derechos reservados.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
