import React, { useState } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Dashboard.css";

export default function Dashboard({ children }) {
  const [searchValue, setSearchValue] = useState("");
  const [activeItem, setActiveItem] = useState("inicio");

  const handleSearch = (value) => {
    setSearchValue(value);
  };

  return (
    <div className="sima-dashboard-layout">
      {/* Sidebar Fijo a la Izquierda */}
      <Sidebar activeItem={activeItem} />

      {/* Contenedor Derecho (Navbar + Contenido Variable) */}
      <div className="sima-main-container">
        <Navbar onSearch={handleSearch} />
        
        {/* Aquí se renderiza el componente que venga por children */}
        <div className="sima-page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
