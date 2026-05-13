import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, Loader2, Search, X } from "lucide-react";
import { buscarAprendices, crearAlertaManual } from "../../services/alertasService";
import Toast from "../common/Toast";
import "./modal.css";

const MOCK_GRUPOS = [
  { id: 1, codigo: "3064975 (ADSO)" },
  { id: 2, codigo: "2850312 (IoT)" },
  { id: 3, codigo: "2901234 (MULTIMEDIA)" },
];

const FORM_INICIAL = {
  aprendizId: "",
  aprendizNombre: "",
  grupoId: "",
  tipoAlerta: "",
  severidad: "",
  descripcion: "",
  notificarLider: true,
};

const TIPOS_ALERTA = [
  { valor: "inasistencia", texto: "Inasistencia" },
  { valor: "ACADEMICA", texto: "Académica" },
  { valor: "CONVIVENCIAL", texto: "Convivencial" },
  { valor: "seguimiento", texto: "Seguimiento" },
];

const MAX_DESC = 500;

function crearFormInicial({ aprendizInicial, grupoInicial, formInicial }) {
  return {
    ...FORM_INICIAL,
    ...(formInicial || {}),
    aprendizId: aprendizInicial?.id || formInicial?.aprendizId || "",
    aprendizNombre: aprendizInicial?.nombre || formInicial?.aprendizNombre || "",
    grupoId: grupoInicial?.id || formInicial?.grupoId || "",
  };
}

