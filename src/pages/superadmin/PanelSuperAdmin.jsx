import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Fingerprint,
  Layers,
  MonitorCog,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import "../coordinador/coordinador.css";

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
        titulo: "Coordinadores",
        valor: kpis.total_coordinadores,
        detalle: "Coordinadores institucionales",
        icono: ShieldCheck,
        tono: "morado",
      },
      {
        titulo: "Instructores activos",
        valor: kpis.total_instructores_activos,
        detalle: "Disponibles para grupos y sesiones",
        icono: UserCheck,
        tono: "cyan",
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

  const estadoInstitucional = [
    { etiqueta: "Areas registradas", valor: kpis.total_areas },
    { etiqueta: "Programas activos", valor: kpis.total_programas },
    { etiqueta: "Ambientes activos", valor: kpis.ambientes_activos },
    { etiqueta: "Observaciones abiertas", valor: kpis.total_observaciones_abiertas },
  ];

  const novedadesSistema = [
    {
      icono: ShieldCheck,
      titulo: "Control institucional",
      texto: `${numero(kpis.total_coordinadores)} coordinadores y ${numero(kpis.total_instructores_activos)} instructores activos.`,
    },
    {
      icono: Fingerprint,
      titulo: "Biometria",
      texto: `${numero(kpis.huellas_activas)} huellas activas y ${numero(kpis.huellas_revocadas)} revocadas.`,
    },
    {
      icono: MonitorCog,
      titulo: "IoT y ambientes",
      texto: `${numero(kpis.intentos_iot_hoy)} intentos hoy en ${numero(kpis.ambientes_activos)} ambientes activos.`,
    },
  ];

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

      <section className="coordinador-main-grid">
        <article className="coordinador-card">
          <div className="coordinador-card-header">
            <div>
              <h2>Operacion academica</h2>
              <strong>{numero(kpis.total_areas)} areas, {numero(kpis.total_programas)} programas</strong>
              <p>{numero(kpis.total_aprendices_activos)} aprendices activos y {numero(kpis.total_observaciones_abiertas)} observaciones abiertas.</p>
            </div>
          </div>
        </article>

        <article className="coordinador-card">
          <div className="coordinador-card-header">
            <div>
              <h2>Biometria e IoT</h2>
              <strong>{numero(kpis.intentos_iot_hoy)} intentos IoT hoy</strong>
              <p>{numero(kpis.ambientes_activos)} ambientes activos de {numero(kpis.total_ambientes)} registrados.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="coordinador-secondary-grid">
        <article className="coordinador-card coordinador-estado">
          <h2>Estado institucional</h2>
          {estadoInstitucional.map((item) => (
            <div className="coordinador-estado-row" key={item.etiqueta}>
              <span>{item.etiqueta}</span>
              <strong>{numero(item.valor)}</strong>
            </div>
          ))}
          <div className="coordinador-meta">
            <div>
              <span>Seguimiento global</span>
              <strong>{numero(kpis.total_alertas_activas)} alertas</strong>
            </div>
            <span className="coordinador-meta-track">
              <span></span>
            </span>
          </div>
        </article>

        <article className="coordinador-novedades">
          <h2>
            <ShieldCheck size={21} />
            Gestion del sistema
          </h2>
          <div className="coordinador-novedades-list">
            {novedadesSistema.map((item) => {
              const Icon = item.icono;
              return (
                <div className="coordinador-novedad-item" key={item.titulo}>
                  <Icon size={25} />
                  <div>
                    <strong>{item.titulo}</strong>
                    <p>{item.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
