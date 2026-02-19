# Architecture

## 1. Overview
Retail Viewer es una aplicación SSR construida con Flask + Jinja2 para visualizar el modelo de datos de tiendas, baldas, productos e inventario definido en `DATA_MODEL.md`.

Objetivo de arquitectura en MVP:
- simplicidad de despliegue
- separación clara entre rutas, dominio y acceso a datos
- validación temprana de integridad de datos

## 2. High-Level Design
Capas principales:
1. **Presentation Layer**
   - Rutas Flask (`app/routes.py`)
   - Plantillas Jinja2 (`app/templates/*.html`)
   - Assets estáticos (`app/static/*`)
2. **Application/Data Layer**
   - Repositorio (`app/services/repository.py`) con consultas para vistas
   - DTOs (`app/models/dto.py`) para modelar entidades
3. **Data Source Layer**
   - Seed local JSON (`data/seed.json`)

## 3. Components
- `app.py`: punto de entrada para ejecutar la aplicación.
- `app/__init__.py`: app factory, configuración (`SEED_PATH`) y filtros de plantilla.
- `app/routes.py`: endpoints web y coordinación entre repositorio/plantillas.
- `app/services/repository.py`: carga de datos, validaciones y joins lógicos.
- `app/models/dto.py`: modelos tipados para `Store`, `Shelf`, `Product`, `InventoryItem`.
- `app/templates/*`: renderizado SSR.
- `app/static/js/map.js`: inicialización de mapa para `location` GeoJSON.

## 4. Domain Model Mapping
- `Store` (1..N) `Shelf`
- `Store` (1..N) `InventoryItem`
- `Product` (1..N) `InventoryItem`
- `Shelf` (1..N) `InventoryItem`

`InventoryItem` es la entidad de enlace y base de agregación para vistas globales y de detalle.

Atributos visuales relevantes:
- `Store.image`: URL de imagen representativa de la tienda.
- `Product.image`: URL de imagen representativa del producto.

## 5. Request Flow
1. El cliente solicita una ruta (por ejemplo `/stores/<id>`).
2. `routes.py` obtiene (o inicializa) `DataRepository`.
3. El repositorio devuelve datos enriquecidos para la vista (joins por IDs de relación).
4. Jinja2 renderiza HTML SSR incluyendo imágenes de `Store` y `Product`.
5. En vistas con `location`, el frontend inicializa Leaflet con GeoJSON.

## 6. Validation Strategy
Validaciones aplicadas en carga de seed:
- `stockCount >= 0`
- `shelfCount >= 0`
- `shelfCount <= stockCount`
- carga acumulada por balda `<= maxCapacity`
- referencias existentes (`refStore`, `refShelf`, `refProduct`)

Las incidencias se exponen como warnings no bloqueantes en UI.

## 7. Non-Functional Notes
- **Escalabilidad (MVP):** orientada a dataset local pequeño/medio.
- **Evolución:** el repositorio permite migrar de JSON a SQLite/API sin cambiar plantillas.
- **Observabilidad:** validaciones visibles en interfaz para debugging funcional.

## 8. Future Evolution
- Sustituir seed JSON por SQLite/API.
- Añadir caché y recarga controlada de dataset.
- Incluir tests automatizados de cardinalidad e integridad.
- Añadir filtros/paginación en inventario global.
