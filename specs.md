# Specifications

## 1. Functional Specification

### 1.1 Goal
Visualizar productos y tiendas del modelo de datos en una aplicación web Flask + Jinja2.

### 1.2 In Scope (MVP)
- Visualización de entidades: `Store`, `Shelf`, `Product`, `InventoryItem`.
- Uso de atributo `image` en `Store` y `Product` para render visual en listados y detalles.
- Soporte multi-idioma básico en UI (`es` por defecto, `en` opcional).
- Pantallas:
  - Inicio (`/`) con listado de tiendas y productos.
  - Detalle de tienda (`/stores/<id>`) con baldas e inventario relacionado.
  - Detalle de producto (`/products/<id>`) con disponibilidad por tienda.
  - Inventario global (`/inventory`).
- Geolocalización de tienda en mapa interactivo (GeoJSON Point).
- Validaciones de integridad mostradas como warnings.

### 1.3 Out of Scope
- CRUD de entidades desde la UI.
- Persistencia distinta de seed JSON.
- Integración con backend externo/API en esta fase.

## 2. Data Specification

### 2.1 Mandatory Seed Cardinality
El seed debe contener como mínimo:
- 4 tiendas
- 4 baldas por tienda (16 baldas)
- 10 productos
- al menos 2 productos por balda

Referencia de cumplimiento actual:
- 32 `InventoryItem` (2 por balda)

### 2.2 Required Validations
- `stockCount >= 0`
- `shelfCount >= 0`
- `shelfCount <= stockCount`
- suma de `shelfCount` por balda `<= maxCapacity`
- `refStore`, `refShelf`, `refProduct` deben existir

### 2.3 Image Attributes
- `Store.image` debe ser URL válida para imagen online.
- `Product.image` debe ser URL válida para imagen online.
- La UI debe mostrar fallback local cuando una imagen externa no cargue.

## 3. Routing Specification
- `GET /`
  - Resultado: índice con enlaces a detalle de tienda y producto.
- `GET /stores/<id>`
  - Resultado: datos de tienda, tabla de baldas, tabla de inventario, mapa.
- `GET /products/<id>`
  - Resultado: datos de producto y tabla de stock por tienda/balda.
- `GET /inventory`
  - Resultado: tabla global de inventario cruzando tienda/balda/producto.

Parámetro de idioma (opcional, en todas las rutas):
- `?lang=es|en`
  - Resultado: idioma de UI actualizado y persistido en sesión.

## 4. UI Specification
- Renderizado SSR con Jinja2.
- Navegación mínima en cabecera: Inicio + Inventario global.
- Tarjetas y detalles con imágenes representativas de tiendas y productos.
- Tablas legibles para listados de inventario.
- Mensajes de warnings visibles cuando haya inconsistencias.
- Diseño responsive básico (desktop-first).

## 5. Technical Specification
- Runtime: Python 3.10+
- Framework: Flask 3.1.0
- Templates: Jinja2
- Map: Leaflet + OpenStreetMap tiles
- Data source: `data/seed.json`

## 6. Acceptance Criteria
- `flask --app app run` arranca correctamente.
- Las cuatro rutas principales responden sin error.
- Se cumple cardinalidad mínima del seed.
- Los enlaces entre vistas funcionan.
- El mapa se renderiza con GeoJSON válido.
- Las validaciones se ejecutan y reportan inconsistencias.
