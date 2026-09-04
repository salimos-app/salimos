// Convierte las filas snake_case de Turso al shape camelCase que espera el
// frontend (mismo shape que las apps hardcodeadas que sustituyen).

function discotecaFromRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    slug: row.slug,
    direccion: row.direccion,
    descripcion: row.descripcion,
    latitud: row.latitud,
    longitud: row.longitud,
    genero: row.genero,
    precioEntrada: row.precio_entrada ?? undefined,
    rating: row.rating ?? undefined,
    horario: row.horario ?? undefined,
    imagen: row.imagen,
  };
}

function sitioFromRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    categoria: row.categoria,
    latitud: row.latitud,
    longitud: row.longitud,
    direccion: row.direccion ?? undefined,
  };
}

function paradaTaxiFromRow(row) {
  return {
    id: row.id,
    nombre: row.nombre,
    latitud: row.latitud,
    longitud: row.longitud,
  };
}

module.exports = { discotecaFromRow, sitioFromRow, paradaTaxiFromRow };
