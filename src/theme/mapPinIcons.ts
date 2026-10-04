/**
 * Íconos de los pines del mapa por categoría (`SimpleMapPoint.kind`).
 * Fuente visual: Material Symbols Rounded (relleno), guardados en `assets/icons/` — esta es
 * su copia embebible, porque los pines los pinta MapLibre como HTML plano
 * (en web, directo al documento; en nativo, dentro de un WebView aislado) y
 * necesitan renderizar sin depender de resolución de assets ni red.
 */
export const PIN_ICON_VIEWBOX = '0 -960 960 960';

export const PIN_ICON_PATHS = {
  // assets/icons/taxi.svg
  taxi: 'M240-200v20q0 25-17.5 42.5T180-120q-25 0-42.5-17.5T120-180v-286q0-7 1-14t3-13l75-213q8-24 29-39t47-15h85v-40q0-17 11.5-28.5T400-840h160q17 0 28.5 11.5T600-800v40h85q26 0 47 15t29 39l75 213q2 6 3 13t1 14v286q0 25-17.5 42.5T780-120q-25 0-42.5-17.5T720-180v-20H240Zm-8-360h496l-42-120H274l-42 120Zm68 240q25 0 42.5-17.5T360-380q0-25-17.5-42.5T300-440q-25 0-42.5 17.5T240-380q0 25 17.5 42.5T300-320Zm360 0q25 0 42.5-17.5T720-380q0-25-17.5-42.5T660-440q-25 0-42.5 17.5T600-380q0 25 17.5 42.5T660-320Z',
  // assets/icons/bar.svg
  bar: 'M440-200v-200L138-740q-8-8-13-18.5t-5-21.5q0-26 18-43t44-17h596q26 0 44 17t18 43q0 11-5 21.5T822-740L520-400v200h160q17 0 28.5 11.5T720-160q0 17-11.5 28.5T680-120H280q-17 0-28.5-11.5T240-160q0-17 11.5-28.5T280-200h160ZM298-680h364l72-80H226l72 80Z',
  // assets/icons/pub.svg
  pub: 'M240-200v-266q-52-14-86-56t-34-98q0-53 30.5-94t78.5-57q23-48 68.5-78T400-879q35 0 65.5 12t55.5 32q10-2 19-3.5t20-1.5q66 0 113 47t47 113q0 22-5.5 42T698-600h62q33 0 56.5 23.5T840-520v240q0 33-23.5 56.5T760-200h-80q-21 21-34.5 50.5T600-120H320q-33 0-56.5-23.5T240-200Zm-40-420q0 33 23.5 56.5T280-540q32 0 54.5-21t46.5-47q25-27 56.5-49.5T520-680h120q0-33-23.5-56.5T560-760q-25 0-42 6.5l-17 6.5-31-26q-11-9-28.5-17.5T400-799q-32 0-58.5 17T301-736l-14 30-32 11q-25 8-40 28.5T200-620Zm480 340h80v-240h-80v240Z',
  // assets/icons/supermercado.svg
  supermarket: 'M280-80q-33 0-56.5-23.5T200-160q0-33 23.5-56.5T280-240q33 0 56.5 23.5T360-160q0 33-23.5 56.5T280-80Zm400 0q-33 0-56.5-23.5T600-160q0-33 23.5-56.5T680-240q33 0 56.5 23.5T760-160q0 33-23.5 56.5T680-80ZM208-800h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h440q17 0 28.5 11.5T760-320q0 17-11.5 28.5T720-280H280q-45 0-68-39.5t-2-78.5l54-98-144-304H80q-17 0-28.5-11.5T40-840q0-17 11.5-28.5T80-880h65q11 0 21 6t15 17l27 57Z',
  // assets/icons/tienda.svg
  convenience: 'M201-120q-33 0-56.5-23.5T121-200v-318q-23-21-35.5-54t-.5-72l42-136q8-26 28.5-43t47.5-17h556q27 0 47 16.5t29 43.5l42 136q12 39-.5 71T841-518v318q0 33-23.5 56.5T761-120H201Zm368-440q27 0 41-18.5t11-41.5l-22-140h-78v148q0 21 14 36.5t34 15.5Zm-180 0q23 0 37.5-15.5T441-612v-148h-78l-22 140q-4 24 10.5 42t37.5 18Zm-178 0q18 0 31.5-13t16.5-33l22-154h-78l-40 134q-6 20 6.5 43t41.5 23Zm540 0q29 0 42-23t6-43l-42-134h-76l22 154q3 20 16.5 33t31.5 13Z',
  // assets/icons/discoteca.svg
  discoteca: 'M280-240v-160L81-698q-14-20-2-41t36-21h410q24 0 36 21t-2 41L360-400v160h40q17 0 28.5 11.5T440-200q0 17-11.5 28.5T400-160H240q-17 0-28.5-11.5T200-200q0-17 11.5-28.5T240-240h40Zm-44-360h168l56-80H180l56 80Zm404 440q-50 0-85-35t-35-85q0-50 35-85t85-35q11 0 21 1.5t19 6.5v-328q0-17 11.5-28.5T720-760h100q25 0 42.5 17.5T880-700q0 25-17.5 42.5T820-640h-60v360q0 50-35 85t-85 35Z',
};

export type PinIconKind = keyof typeof PIN_ICON_PATHS;

/** Path del ícono para un `kind` dinámico (p.ej. `SimpleMapPoint.kind`); `undefined` si no hay uno para esa categoría. */
export function pinIconPath(kind: string | undefined): string | undefined {
  return kind && kind in PIN_ICON_PATHS ? PIN_ICON_PATHS[kind as PinIconKind] : undefined;
}
