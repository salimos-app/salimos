/**
 * Íconos de los pines del mapa por categoría (`SimpleMapPoint.kind`).
 * Fuente visual: Material Symbols, guardados en `assets/icons/` — esta es
 * su copia embebible, porque los pines los pinta MapLibre como HTML plano
 * (en web, directo al documento; en nativo, dentro de un WebView aislado) y
 * necesitan renderizar sin depender de resolución de assets ni red.
 */
export const PIN_ICON_VIEWBOX = '0 -960 960 960';

export const PIN_ICON_PATHS: Record<string, string> = {
  // assets/icons/taxi.svg
  taxi: 'M240-200v80H120v-360l98-280h142v-80h240v80h142l98 280v360H720v-80H240Zm-8-360h496l-42-120H274l-42 120Zm68 240q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Z',
  // assets/icons/bar.svg
  bar: 'M240-120v-60h210v-244L120-780v-60h720v60L510-424v244h210v60H240Zm41-575h398l83-81H198l83 81Z',
  // assets/icons/pub.svg
  pub: 'M250-120v-352q-52-14-91-53t-39-95q0-53 30.5-94.5T229-772q23-48 68.5-78T400-880q35 0 65.5 12t55.5 33q10-2 19-3.5t20-1.5q66 0 113 47t47 113q0 22-9 44t-23 36h152v400H670v80H250Zm-70-500q0 38 31 64t69 26q32 0 58-17.5t53-50.5q23-28 55-50t74-22h140q0-45-26.5-77.5T560-780q-18 0-35.5 5.5L507-769l-19-16q-18-16-41-25.5t-47-9.5q-35 0-67 18t-47 50l-14 30-32 11q-26 9-43 36t-17 55Zm490 360h110v-280H670v280Z',
  // assets/icons/supermercado.svg
  supermarket: 'M223.5-103.5Q200-127 200-160t23.5-56.5Q247-240 280-240t56.5 23.5Q360-193 360-160t-23.5 56.5Q313-80 280-80t-56.5-23.5Zm400 0Q600-127 600-160t23.5-56.5Q647-240 680-240t56.5 23.5Q760-193 760-160t-23.5 56.5Q713-80 680-80t-56.5-23.5ZM208-800h660L669-440H324l-44 80h480v80H145l119-216-144-304H40v-80h130l38 80Z',
  // assets/icons/tienda.svg
  convenience: 'M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Z',
};
