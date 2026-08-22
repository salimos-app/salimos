// Catálogo de tipos de alerta tipo Waze para discotecas.
// Para añadir un tipo nuevo basta con agregar una entrada aquí: el
// WebSocket y el store son genéricos y no conocen los tipos de antemano.
//
// - id: identificador estable, se usa como parte de la key del store.
// - label / icon: texto e icono a mostrar en el cliente.
// - ttlMinutes: cuánto dura activa la alerta desde el último reporte.
// - requiresValue: si true, cada reporte debe incluir un `value` numérico
//   (p.ej. edad mínima exigida) y cada valor distinto se trackea por separado.
// - valuePresets: valores sugeridos para la UI cuando requiresValue es true.
const ALERT_TYPES = [
  {
    id: 'mucha_cola',
    label: 'Mucha cola',
    icon: '⏳',
    ttlMinutes: 45,
  },
  {
    id: 'sitio_vacio',
    label: 'Sitio vacío',
    icon: '🦗',
    ttlMinutes: 45,
  },
  {
    id: 'porteros_problema',
    label: 'Porteros con mala actitud',
    icon: '🚫',
    ttlMinutes: 90,
  },
  {
    id: 'edad_minima',
    label: 'Piden edad mínima',
    icon: '🔞',
    ttlMinutes: 180,
    requiresValue: true,
    valuePresets: [18, 21, 25, 30],
  },
];

const ALERT_TYPES_BY_ID = new Map(ALERT_TYPES.map((type) => [type.id, type]));

module.exports = { ALERT_TYPES, ALERT_TYPES_BY_ID };
