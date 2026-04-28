export default function CardResumen({
  titulo,
  valor,
  descripcion,
  icono,
  color = "verde"
}) {
  return (
    <div className={`card-resumen card-resumen-${color}`}>
      <div className="card-resumen-superior">
        <div className="card-resumen-icono">{icono}</div>

        <div className="card-resumen-info">
          <div className="card-resumen-valor">{valor}</div>
          <h3 className="card-resumen-titulo">{titulo}</h3>
        </div>
      </div>

      <p className="card-resumen-descripcion">{descripcion}</p>
    </div>
  );
}