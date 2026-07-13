import { useState } from "react";
import { ArrowLeft, IdCard, KeyRound, ShieldCheck } from "lucide-react";
import "./Login.css";
import senaLogo from "../../assets/logoSena.png";
import simaLogo from "../../assets/logoSima.png";
import loginStudents from "../../assets/personajes.png";

export default function OlvidePassword({ onVolver }) {
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [mensaje, setMensaje] = useState("");

  function restablecerPassword(e) {
    e.preventDefault();
    setMensaje(
      "Solicitud recibida. Cuando el servicio este disponible, enviaremos las instrucciones de restablecimiento al canal registrado."
    );
    setNumeroDocumento("");
  }

  return (
    <div className="login-sima-container login-sima-container-recovery">
      <section className="login-sima-hero" aria-label="Recuperacion de acceso">
        <div className="login-sima-brand" aria-label="SENA">
          <img src={senaLogo} alt="Logo SENA" className="login-sima-brand-logo" />
        </div>

        <div className="login-sima-copy">
          <p className="login-sima-eyebrow">Recuperacion de acceso</p>
          <h1>Restablece tu contrasena</h1>
          <p>
            Verificaremos tu documento institucional para ayudarte a recuperar el
            ingreso a SIMA de forma segura.
          </p>
        </div>

        <div className="login-sima-visual" aria-hidden="true">
          <img src={loginStudents} alt="" className="login-sima-students-image" />
        </div>
      </section>

      <main className="login-sima-panel">
        <button className="login-sima-back-link" type="button" onClick={onVolver}>
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Volver al inicio de sesion</span>
        </button>

        <div className="login-sima-card login-sima-recovery-card" role="region" aria-labelledby="olvide-title">
          <div className="login-sima-app-brand" aria-label="SIMA">
            <img src={simaLogo} alt="Logo SIMA" />
          </div>

          <div className="login-sima-recovery-icon" aria-hidden="true">
            <KeyRound size={30} />
          </div>

          <h2 className="login-sima-title" id="olvide-title">Recuperar contrasena</h2>
          <p className="login-sima-subtitle">
            Ingresa tu numero de documento y validaremos tu cuenta.
          </p>

          {mensaje && (
            <div className="login-sima-message" role="status">
              {mensaje}
            </div>
          )}

          <form onSubmit={restablecerPassword} className="login-sima-form">
            <div className="login-sima-field">
              <label className="login-sima-label" htmlFor="recovery-document">Documento</label>
              <div className="login-sima-input-wrap">
                <IdCard size={21} aria-hidden="true" />
                <input
                  id="recovery-document"
                  type="text"
                  className="login-sima-input"
                  placeholder="Ingresa tu numero de documento"
                  value={numeroDocumento}
                  onChange={(e) => setNumeroDocumento(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-sima-btn">
              Solicitar restablecimiento
            </button>
          </form>
        </div>

        <footer className="login-sima-footer login-sima-recovery-footer">
          <div className="login-sima-secure">
            <ShieldCheck size={23} aria-hidden="true" />
            <span>Tu informacion se valida de forma segura.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
