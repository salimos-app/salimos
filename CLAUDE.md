# Cómo editar este archivo

Al añadir información: conciso, explícito, claro. Sin verbosidad innecesaria.

Estado de cada decisión, etiquetado inline: `[DRAFT]` (sin validar, puede cambiar), `[FINAL]` (cerrada). Sin etiqueta = FINAL.

Al registrar una decisión de diseño nueva: preguntar siempre si es DRAFT o FINAL antes de anotarla.

# Convención: iteración de estilos en componentes

Los componentes con ajuste visual frecuente (hub, pines, etc.) agrupan sus valores tocables en un bloque de constantes nombradas al inicio del archivo ("Controles estéticos"), no sueltos dentro de `StyleSheet.create`.

`// DEBUG` marca una propiedad todavía en draft/iteración — no indica si está activa o comentada, esas son cosas independientes: una propiedad `DEBUG` puede estar descomentada y en uso (probándose en vivo) o comentada (preparada, sin efecto aún). Lo que dice `DEBUG` es "no des esto por cerrado todavía"; sin esa marca, se asume que el valor ya está resuelto. Ejemplo en `src/components/FiltrosBurbujas.tsx` (constantes y estilos del botón).

# Decisiones de diseño

## Tipografía
Sora, única fuente de la app. 3 weights: Regular (400), SemiBold (600), ExtraBold (800).

Estilos `[DRAFT]` (`src/theme/typography.ts` → `TEXT_VARIANTS`):
| Variante | Tamaño | Weight |
|---|---|---|
| display | 24 | ExtraBold |
| heading | 20 | ExtraBold |
| subheading | 16 | SemiBold |
| body | 16 | Regular |
| bodySmall | 12 | Regular |
| label | 12 | SemiBold |
| caption | 12 | SemiBold |
| button | 12 | SemiBold |

## Paleta de colores

Paleta (gradiente atardecer-anochecer):
- `#febd2a` amarillo
- `#f58c46` naranja
- `#de6164` rosa anaranjado
- `#bf3984` magenta
- `#9511a1` morado
- `#5d01a6` violeta

Azul para fondos (tierra del mapa, interrogación del logo):
- `#060711` azul

## Categorías del mapa (pines + hub)

Color fijo por categoría (`src/theme/categoryColors.ts`): taxi `#febd2a`, supermercado `#de6164`, bar/pub `#9511a1`, discoteca `#5d01a6`.

Orden del desplegable del hub, de abajo hacia arriba: taxi → súper → bar → discoteca. Representa el orden cronológico de una salida (taxi, comprar consumibles, tardeo, discoteca) y correlaciona con la paleta de cálido/tarde a frío/noche.

`[DRAFT]` Botones del hub: rectangulares (no circulares), ícono + label dentro. Mismo tratamiento visual que los pines del mapa: relleno translúcido del color de categoría, ícono blanco. Discoteca usa el ícono `discoteca.svg` (no la inicial del nombre) tanto en el pin como en el hub.
