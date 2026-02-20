# AGENTS

Guía para agentes automáticos que trabajen en este repositorio.

## 1. Mission
Mantener y evolucionar una app Flask + Jinja2 que gestiona y visualiza tiendas, baldas, productos e inventario del modelo en `DATA_MODEL.md`.

## 2. Operating Rules
- Priorizar cambios pequeños, trazables y reversibles.
- Mantener separación por capas (`routes`, `services`, `models`, `templates`, `static`).
- No introducir funcionalidades fuera del alcance MVP sin petición explícita.
- Preservar compatibilidad con seed JSON y rutas existentes.
- No crear vistas adicionales para CRUD: reutilizar `index`, `store_detail` y `product_detail`.
- Mantener edición de baldas e inventario dentro de vistas de tienda/producto.

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
- Validación backend de formularios con Flask-WTF + WTForms y CSRF activo.
- Validación frontend complementaria con reglas HTML y JS (nunca sustituye backend).

## 5. Verification Checklist (before handoff)
1. Ejecutar verificación de rutas:
   - `python -m flask --app app routes`
2. Compilar estilos frontend:
  - `npm run build:css`
3. Comprobar carga de seed y cardinalidades vía snippet o test.
4. Revisar visualmente:
   - `/`
   - `/stores/<id>`
   - `/products/<id>`
   - `/inventory`
5. Confirmar que las imágenes remotas cargan y que el fallback local funciona si fallan.
6. Ejecutar chequeo visual automatizado de imágenes (si aplica):
  - `npm run test:images`
7. Confirmar que no aparecen warnings inesperados con datos válidos.
8. Ejecutar prueba E2E de CRUD (si aplica):
  - `python tests/e2e_crud_requests.py`

## 6. Documentation Policy
Si se cambia comportamiento funcional o estructura:
- actualizar `README.md`
- actualizar `PRD.md` si cambian requisitos
- actualizar `architecture.md` si cambia el diseño

## 7. Safe Evolution Path
Para futuras iteraciones:
1. Añadir tests de repositorio y cardinalidad.
2. Introducir abstracción de fuente de datos (JSON/SQLite/API).
3. Incorporar filtros de inventario sin romper rutas actuales.