export default function ModalCrearAlerta({
  isOpen,
  onClose,
  onAlertaCreada,
  aprendizInicial = null,
  grupoInicial = null,
  formInicial = null,
}) {
  const aprendizBloqueado = Boolean(aprendizInicial?.id);
  const grupos = grupoInicial
    ? [
        grupoInicial,
        ...MOCK_GRUPOS.filter(
          (grupo) => String(grupo.id) !== String(grupoInicial.id)
        ),
      ]
    : MOCK_GRUPOS;

  const [form, setForm] = useState(() =>
    crearFormInicial({ aprendizInicial, grupoInicial, formInicial })
  );
  const [errores, setErrores] = useState({});
  const [loading, setLoading] = useState(false);
  const [duplicado, setDuplicado] = useState(false);
  const [toast, setToast] = useState(null);
  const [busqueda, setBusqueda] = useState(aprendizInicial?.nombre || "");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const debRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const cerrarDropdown = (event) => {
      if (dropRef.current && !dropRef.current.contains(event.target)) {
        setDropOpen(false);
      }
    };

    document.addEventListener("mousedown", cerrarDropdown);
    return () => document.removeEventListener("mousedown", cerrarDropdown);
  }, []);

  useEffect(() => {
    if (aprendizBloqueado) return undefined;

    if (busqueda.length < 3) {
      const limpieza = window.setTimeout(() => {
        setResultados([]);
        setDropOpen(false);
      }, 0);

      return () => window.clearTimeout(limpieza);
    }

    window.clearTimeout(debRef.current);
    debRef.current = window.setTimeout(async () => {
      setBuscando(true);
      const { data } = await buscarAprendices(busqueda);
      setResultados(data || []);
      setBuscando(false);
      setDropOpen(Boolean(data?.length));
    }, 400);

    return () => window.clearTimeout(debRef.current);
  }, [aprendizBloqueado, busqueda]);

  if (!isOpen) return null;

  function resetear() {
    setForm(crearFormInicial({ aprendizInicial, grupoInicial, formInicial }));
    setErrores({});
    setBusqueda(aprendizInicial?.nombre || "");
    setResultados([]);
    setDropOpen(false);
    setDuplicado(false);
    setLoading(false);
  }

  function handleClose() {
    resetear();
    onClose();
  }

  function seleccionarAprendiz(aprendiz) {
    setBusqueda(aprendiz.nombre);
    setForm((actual) => ({
      ...actual,
      aprendizId: aprendiz.id,
      aprendizNombre: aprendiz.nombre,
    }));
    setDropOpen(false);

    if (errores.aprendizId) {
      setErrores((actual) => ({ ...actual, aprendizId: "" }));
    }
  }

  function validar() {
    const nuevosErrores = {};

    if (!form.aprendizId) nuevosErrores.aprendizId = "Selecciona un aprendiz";
    if (!form.grupoId) nuevosErrores.grupoId = "Selecciona un grupo";
    if (!form.tipoAlerta) nuevosErrores.tipoAlerta = "Selecciona el tipo";
    if (!form.severidad) nuevosErrores.severidad = "Selecciona la severidad";

    if (!form.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria";
    } else if (form.descripcion.trim().length < 20) {
      nuevosErrores.descripcion = "Mínimo 20 caracteres";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function enviar(forzar = false) {
    if (!forzar && !validar()) return;

    setLoading(true);
    setDuplicado(false);

    const grupoSeleccionado = grupos.find(
      (grupo) => String(grupo.id) === String(form.grupoId)
    );
    const aprendizDocumento =
      aprendizInicial?.documento ||
      resultados.find((resultado) => resultado.id === form.aprendizId)?.documento ||
      "";

    const payload = {
      ...form,
      aprendizNombre: form.aprendizNombre,
      aprendizDocumento,
      grupoCodigo: grupoSeleccionado?.codigo || "",
      descripcion: form.descripcion.trim(),
    };

    const { data, error } = await crearAlertaManual(payload);

    if (error) {
      if (error.includes("409") || error.includes("duplicada")) {
        setDuplicado(true);
      } else {
        setErrores((actual) => ({ ...actual, _global: error }));
      }

      setLoading(false);
      return;
    }

    setToast({ message: "Alerta registrada correctamente", type: "success" });

    window.setTimeout(() => {
      onAlertaCreada?.({ alerta: data, payload });
      handleClose();
    }, 900);
  }

  const descLen = form.descripcion.length;

  return (
    <>
      <div className="mcal-overlay" onClick={handleClose} />
      <div className="mcal-modal">
        <div className="mcal-header">
          <h2 className="mcal-titulo">Crear alerta manual</h2>
          <button type="button" className="mcal-btn-close" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="mcal-banner info">
          <Info size={18} className="mcal-banner-icon" />
          <p>
            Las alertas manuales reportan situaciones que requieren seguimiento
            académico o convivencial.
          </p>
        </div>

        {duplicado && (
          <div className="mcal-duplicado">
            <AlertTriangle size={15} />
            <div>
              <strong>Ya existe una alerta activa</strong> de este tipo para
              este aprendiz. ¿Deseas crear una nueva de todas formas?
            </div>
            <div className="mcal-duplicado-btns">
              <button
                type="button"
                className="mcal-btn-cancelar"
                onClick={() => setDuplicado(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="mcal-btn-enviar"
                disabled={loading}
                onClick={() => enviar(true)}
              >
                Crear
              </button>
            </div>
          </div>
        )}

        <form
          className="mcal-form"
          onSubmit={(event) => {
            event.preventDefault();
            enviar();
          }}
        >
          <div className="mcal-field" ref={dropRef}>
            <label className="mcal-label">
              Aprendiz <span className="mcal-req">*</span>
            </label>
            <div className={`mcal-search-wrap ${errores.aprendizId ? "error" : ""}`}>
              <input
                type="text"
                className="mcal-input"
                placeholder="Buscar aprendiz por nombre o documento..."
                value={busqueda}
                disabled={aprendizBloqueado}
                onChange={(event) => setBusqueda(event.target.value)}
              />
              <Search size={18} className="mcal-search-icon" />
              {buscando && <Loader2 size={16} className="mcal-search-spin" />}
            </div>
            {dropOpen && resultados.length > 0 && (
              <ul className="mcal-dropdown">
                {resultados.map((aprendiz) => (
                  <li
                    key={aprendiz.id}
                    className="mcal-dropdown-item"
                    onClick={() => seleccionarAprendiz(aprendiz)}
                  >
                    <span className="mcal-drop-nombre">{aprendiz.nombre}</span>
                    <span className="mcal-drop-doc">{aprendiz.documento}</span>
                  </li>
                ))}
              </ul>
            )}
            {errores.aprendizId && (
              <span className="mcal-error-msg">{errores.aprendizId}</span>
            )}
          </div>

          <div className="mcal-field">
            <label className="mcal-label">
              Grupo <span className="mcal-req">*</span>
            </label>
            <select
              className={`mcal-select ${errores.grupoId ? "error" : ""}`}
              value={form.grupoId}
              onChange={(event) =>
                setForm((actual) => ({ ...actual, grupoId: event.target.value }))
              }
            >
              <option value="">Seleccione un grupo</option>
              {grupos.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.codigo}
                </option>
              ))}
            </select>
            {errores.grupoId && (
              <span className="mcal-error-msg">{errores.grupoId}</span>
            )}
          </div>

          <div className="mcal-row">
            <div className="mcal-field">
              <label className="mcal-label">
                Tipo de alerta <span className="mcal-req">*</span>
              </label>
              <select
                className={`mcal-select ${errores.tipoAlerta ? "error" : ""}`}
                value={form.tipoAlerta}
                onChange={(event) =>
                  setForm((actual) => ({
                    ...actual,
                    tipoAlerta: event.target.value,
                  }))
                }
              >
                <option value="">Seleccione el tipo de alerta</option>
                {TIPOS_ALERTA.map((tipo) => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.texto}
                  </option>
                ))}
              </select>
              {errores.tipoAlerta && (
                <span className="mcal-error-msg">{errores.tipoAlerta}</span>
              )}
            </div>

            <div className="mcal-field">
              <label className="mcal-label">
                Severidad <span className="mcal-req">*</span>
              </label>
              <select
                className={`mcal-select ${errores.severidad ? "error" : ""}`}
                value={form.severidad}
                onChange={(event) =>
                  setForm((actual) => ({
                    ...actual,
                    severidad: event.target.value,
                  }))
                }
              >
                <option value="">Seleccione la severidad</option>
                <option value="LEVE">Leve</option>
                <option value="MODERADA">Moderada</option>
                <option value="GRAVE">Grave</option>
              </select>
              <div className="mcal-sev-leyenda">
                <span>
                  <i className="mcal-dot leve" /> LEVE
                </span>
                <span>
                  <i className="mcal-dot moderada" /> MODERADA
                </span>
                <span>
                  <i className="mcal-dot grave" /> GRAVE
                </span>
              </div>
              {errores.severidad && (
                <span className="mcal-error-msg">{errores.severidad}</span>
              )}
            </div>
          </div>

          <div className="mcal-notif-check">
            <label className="mcal-checkbox-container">
              <input
                type="checkbox"
                checked={form.notificarLider}
                onChange={(event) =>
                  setForm((actual) => ({
                    ...actual,
                    notificarLider: event.target.checked,
                  }))
                }
              />
              <span className="mcal-checkmark"></span>
              <div className="mcal-check-text">
                <strong>Notificar al Instructor Líder</strong>
                <span>Se enviará un correo y notificación automática.</span>
              </div>
            </label>
          </div>

          <div className="mcal-field">
            <label className="mcal-label">
              Descripción <span className="mcal-req">*</span>
            </label>
            <textarea
              className={`mcal-textarea ${errores.descripcion ? "error" : ""}`}
              placeholder="Describa detalladamente la situación que requiere seguimiento..."
              maxLength={MAX_DESC}
              value={form.descripcion}
              onChange={(event) =>
                setForm((actual) => ({
                  ...actual,
                  descripcion: event.target.value,
                }))
              }
            />
            <div className="mcal-desc-footer">
              {errores.descripcion && (
                <span className="mcal-error-msg">{errores.descripcion}</span>
              )}
              <span className="mcal-contador">
                {descLen} / {MAX_DESC} caracteres
              </span>
            </div>
          </div>

          {errores._global && (
            <span className="mcal-error-msg">{errores._global}</span>
          )}

          <div className="mcal-footer">
            <button
              type="button"
              className="mcal-btn-cancelar"
              disabled={loading}
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button type="submit" className="mcal-btn-enviar" disabled={loading}>
              {loading ? "Guardando..." : "Guardar alerta"}
            </button>
          </div>
        </form>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
