import { useState } from "react";
import "./Login.css";

export default function OlvidePassword({ onVolver }) {
  const [username, setUsername] = useState("");
  const [numeroDocumento, setNumeroDocumento] = useState("");
  const [mensaje, setMensaje] = useState("");

  const URL_OLVIDE = "http://localhost:3000/api/olvide-password/";

  function restablecerPassword(e) {
    e.preventDefault();

    const data = {
      username: username,
      numero_documento: numeroDocumento
    };

    fetch(URL_OLVIDE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })
      .then((res) => {
        return res.json().then((data) => {
          if (!res.ok) throw data;
          return data;
        });
      })
      .then((data) => {
        setMensaje(data.mensaje);
        setUsername("");
        setNumeroDocumento("");
      })
      .catch((error) => {
        if (error.error) {
          setMensaje(error.error);
        } else {
          setMensaje("Error al restablecer la contraseña");
        }
      });
  }

  return (
    <div className="login-sima-container">
      <div className="login-sima-logo">SIMA</div>

      <div className="login-sima-card">
        <h2 className="login-sima-title">RECUPERAR CONTRASEÑA</h2>

        {mensaje && (
          <div className="alert alert-info mt-3">
            {mensaje}
          </div>
        )}

        <form onSubmit={restablecerPassword}>
          <div className="mb-3">
            <label className="login-sima-label">USUARIO</label>
            <input
              type="text"
              className="form-control login-sima-input"
              placeholder="Ingrese su usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label className="login-sima-label">NÚMERO DE DOCUMENTO</label>
            <input
              type="text"
              className="form-control login-sima-input"
              placeholder="Ingrese su número de documento"
              value={numeroDocumento}
              onChange={(e) => setNumeroDocumento(e.target.value)}
              required
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <button type="button" className="btn btn-secondary" onClick={onVolver}>
              Volver
            </button>

            <button type="submit" className="login-sima-btn">
              Restablecer
            </button>
          </div>
        </form>
      </div>

      <div className="login-sima-wave"></div>
    </div>
  );
}