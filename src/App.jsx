// Importamos useEffect y useState para manejar la sesión
import { useEffect, useState } from "react";

// Importamos BrowserRouter y Routes para las rutas
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Importamos login
import Login from "./pages/Auth/Login";

// Importamos Dashboard
import Dashboard from "./pages/Dashboard";

function App() {
  // Inicializamos el token buscando en el almacenamiento local.
  // Si no existe (null), el sistema mostrará automáticamente el Login.
  const [token, setToken] = useState(localStorage.getItem("access"));

  // Se ejecuta cuando el login es correcto
  function manejarLogin() {
    setToken(localStorage.getItem("access"));
  }

  return (
    <BrowserRouter>
      <Routes>
        {token ? (
          <>
            {/* Rutas protegidas: solo accesibles con sesión iniciada */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<Dashboard />} />
            <Route path="/fichas" element={<Dashboard />} />
            <Route path="/alertas" element={<Dashboard />} />
            <Route path="/configuracion" element={<Dashboard />} />
            {/* Si el usuario intenta ir a otra ruta, lo mandamos al dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            {/* Si no hay token, siempre mostramos el Login */}
            <Route path="/" element={<Login onLogin={manejarLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;