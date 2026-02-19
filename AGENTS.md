# AGENTS

Guía para agentes automáticos que trabajen en este repositorio.

## 1. Mission
Mantener y evolucionar una app Flask + Jinja2 que visualiza tiendas, baldas, productos e inventario del modelo en `DATA_MODEL.md`.

## 2. Operating Rules
- Priorizar cambios pequeños, trazables y reversibles.
- Mantener separación por capas (`routes`, `services`, `models`, `templates`, `static`).
- No introducir funcionalidades fuera del alcance MVP sin petición explícita.
- Preservar compatibilidad con seed JSON y rutas existentes.

## 3. Data and Integrity Requirements
- Respetar cardinalidad mínima del seed:
  - 4 tiendas
  - 16 baldas (4 por tienda)
  - 10 productos
  - >=2 productos por balda
- Validar siempre:
  - no negativos en `stockCount`/`shelfCount`
  - `shelfCount <= stockCount`
  - carga por balda <= `maxCapacity`
  - referencias `ref*` resolubles
  - `image` presente y con URL válida en `Store` y `Product`

## 4. Implementation Conventions
- Nuevas consultas de dominio deben vivir en `app/services/repository.py`.
- Evitar lógica de negocio en plantillas Jinja2.
- Reutilizar estructuras DTO en `app/models/dto.py`.
- Mantener nombres de rutas y parámetros estables (`store_id`, `product_id`).

## 5. Verification Checklist (before handoff)
1. Ejecutar verificación de rutas:
   - `python -m flask --app app routes`
2. Comprobar carga de seed y cardinalidades vía snippet o test.
3. Revisar visualmente:
   - `/`
   - `/stores/<id>`
   - `/products/<id>`
   - `/inventory`
4. Confirmar que las imágenes remotas cargan y que el fallback local funciona si fallan.
5. Confirmar que no aparecen warnings inesperados con datos válidos.

## 6. Documentation Policy
Si se cambia comportamiento funcional o estructura:
- actualizar `README.md`
- actualizar `specs.md` si cambian requisitos
- actualizar `architecture.md` si cambia el diseño

## 7. Safe Evolution Path
Para futuras iteraciones:
1. Añadir tests de repositorio y cardinalidad.
2. Introducir abstracción de fuente de datos (JSON/SQLite/API).
3. Incorporar filtros de inventario sin romper rutas actuales.
