import { useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Dashboard.css";

export default function Dashboard({ children }) {
  const [searchValue, setSearchValue] = useState("");
  const [activeItem, setActiveItem] = useState("inicio");

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
