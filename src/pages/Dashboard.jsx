import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Dashboard.css";

export default function Dashboard({ children }) {
  const [searchValue, setSearchValue] = useState("");
  const location = useLocation();

  // Determinar qué item debe estar activo en el Sidebar basado en la URL actual
  let activeItem = "inicio";
  if (location.pathname.startsWith("/usuarios")) {
    activeItem = "usuarios";
  } else if (
    location.pathname.startsWith("/fichas") || 
    location.pathname.startsWith("/grupos") || 
    location.pathname.startsWith("/coordinador")
  ) {
    activeItem = "fichas";
  } else if (location.pathname.startsWith("/alertas")) {
    activeItem = "alertas";
  } else if (location.pathname.startsWith("/configuracion")) {
    activeItem = "configuracion";
  }

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    console.log("Búsqueda:", searchValue);
  };

  return (
    <div className="dashboard-container">
      <Navbar 
        searchValue={searchValue}
        onSearchChange={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        placeholder="Buscar usuarios, grupos..."
      />
      
      <div className="dashboard-body">
        <Sidebar activeItem={activeItem} />
        
        <main className="dashboard-content">
          {children || (
            <div className="dashboard-welcome">
              <h1>Bienvenido a SIMA</h1>
              <p>Sistema de Monitoreo y Administración</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
