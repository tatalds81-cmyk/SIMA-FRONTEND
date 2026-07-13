const PHOTO_EVENT = "sima:profile-photo-updated";

function obtenerIdentificadorUsuario() {
  try {
    const usuario = JSON.parse(localStorage.getItem("user_data") || "{}") || {};
    return (
      usuario.id_usuario ||
      usuario.id ||
      usuario.persona?.numero_documento ||
      localStorage.getItem("user_documento") ||
      localStorage.getItem("username") ||
      "actual"
    );
  } catch {
    return localStorage.getItem("user_documento") || localStorage.getItem("username") || "actual";
  }
}

export function obtenerClaveFotoPerfil() {
  return `sima_profile_photo_${obtenerIdentificadorUsuario()}`;
}

export function leerFotoPerfil() {
  return localStorage.getItem(obtenerClaveFotoPerfil()) || "";
}

export function guardarFotoPerfil(foto) {
  localStorage.setItem(obtenerClaveFotoPerfil(), foto);
  window.dispatchEvent(new CustomEvent(PHOTO_EVENT, { detail: { foto } }));
}

export function escucharCambiosFotoPerfil(callback) {
  const manejarCambio = (evento) => callback(evento?.detail?.foto ?? leerFotoPerfil());
  const manejarStorage = (evento) => {
    if (evento.key === obtenerClaveFotoPerfil()) callback(evento.newValue || "");
  };

  window.addEventListener(PHOTO_EVENT, manejarCambio);
  window.addEventListener("storage", manejarStorage);
  return () => {
    window.removeEventListener(PHOTO_EVENT, manejarCambio);
    window.removeEventListener("storage", manejarStorage);
  };
}
