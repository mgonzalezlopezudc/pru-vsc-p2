# Implementation Plan

## 1) Estructura base del proyecto
Crear estructura inicial:
- `app.py`
- `requirements.txt`
- `app/__init__.py`
- `app/routes.py`
- `app/models/dto.py`
- `app/services/repository.py`
- `app/templates/base.html`
- `app/templates/store_detail.html`
- `app/templates/product_detail.html`
- `app/templates/inventory.html`
- `app/static/styles.css`
- `app/static/js/map.js`
- `data/seed.json`
- `README.md`

Resultado esperado:
- Aplicación Flask inicializable y con blueprints/rutas registradas.

## 2) Modelado y validaciones
Implementar DTOs para:
- `Store`
- `Shelf`
- `Product`
- `InventoryItem`

Implementar validaciones de negocio:
- no negativos en `stockCount` y `shelfCount`
- `shelfCount <= stockCount`
- no superar `maxCapacity` por estantería

Resultado esperado:
- Carga de datos con detección de inconsistencias y representación segura en UI.

## 3) Capa de datos (seed JSON)
Definir `data/seed.json` con muestras realistas y relaciones válidas:
- 4 tiendas.
- 4 baldas por tienda (16 baldas en total).
- 10 productos.
- Al menos 2 productos por balda (mínimo 32 `InventoryItem` si cada balda tiene exactamente 2).
- `refStore` en `Shelf` e `InventoryItem`
- `refShelf` y `refProduct` en `InventoryItem`

Implementar repositorio para:
- cargar entidades
- resolver relaciones cruzadas
- exponer consultas para vistas

Resultado esperado:
- Consultas reutilizables para construir páginas sin lógica duplicada en rutas.

## 4) Rutas y casos de uso
Implementar rutas:
- `/stores/<id>`: detalle de tienda (estanterías + inventario)
- `/products/<id>`: detalle de producto (stock por tienda)
- `/inventory`: listado global

Resultado esperado:
- Navegación funcional y datos consistentes entre páginas.

## 5) Plantillas Jinja2
Diseñar plantillas con layout común y secciones claras:
- cabecera y navegación en `base.html`
- tablas/listados legibles para inventario y detalles
- estados vacíos y mensajes de error de datos

Resultado esperado:
- UI SSR limpia, comprensible y estable ante datos incompletos.

## 6) Mapa interactivo
Integrar mapa para `location` GeoJSON en vistas de detalle usando JS mínimo.

Resultado esperado:
- Si hay coordenadas válidas, el mapa aparece y centra la ubicación.
- Si no hay ubicación válida, se muestra fallback sin error.

## 7) Verificación
Verificar manualmente:
- arranque (`flask --app app run`)
- cardinalidades del seed (4 tiendas, 16 baldas, 10 productos, >=2 productos por balda)
- render de rutas
- enlaces entre vistas
- validaciones aplicadas
- comportamiento del mapa

Resultado esperado:
- MVP funcional y verificable end-to-end.

## 8) Documentación
Actualizar `README.md` con:
- arquitectura
- estructura de carpetas
- instrucciones de ejecución
- supuestos y límites del MVP

Resultado esperado:
- Onboarding rápido para continuar iteraciones.

## Riesgos y mitigación
- **Riesgo**: inconsistencias en referencias (`ref*`).
  - **Mitigación**: validación temprana + fallback visual.
- **Riesgo**: complejidad de mapas en MVP.
  - **Mitigación**: integración mínima y degradación elegante.
- **Riesgo**: crecimiento de lógica en rutas.
  - **Mitigación**: centralizar en `repository.py`.

## Definición de terminado (DoD)
- Rutas objetivo implementadas y navegables.
- Datos del modelo correctamente representados.
- Validaciones críticas activas.
- Mapa operativo o fallback correcto.
- Documentación mínima completa.