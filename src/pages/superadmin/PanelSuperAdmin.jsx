import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Fingerprint,
  Layers,
  MonitorCog,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import "../coordinador/coordinador.css";
import "./superadmin.css";

const getHeaders = () => {
  const token = localStorage.getItem("access") || localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && token !== "undefined" ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const numero = (valor) => Number(valor || 0);

const calcularProgreso = (valor, maximo) => {
  const actual = numero(valor);
  if (!actual || !maximo) return 0;
  return Math.min(100, Math.max(0, Math.round((actual / maximo) * 100)));
};

export default function PanelSuperAdmin() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarResumen() {
      try {
        const res = await fetch("/api/dashboard/super-admin/resumen", {
          headers: getHeaders(),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || data?.error || "No fue posible cargar el dashboard del super admin");
        }

        if (activo) {
          setResumen(data?.data || null);
          setError("");
        }
      } catch (err) {
        console.error("Error cargando dashboard super admin:", err);
        if (activo) {
          setResumen(null);
          setError(err.message || "No fue posible cargar el dashboard");
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarResumen();
    return () => {
      activo = false;
    };
  }, []);

  const kpis = resumen?.kpis || {};
  const cards = useMemo(() => {
    const resumenCards = [
      {
        titulo: "Usuarios activos",
        valor: kpis.usuarios_activos,
        detalle: `${numero(kpis.total_usuarios)} usuarios registrados`,
        icono: UsersRound,
        tono: "verde",
      },
      {
        titulo: "Grupos activos",
        valor: kpis.total_grupos_activos,
        detalle: `${numero(kpis.total_grupos)} grupos registrados`,
        icono: Layers,
        tono: "amarillo",
      },
      {
        titulo: "Alertas activas",
        valor: kpis.total_alertas_activas,
        detalle: "Alertas abiertas en seguimiento",
        icono: AlertTriangle,
        tono: "rojo",
        alerta: true,
      },
      {
        titulo: "Huellas activas",
        valor: kpis.huellas_activas,
        detalle: `${numero(kpis.huellas_revocadas)} huellas revocadas`,
        icono: Fingerprint,
        tono: "verde",
      },
      {
        titulo: "Dispositivos activos",
        valor: kpis.dispositivos_activos,
        detalle: `${numero(kpis.dispositivos_mantenimiento)} en mantenimiento`,
        icono: MonitorCog,
        tono: "cyan",
      },
      {
        titulo: "Justificaciones pendientes",
        valor: kpis.justificaciones_pendientes,
        detalle: "Pendientes de revision por instructor",
        icono: Bell,
        tono: "morado",
      },
    ];
    const maximo = Math.max(...resumenCards.map((card) => numero(card.valor)), 1);

    return resumenCards.map((card) => ({
      ...card,
      progreso: calcularProgreso(card.valor, maximo),
    }));
  }, [kpis]);

  const usuariosPorRol = [
    { etiqueta: "Coordinadores", valor: numero(kpis.total_coordinadores), color: "#238500" },
    { etiqueta: "Instructores", valor: numero(kpis.total_instructores_activos), color: "#0b2442" },
    { etiqueta: "Aprendices", valor: numero(kpis.total_aprendices_activos), color: "#13a8b5" },
  ];
  const maximoUsuarios = Math.max(...usuariosPorRol.map((item) => item.valor), 1);
  const alertasActivas = numero(kpis.total_alertas_activas);
  const justificacionesPendientes = numero(kpis.justificaciones_pendientes);
  const totalSeguimiento = alertasActivas + justificacionesPendientes;
  const porcentajeAlertas = totalSeguimiento > 0
    ? Math.round((alertasActivas / totalSeguimiento) * 100)
    : 0;

  if (cargando) {
    return (
      <div className="coordinador-panel superadmin-panel">
        <div className="grupos-alert info">Cargando resumen institucional...</div>
      </div>
    );
  }

  return (
    <div className="coordinador-panel superadmin-panel">
      {error && <div className="grupos-alert danger">{error}</div>}

      <section className="dashboard-welcome">
        <section className="dashboard-role-welcome">
          <h1>Bienvenido super administrador</h1>
          <p>Vista global de administracion institucional, biometria e IoT.</p>
        </section>
      </section>

      <section className="coordinador-kpi-grid" aria-label="Resumen institucional">
        {cards.map((card) => {
          const Icon = card.icono;
          return (
            <article className={`coordinador-kpi-card tono-${card.tono}`} key={card.titulo}>
              <div className="coordinador-kpi-top">
                <span className="coordinador-kpi-icon">
                  <Icon size={29} strokeWidth={2.1} />
                </span>
                <span
                  className="coordinador-kpi-ring"
                  style={{ "--kpi-progress": `${card.progreso}%` }}
                  role="img"
                  aria-label={`${card.progreso}% del total mas alto del resumen`}
                ></span>
              </div>
              <h2>{card.titulo}</h2>
              <strong>{numero(card.valor)}</strong>
              <p className={card.alerta ? "negativo" : ""}>{card.alerta ? "Atencion requerida" : "Dato actualizado"}</p>
              <small>{card.detalle}</small>
            </article>
          );
        })}
      </section>

      <section className="superadmin-analytics-grid">
        <article className="coordinador-card superadmin-users-chart">
          <div className="superadmin-chart-heading">
            <div><h2>Usuarios actuales</h2><p>Distribucion de usuarios activos por rol.</p></div>
            <span><UsersRound size={20} /></span>
          </div>
          <div className="superadmin-bars-chart" aria-label="Usuarios activos por rol">
            {usuariosPorRol.map((item) => (
              <div className="superadmin-bar-column" key={item.etiqueta}>
                <strong>{item.valor}</strong>
                <div className="superadmin-bar-track">
                  <span style={{ height: `${item.valor > 0 ? Math.max(12, (item.valor / maximoUsuarios) * 100) : 0}%`, backgroundColor: item.color }}></span>
                </div>
                <small>{item.etiqueta}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="coordinador-card superadmin-donut-card">
          <div className="superadmin-chart-heading">
            <div><h2>Seguimiento pendiente</h2><p>Alertas activas y justificaciones.</p></div>
            <span><ShieldCheck size={20} /></span>
          </div>
          <div className="superadmin-donut-content">
            <div className="superadmin-donut" style={{ "--alert-share": `${porcentajeAlertas}%` }} role="img" aria-label={`${alertasActivas} alertas activas y ${justificacionesPendientes} justificaciones pendientes`}>
              <div><strong>{totalSeguimiento}</strong><small>Total</small></div>
            </div>
            <div className="superadmin-donut-legend">
              <div><span className="legend-dot alertas"></span><p><small>Alertas activas</small><strong>{alertasActivas}</strong></p></div>
              <div><span className="legend-dot justificaciones"></span><p><small>Justificaciones</small><strong>{justificacionesPendientes}</strong></p></div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
