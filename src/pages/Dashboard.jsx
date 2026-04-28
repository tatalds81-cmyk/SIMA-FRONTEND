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
    if (location.pathname === "/usuarios") return "usuarios";
    if (location.pathname === "/fichas") return "fichas";
    if (location.pathname === "/alertas") return "alertas";
    if (location.pathname === "/configuracion") return "configuracion";
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