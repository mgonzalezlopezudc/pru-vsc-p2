# TASK

## Objetivo
Construir una aplicación web con Flask y Jinja2 para visualizar tiendas, productos e inventario según el modelo descrito en [DATA_MODEL.md](DATA_MODEL.md).

## Alcance (MVP)
- Visualización de entidades: `Store`, `Shelf`, `Product`, `InventoryItem`.
- Dataset de prueba mínimo:
  - 4 tiendas.
  - 4 baldas por tienda (16 baldas en total).
  - 10 productos.
  - Al menos 2 productos por balda.
- Pantallas mínimas:
  - Detalle de tienda con estanterías e inventario.
  - Detalle de producto con disponibilidad por tienda.
  - Vista global de inventario.
- Fuente de datos inicial: JSON local de seed.
- Geolocalización: visualización en mapa interactivo a partir de `location` (GeoJSON).
- Validaciones en carga/render:
  - `stockCount >= 0`
  - `shelfCount >= 0`
  - `shelfCount <= stockCount`
  - respeto de `maxCapacity` en estantería

## Fuera de alcance (esta fase)
- Integración con API externa.
- Persistencia en base de datos (SQLite o similar).
- Escritura/edición de datos desde UI.

## Criterios de aceptación
- La app arranca con `flask --app app run`.
- El seed incluye 4 tiendas, 16 baldas, 10 productos y mínimo 2 productos por balda.
- Existe navegación funcional entre vistas de detalle y vista global.
- Cada detalle de tienda muestra estanterías e items de inventario relacionados.
- Cada detalle de producto muestra stock por tienda.
- La vista global de inventario agrega correctamente producto/tienda/estantería.
- El mapa se renderiza cuando hay GeoJSON válido.
- Datos inconsistentes no rompen la UI y muestran avisos/fallback.

## Entregables
- Código Flask + Jinja2 estructurado por capas (rutas, servicios, plantillas, estáticos).
- Datos seed locales coherentes con el modelo.
- Documentación de ejecución y arquitectura mínima.