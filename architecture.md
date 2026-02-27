# Architecture

## 1. Overview
Retail Viewer es una aplicación SSR construida con Flask + Jinja2 para gestionar y visualizar el modelo de datos de tiendas, baldas, productos e inventario definido en `DATA_MODEL.md`.

Objetivo de arquitectura en MVP:
- simplicidad de despliegue
- separación clara entre rutas, dominio y acceso a datos
- validación temprana de integridad de datos

## 2. High-Level Design
Capas principales:
1. **Presentation Layer**
   - Rutas Flask (`app/routes.py`)
   - Formularios Flask-WTF/WTForms (`app/forms.py`)
   - Plantillas Jinja2 (`app/templates/*.html`)
   - Assets estáticos (`app/static/*`)
   - Hoja de estilos estática (`app/static/styles.css`)
2. **Application/Data Layer**
   - Repositorio (`app/services/repository.py`) con consultas para vistas
   - Servicio i18n (`app/services/i18n.py`) para resolución de idioma y traducciones
   - DTOs (`app/models/dto.py`) para modelar entidades
3. **Data Source Layer**
   - Seed local JSON (`data/seed.json`)

## 3. Components
- `app.py`: punto de entrada para ejecutar la aplicación.
- `app/__init__.py`: app factory, configuración (`SEED_PATH`) y filtros de plantilla.
- `app/services/i18n.py`: catálogo de traducciones y utilidades de idioma (`es`/`en`).
- `app/forms.py`: formularios y validación backend (Flask-WTF + WTForms).
- `app/routes.py`: endpoints web y coordinación entre repositorio/plantillas.
- `app/services/repository.py`: carga de datos, validaciones y joins lógicos.
- `app/models/dto.py`: modelos tipados para `Store`, `Shelf`, `Product`, `InventoryItem`.
- `app/templates/*`: renderizado SSR.
- `app/static/js/map.js`: inicialización de mapas Leaflet para ubicación individual (detalle de tienda) y mapa agregado de tiendas en inicio.
- `app/static/js/immersive-store-three.js`: renderizado inmersivo con Three.js en detalle de tienda (estanterías físicas, productos y navegación en primera persona).
- `app/static/styles.css`: estilos base y utilidades visuales.

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
2. `app/__init__.py` resuelve idioma activo (query `lang` o sesión) y lo inyecta en contexto de plantillas.
3. `routes.py` obtiene (o inicializa) `DataRepository`.
4. El repositorio devuelve datos enriquecidos para la vista (joins por IDs de relación).
5. Jinja2 renderiza HTML SSR incluyendo textos traducidos e imágenes de `Store` y `Product`.
6. CSS estático local aporta estilos de dashboard y componentes comunes.
7. Alpine.js gestiona interacciones ligeras de UI (por ejemplo, menú lateral responsive).
8. En vistas con `location`, el frontend inicializa Leaflet con GeoJSON.
9. En inicio, el frontend inicializa un mapa agregado con todas las tiendas y popup resumen por pin.
10. En detalle de tienda, el frontend inicializa una escena Three.js inmersiva para recorrer virtualmente pasillos y estanterías con productos.

Flujo de escritura (POST CRUD embebido en vistas existentes):
1. El usuario envía formulario desde `/`, `/stores/<id>` o `/products/<id>`.
2. WTForms valida campos/rangos y CSRF.
3. `routes.py` invoca operación en `DataRepository`.
4. El repositorio valida integridad de dominio y persiste en `data/seed.json`.
5. Se redirige a la misma vista con mensajes flash.

Operaciones cubiertas:
- CRUD de `Store` y `Product`.
- CRUD de `Shelf` e `InventoryItem` dentro de vistas de tienda/producto.

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
- **Consistencia visual:** sistema de estilos unificado para vistas principales sin alterar rutas ni contratos de datos.

## 8. Future Evolution
- Sustituir seed JSON por SQLite/API.
- Añadir caché y recarga controlada de dataset.
- Incluir tests automatizados de cardinalidad e integridad.
- Añadir filtros/paginación en inventario global.
