# Salimos Backend

Backend separado para la app de discotecas.

## Arrancar

```bash
npm install
npm start
```

El servicio escucha en el puerto 8082 y expone:

- http://localhost:8082/api/health
- http://localhost:8082/api/microsites/:slug/metadata

## Notas

- Este backend no debe lanzarse desde la app Expo.
- La app móvil debe apuntar a la URL del backend real o al emulador con `10.0.2.2`.
