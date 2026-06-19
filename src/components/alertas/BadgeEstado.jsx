import './badges.css';

const CONFIG = {
  ABIERTA:        { label: 'ABIERTA',        clase: 'badge-est badge-est--abierta'   },
  ACTIVA:         { label: 'ACTIVA',         clase: 'badge-est badge-est--activa'    },
  CERRADA:        { label: 'CERRADA',        clase: 'badge-est badge-est--cerrada'   },
  EN_SEGUIMIENTO: { label: 'EN SEGUIMIENTO', clase: 'badge-est badge-est--seguimiento' }
};

export default function BadgeEstado({ estado }) {
  const cfg = CONFIG[estado] ?? CONFIG.ABIERTA;

  return (
    <span className={cfg.clase}>
      {cfg.label}
    </span>
  );
}
