export const tiposObservacion = [
  "Académica",
  "Disciplinaria",
  "Convivencial",
  "Seguimiento",
];

export const severidades = ["Leve", "Moderada", "Alta"];

export const tiposAlertaManual = [
  {
    valor: "inasistencia",
    titulo: "Inasistencia recurrente",
    descripcion: "El aprendiz presenta múltiples ausencias consecutivas.",
  },
  {
    valor: "bajo-rendimiento",
    titulo: "Bajo rendimiento",
    descripcion: "El aprendiz presenta bajo desempeño académico.",
  },
  {
    valor: "riesgo-convivencia",
    titulo: "Riesgo convivencial",
    descripcion: "Se detectaron novedades de convivencia o comportamiento.",
  },
  {
    valor: "seguimiento",
    titulo: "Seguimiento especial",
    descripcion: "El aprendiz requiere acompañamiento prioritario.",
  },
];

export const observacionFormInicial = {
  aprendizId: "",
  tipo: "Académica",
  severidad: "Leve",
  descripcion: "",
};

export const alertaFormInicial = {
  aprendizId: "",
  tipo: "inasistencia",
  severidad: "Moderada",
  justificacion: "",
  descripcion: "",
};

export function obtenerTextoTipoAlerta(tipo) {
  if (typeof tipo === "string") return tipo;
  return tipo.titulo || tipo.valor || "Alerta";
}

export function obtenerValorTipoAlerta(tipo) {
  if (typeof tipo === "string") return tipo;
  return tipo.valor || tipo.titulo || "Alerta";
}
