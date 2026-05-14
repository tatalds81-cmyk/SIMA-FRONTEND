import { useState } from 'react';
import {
  Download, Plus, Search, Eye, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsUpDown
} from 'lucide-react';
import { useAlertas } from '../../hooks/useAlertas';
import BadgeSeveridad from '../../components/alertas/BadgeSeveridad';
import BadgeEstado from '../../components/alertas/BadgeEstado';
import AvatarAprendiz from '../../components/alertas/AvatarAprendiz';
import ModalCrearAlerta from '../../components/alertas/ModalCrearAlerta';
import ModalDetalleAlerta from '../../components/alertas/ModalDetalleAlerta';
import './consultarAlertas.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatFecha(isoStr) {
  if (!isoStr) return { fecha: '—', hora: '' };
  const d = new Date(isoStr);
  return {
    fecha: d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    hora:  d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  };
}

function rolDesdeStorage() {
  return (localStorage.getItem('rol') || '').toUpperCase();
}

function puedeCrearAlerta() {
  const rol = rolDesdeStorage();
  return rol === 'INSTRUCTOR_LIDER' || rol === 'INSTRUCTOR_ASIGNADO' || rol === 'INSTRUCTOR';
}

// ── Paginación ────────────────────────────────────────────────────────────────
function Paginacion({ paginaActual, total, limite, onCambiarPagina, onCambiarLimite }) {
  const totalPaginas = Math.max(1, Math.ceil(total / limite));

  function paginas() {
    const rango = [];
    const delta = 2;
    for (let i = Math.max(1, paginaActual - delta); i <= Math.min(totalPaginas, paginaActual + delta); i++) {
      rango.push(i);
    }
    return rango;
  }

  return (
    <div className="ca-pagination">
      <div className="ca-pagination-izq">
        <button
          className="ca-page-btn"
          onClick={() => onCambiarPagina(paginaActual - 1)}
          disabled={paginaActual === 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={15} />
        </button>

        {paginaActual > 3 && (
          <>
            <button className="ca-page-btn" onClick={() => onCambiarPagina(1)}>1</button>
            {paginaActual > 4 && <span className="ca-page-dots">…</span>}
          </>
        )}

        {paginas().map(p => (
          <button
            key={p}
            className={`ca-page-btn${p === paginaActual ? ' ca-page-btn--active' : ''}`}
            onClick={() => onCambiarPagina(p)}
          >
            {p}
          </button>
        ))}

        {paginaActual < totalPaginas - 2 && (
          <>
            {paginaActual < totalPaginas - 3 && <span className="ca-page-dots">…</span>}
            <button className="ca-page-btn" onClick={() => onCambiarPagina(totalPaginas)}>{totalPaginas}</button>
          </>
        )}

        <button
          className="ca-page-btn"
          onClick={() => onCambiarPagina(paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          aria-label="Página siguiente"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="ca-pagination-der">
        <label className="ca-limite-label">Por página:</label>
        <select
          className="ca-limite-select"
          value={limite}
          onChange={e => onCambiarLimite(Number(e.target.value))}
        >
          {[10, 20, 50].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ConsultarAlertas() {
  const [modalOpen, setModalOpen] = useState(false);
  const [detalleAlertaId, setDetalleAlertaId] = useState(null);

  const {
    alertas, loading, error, total,
    paginaActual, limite, filtros,
    cargarAlertas, cambiarFiltro, limpiarFiltros,
    cambiarPagina, cambiarLimite
  } = useAlertas();

  // ── Filtros locales (se aplican al hacer clic en Buscar) ──────────────────
  const [filtrosLocales, setFiltrosLocales] = useState({ ...filtros });

  function handleFiltroLocal(campo, valor) {
    setFiltrosLocales(prev => ({ ...prev, [campo]: valor }));
  }

  function aplicarFiltros() {
    Object.entries(filtrosLocales).forEach(([k, v]) => cambiarFiltro(k, v));
  }

  function handleLimpiar() {
    const vacios = Object.fromEntries(Object.keys(filtrosLocales).map(k => [k, '']));
    setFiltrosLocales(vacios);
    limpiarFiltros();
  }

  // ── Exportar (placeholder) ────────────────────────────────────────────────
  function handleExportar() {
    alert('Funcionalidad de exportación pendiente de integración con el backend.');
  }

  return (
    <div className="ca-page">

      {/* ── Header ── */}
      <div className="ca-page-header">
        <div>
          <h1 className="ca-page-title">Consultar alertas</h1>
        </div>

        <div className="ca-header-acciones">
          {puedeCrearAlerta() && (
            <button type="button" className="ca-btn-primary" onClick={() => setModalOpen(true)}>
              <Plus size={15} /> Nueva alerta manual
            </button>
          )}
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="ca-filtros-card">
        <div className="ca-filtros-fila">
          {/* Buscar aprendiz */}
          <div className="ca-filtro-grupo ca-filtro-grupo--wide">
            <label className="ca-filtro-label">Buscar aprendiz</label>
            <div className="ca-search-wrap">
              <Search size={14} className="ca-search-icon" />
              <input
                type="text"
                className="ca-input ca-input--search"
                placeholder="Nombre o documento..."
                value={filtrosLocales.aprendizBusqueda}
                onChange={e => handleFiltroLocal('aprendizBusqueda', e.target.value)}
                onKeyDown={e => e.key === 'Enter' && aplicarFiltros()}
              />
            </div>
          </div>

          {/* Estado */}
          <div className="ca-filtro-grupo">
            <label className="ca-filtro-label">Estado</label>
            <select className="ca-select" value={filtrosLocales.estado} onChange={e => handleFiltroLocal('estado', e.target.value)}>
              <option value="">Todos</option>
              <option value="ACTIVA">Activa</option>
              <option value="EN_SEGUIMIENTO">En seguimiento</option>
              <option value="CERRADA">Cerrada</option>
            </select>
          </div>

          {/* Severidad */}
          <div className="ca-filtro-grupo">
            <label className="ca-filtro-label">Severidad</label>
            <select className="ca-select" value={filtrosLocales.severidad} onChange={e => handleFiltroLocal('severidad', e.target.value)}>
              <option value="">Todas</option>
              <option value="LEVE">Leve</option>
              <option value="MODERADA">Moderada</option>
              <option value="GRAVE">Grave</option>
            </select>
          </div>

          {/* Tipo */}
          <div className="ca-filtro-grupo">
            <label className="ca-filtro-label">Tipo de alerta</label>
            <select className="ca-select" value={filtrosLocales.tipoAlerta} onChange={e => handleFiltroLocal('tipoAlerta', e.target.value)}>
              <option value="">Todos</option>
              <option value="INASISTENCIA">Inasistencia</option>
              <option value="OBSERVACIONES_RECURRENTES">Observaciones recurrentes</option>
              <option value="MANUAL">Manual</option>
            </select>
          </div>

          {/* Grupo */}
          <div className="ca-filtro-grupo">
            <label className="ca-filtro-label">Grupo</label>
            <input
              type="text"
              className="ca-input"
              placeholder="Ej: 302"
              value={filtrosLocales.grupoId}
              onChange={e => handleFiltroLocal('grupoId', e.target.value)}
            />
          </div>

          {/* Fecha desde */}
          <div className="ca-filtro-grupo">
            <label className="ca-filtro-label">Desde</label>
            <input
              type="date"
              className="ca-input"
              value={filtrosLocales.fechaInicio}
              onChange={e => handleFiltroLocal('fechaInicio', e.target.value)}
            />
          </div>

          {/* Fecha hasta */}
          <div className="ca-filtro-grupo">
            <label className="ca-filtro-label">Hasta</label>
            <input
              type="date"
              className="ca-input"
              value={filtrosLocales.fechaFin}
              onChange={e => handleFiltroLocal('fechaFin', e.target.value)}
            />
          </div>
        </div>

        {/* Acciones de filtro */}
        <div className="ca-filtros-acciones">
          <button type="button" className="ca-btn-outline" onClick={handleLimpiar}>
            Limpiar
          </button>
          <button type="button" className="ca-btn-primary" onClick={aplicarFiltros}>
            <Search size={14} /> Buscar
          </button>
        </div>
      </div>

      {/* ── Resultados ── */}
      <div className="ca-resultados-header">
        <span className="ca-resultados-count">
          Resultados <strong>({total})</strong>
        </span>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="ca-estado-error">
          <p>{error}</p>
          <button type="button" className="ca-btn-outline" onClick={cargarAlertas}>
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="ca-estado-loading">
          <div className="ca-spinner" />
          <span>Cargando alertas...</span>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !error && alertas.length === 0 && (
        <div className="ca-estado-vacio">
          <div className="ca-vacio-icono">🔍</div>
          <p className="ca-vacio-titulo">No se encontraron alertas</p>
          <p className="ca-vacio-sub">Prueba ajustando los filtros aplicados</p>
        </div>
      )}

      {/* Tabla */}
      {!loading && !error && alertas.length > 0 && (
        <div className="ca-tabla-wrap">
          <table className="ca-tabla">
            <thead>
              <tr>
                <th>Aprendiz</th>
                <th>Grupo</th>
                <th>Tipo de alerta</th>
                <th>Severidad</th>
                <th>Estado</th>
                <th className="ca-th-sortable">
                  Fecha creación <ChevronsUpDown size={13} />
                </th>
                <th>Responsable</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {alertas.map(alerta => {
                const { fecha, hora } = formatFecha(alerta.fechaCreacion ?? alerta.createdAt);
                const esGrave = alerta.severidad === 'GRAVE';
                const nombre  = alerta.aprendiz?.nombre ?? alerta.aprendizNombre ?? '—';
                const doc     = alerta.aprendiz?.documento ?? alerta.aprendizDocumento ?? '';

                return (
                  <tr
                    key={alerta.id ?? alerta.alertaId}
                    className={esGrave ? 'ca-fila-grave' : ''}
                  >
                    <td>
                      <div className="ca-aprendiz-cell">
                        <AvatarAprendiz nombre={nombre} size="sm" />
                        <div>
                          <span className="ca-aprendiz-nombre">{nombre}</span>
                          {doc && <span className="ca-aprendiz-doc">{doc}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="ca-cell-texto">
                      {alerta.grupo?.codigo ?? alerta.grupoCodigo ?? alerta.grupoId ?? '—'}
                    </td>
                    <td className="ca-cell-texto">
                      {(alerta.tipoAlerta ?? '').replace(/_/g, ' ')}
                    </td>
                    <td>
                      <BadgeSeveridad severidad={alerta.severidad} />
                    </td>
                    <td>
                      <BadgeEstado estado={alerta.estado} />
                    </td>
                    <td>
                      <span className="ca-fecha-linea1">{fecha}</span>
                      <span className="ca-fecha-linea2">{hora}</span>
                    </td>
                    <td className="ca-cell-texto">
                      {alerta.responsable?.nombre ?? alerta.responsableNombre ?? 'Sistema'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="ca-btn-accion"
                        onClick={() => setDetalleAlertaId(alerta.id ?? alerta.alertaId)}
                        aria-label="Ver detalle"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginación */}
      {!loading && !error && total > 0 && (
        <Paginacion
          paginaActual={paginaActual}
          total={total}
          limite={limite}
          onCambiarPagina={cambiarPagina}
          onCambiarLimite={cambiarLimite}
        />
      )}

      {/* Modal crear alerta */}
      <ModalCrearAlerta
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAlertaCreada={cargarAlertas}
      />

      {/* Modal detalle alerta */}
      <ModalDetalleAlerta
        isOpen={!!detalleAlertaId}
        onClose={() => setDetalleAlertaId(null)}
        alertaId={detalleAlertaId}
      />
    </div>
  );
}
