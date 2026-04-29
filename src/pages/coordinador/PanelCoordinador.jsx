import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  UserCheck,
  Layers,
  BellRing,
  UserPlus,
  UsersRound,
  PlusCircle
} from "lucide-react";

import CardResumen from "./CardResumen";
import GraficoLineaMultiEje from "./GraficoLineaMultiEje";
import GraficoBarrasApiladas from "./GraficoBarrasApiladas";
import GraficoFichasRiesgo from "./GraficoFichasRiesgo";
import "./coordinador.css";

const URL_RESUMEN_COORDINADOR = "http://localhost:3000/api/dashboard/coordinador/resumen";
const URL_USUARIOS = "/api/users";

function obtenerHeadersDashboard() {
  const token = localStorage.getItem("access") || localStorage.getItem("token");

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function obtenerTokenDashboard() {
  return localStorage.getItem("access") || localStorage.getItem("token");
}

function obtenerNumero(...valores) {
  const valor = valores.find((item) => item !== undefined && item !== null);
  const numero = Number(valor);

  return Number.isFinite(numero) ? numero : 0;
}

function obtenerValorKpi(kpis, campos, palabrasClave = []) {
  const valorDirecto = campos
    .map((campo) => kpis?.[campo])
    .find((valor) => valor !== undefined && valor !== null);

  if (valorDirecto !== undefined && valorDirecto !== null) {
    return obtenerNumero(valorDirecto);
  }

  const entradaRelacionada = Object.entries(kpis || {}).find(([campo]) => {
    const campoNormalizado = campo.toLowerCase();

    return palabrasClave.every((palabra) =>
      campoNormalizado.includes(palabra)
    );
  });

  return obtenerNumero(entradaRelacionada?.[1]);
}

function obtenerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.results)) return respuesta.results;
  return [];
}

function normalizarTexto(valor) {
  return String(valor || "").trim().toLowerCase();
}

function contarUsuariosActivosPorRol(usuarios, rolBuscado) {
  return usuarios.filter((usuario) => {
    const estado = normalizarTexto(usuario.estado);
    const rol = normalizarTexto(usuario.rol?.nombre || usuario.rol);

    return estado === "activo" && rol === rolBuscado;
  }).length;
}

