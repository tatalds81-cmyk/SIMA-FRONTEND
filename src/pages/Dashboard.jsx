import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Dashboard.css";

export default function Dashboard({ children }) {
  const [searchValue, setSearchValue] = useState("");
  const location = useLocation();

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  const handleSearchSubmit = () => {
    console.log("Búsqueda:", searchValue);
  };

  function obtenerItemActivo() {
    if (location.pathname.startsWith("/usuarios")) return "usuarios";
    if (location.pathname.startsWith("/fichas")) return "fichas";
    if (location.pathname.startsWith("/alertas")) return "alertas";
    if (location.pathname.startsWith("/configuracion")) return "configuracion";
    return "inicio";
  }

  return (
    <div className="dashboard-container">
      <Navbar
        searchValue={searchValue}
        onSearchChange={handleSearch}
        onSearchSubmit={handleSearchSubmit}
        placeholder="Buscar usuarios, grupos..."
      />

      <div className="dashboard-body">
        <Sidebar activeItem={obtenerItemActivo()} />

        <main className="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}