import './badges.css';

const CONFIG = {
  ABIERTA:        { label: 'ABIERTA',        clase: 'badge-est badge-est--abierta'   },
  CERRADA:        { label: 'CERRADA',        clase: 'badge-est badge-est--cerrada'   },
  ACTIVA:         { label: 'ABIERTA',        clase: 'badge-est badge-est--abierta'   },
  EN_SEGUIMIENTO: { label: 'ABIERTA',        clase: 'badge-est badge-est--abierta'   }
};

export default function BadgeEstado({ estado }) {
  const cfg = CONFIG[estado] ?? CONFIG.ABIERTA;

  return (
    <span className={cfg.clase}>
      {cfg.label}
    </span>
  );
}