export default function PanelCoordinador() {
  const navigate = useNavigate();

  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    async function cargarDashboard() {
      try {
        setCargando(true);
        setError("");

        if (!obtenerTokenDashboard()) {
          throw new Error("Debes iniciar sesión para cargar el dashboard.");
        }

        const [resResumen, resUsuarios] = await Promise.all([
          fetch(URL_RESUMEN_COORDINADOR, {
            method: "GET",
            headers: obtenerHeadersDashboard(),
          }),
          fetch(URL_USUARIOS, {
            method: "GET",
            headers: obtenerHeadersDashboard(),
          }),
        ]);

        const respuestaResumen = await resResumen.json();
        const respuestaUsuarios = await resUsuarios.json();

        if (!resResumen.ok) {
          throw respuestaResumen;
        }

        if (!resUsuarios.ok) {
          throw respuestaUsuarios;
        }

        const kpis = respuestaResumen?.data?.kpis || respuestaResumen?.data || {};
        const usuarios = obtenerLista(respuestaUsuarios);

        setResumen({
          aprendices_activos: contarUsuariosActivosPorRol(usuarios, "aprendiz"),
          instructores_activos: contarUsuariosActivosPorRol(usuarios, "instructor"),
          total_fichas: obtenerValorKpi(
            kpis,
            [
              "total_grupos_activos",
              "grupos_activos",
              "total_fichas",
              "fichas_activas",
              "fichas",
            ],
            ["grupo"]
          ),
          alertas_activas: obtenerValorKpi(
            kpis,
            [
              "total_alertas_activas",
              "alertas_activas",
              "total_alertas",
              "alertas",
            ],
            ["alerta"]
          ),
        });
      } catch (err) {
        console.log("Error dashboard:", err);
        setError(err?.message || err?.error || "Error al cargar el dashboard");
      } finally {
        setCargando(false);
      }
    }

    cargarDashboard();
  }, []);

  function irCrearUsuario() {
    navigate("/usuarios");
  }

  function irCrearGrupo() {
    navigate("/fichas");
  }

  function mostrarMensajeAprendiz() {
    alert(
      "La funcionalidad de registrar aprendiz será integrada con el módulo correspondiente del sistema."
    );
  }

  const asistenciaSemanal = [
    { nombre: "Lun", valor: 80 },
    { nombre: "Mar", valor: 75 },
    { nombre: "Mié", valor: 90 },
    { nombre: "Jue", valor: 85 },
    { nombre: "Vie", valor: 70 }
  ];

  const alertasSeveridad = [
    { nombre: "Leves", valor: 5 },
    { nombre: "Moderadas", valor: 3 },
    { nombre: "Graves", valor: 2 },
    { nombre: "Críticas", valor: 1 }
  ];

  const aprendicesRiesgo = [
    {
      nombre: "Juan Pérez",
      inasistencias: 5,
      observaciones: 2,
      alertas: 1,
      riesgo: "Alto"
    },
    {
      nombre: "María Gómez",
      inasistencias: 4,
      observaciones: 1,
      alertas: 1,
      riesgo: "Medio"
    },
    {
      nombre: "Ana Martínez",
      inasistencias: 3,
      observaciones: 2,
      alertas: 0,
      riesgo: "Medio"
    }
  ];

  const tarjetasResumen = [
    {
      titulo: "Aprendices activos",
      valor: resumen?.aprendices_activos ?? 0,
      descripcion: "Aprendices con estado activo en formación",
      icono: <GraduationCap size={34} strokeWidth={2.5} />,
      color: "verde"
    },
    {
      titulo: "Instructores activos",
      valor: resumen?.instructores_activos ?? 0,
      descripcion: "Instructores activos registrados en el sistema",
      icono: <UserCheck size={34} strokeWidth={2.5} />,
      color: "verde"
    },
    {
      titulo: "Fichas activas",
      valor: resumen?.total_fichas ?? 0,
      descripcion: "Grupos o fichas activas registradas en SIMA",
      icono: <Layers size={34} strokeWidth={2.5} />,
      color: "azul"
    },
    {
      titulo: "Alertas activas",
      valor: resumen?.alertas_activas ?? 0,
      descripcion: "Alertas académicas o de seguimiento activas",
      icono: <BellRing size={34} strokeWidth={2.5} />,
      color: "verde"
    }
  ];

  return (
    <div className="coordinador-panel">
      <div className="coordinador-seccion-titulo">Dashboard Coordinador</div>

      {cargando && (
        <div className="coordinador-alerta-info">
          Cargando información...
        </div>
      )}

      {error && <div className="coordinador-alerta-error">{error}</div>}

      {(resumen || error) && !cargando && (
        <>
          <div className="coordinador-grid-resumen">
            {tarjetasResumen.map((tarjeta) => (
              <CardResumen
                key={tarjeta.titulo}
                titulo={tarjeta.titulo}
                valor={tarjeta.valor}
                descripcion={tarjeta.descripcion}
                icono={tarjeta.icono}
                color={tarjeta.color}
              />
            ))}
          </div>

          <div className="coordinador-panel-graficas">
            <div className="coordinador-card-grande">
              <div className="coordinador-card-header">
                <h2>Asistencia semanal</h2>
              </div>

              <GraficoLineaMultiEje
                etiquetas={asistenciaSemanal.map((item) => item.nombre)}
              />
            </div>

            <div className="coordinador-card-grande">
              <div className="coordinador-card-header">
                <h2>Alertas por severidad</h2>
              </div>

              <GraficoBarrasApiladas
                etiquetas={alertasSeveridad.map((item) => item.nombre)}
              />
            </div>
          </div>

          <div className="coordinador-card-grande coordinador-card-grafico-riesgo">
            <div className="coordinador-card-header">
              <h2>Fichas con mayor riesgo</h2>
            </div>

            <GraficoFichasRiesgo />
          </div>

          <div className="coordinador-riesgo-wrapper">
            <div className="coordinador-card-grande coordinador-card-riesgo">
              <h2>Top aprendices en riesgo</h2>

              <table className="coordinador-tabla">
                <thead>
                  <tr>
                    <th>Aprendiz</th>
                    <th>Inasistencias</th>
                    <th>Observaciones</th>
                    <th>Alertas</th>
                    <th>Riesgo</th>
                  </tr>
                </thead>

                <tbody>
                  {aprendicesRiesgo.map((aprendiz, index) => (
                    <tr key={index}>
                      <td>{aprendiz.nombre}</td>
                      <td>{aprendiz.inasistencias}</td>
                      <td>{aprendiz.observaciones}</td>
                      <td>{aprendiz.alertas}</td>
                      <td>
                        <span
                          className={`estado ${
                            aprendiz.riesgo === "Alto"
                              ? "denegado"
                              : "pendiente"
                          }`}
                        >
                          {aprendiz.riesgo}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="coordinador-acciones-rapidas">
            <button className="btn-accion verde" onClick={irCrearUsuario}>
              <UserPlus size={22} strokeWidth={2.5} />
              <span>Crear Usuario</span>
            </button>

            <button className="btn-accion verde" onClick={irCrearGrupo}>
              <UsersRound size={22} strokeWidth={2.5} />
              <span>Crear Grupo</span>
            </button>

            <button className="btn-accion azul" onClick={mostrarMensajeAprendiz}>
              <PlusCircle size={22} strokeWidth={2.5} />
              <span>Registrar Aprendiz</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
