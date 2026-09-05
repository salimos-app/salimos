# Cómo editar este archivo

Al añadir información: conciso, explícito, claro. Sin verbosidad innecesaria.

Estado de cada decisión, etiquetado inline: `[DRAFT]` (sin validar, puede cambiar), `[FINAL]` (cerrada). Sin etiqueta = FINAL.

Al registrar una decisión de diseño nueva: preguntar siempre si es DRAFT o FINAL antes de anotarla.

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
