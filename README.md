# Retail Viewer (Flask + Jinja2)

Aplicación web SSR para visualizar tiendas, baldas, productos e inventario usando el modelo de `DATA_MODEL.md`.

## Requisitos
- Python 3.10+
- Node.js 18+ (opcional, solo para `npm run test:images`)

## Instalación
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Frontend (CSS + Alpine + Chart.js + Leaflet)
Los estilos se sirven desde `app/static/styles.css`.

Vista 3D de baldas:
- En el detalle de tienda (`/stores/<id>`) se renderiza una escena inmersiva con Three.js.
- La visualización incluye estanterías físicas, productos por balda y recorrido virtual en primera persona (flechas del cursor + ratón).

Test visual rápido de carga de imágenes:
```bash
npm run test:images
```

Notas:
- `test:images` ejecuta `tests/image-check.spec.js` con Playwright.
- Requiere app disponible en `http://127.0.0.1:5000`.

## Ejecución
```bash
flask --app app run
```

Con hot-reload (recomendado en desarrollo):
```bash
flask --app app run --debug --reload
```

## Prueba E2E rápida (requests)
Con la app levantada, ejecuta:
```bash
python tests/e2e_crud_requests.py
```

Opcionalmente puedes usar otra URL base:
```bash
BASE_URL=http://127.0.0.1:5000 python tests/e2e_crud_requests.py
```

## Prueba básica de navegación (Playwright CLI)
Ejecuta un smoke test de rutas principales (`/`, `/inventory`, detalle de tienda y detalle de producto):

```bash
bash tests/playwright_smoke.sh
```

Opcionalmente puedes usar otra URL base (si ya tienes la app levantada ahí):

```bash
BASE_URL=http://127.0.0.1:5000 bash tests/playwright_smoke.sh
```

## Rutas
- `/`: índice con tiendas, productos y mapa agregado de tiendas (pins clicables con resumen y enlace a detalle)
- `/stores/<id>`: detalle de tienda (mapa + recorrido 3D inmersivo de baldas con Three.js + tablas de baldas e inventario)
- `/products/<id>`: detalle de producto por tienda
- `/inventory`: inventario global

Rutas POST (sin crear vistas adicionales) para CRUD integrado:
- `/stores/create`
- `/stores/<id>/update`
- `/stores/<id>/delete`
- `/stores/<id>/shelves/create`
- `/stores/<id>/shelves/<shelf_id>/update`
- `/stores/<id>/shelves/<shelf_id>/delete`
- `/stores/<id>/inventory/create`
- `/stores/<id>/inventory/<item_id>/update`
- `/stores/<id>/inventory/<item_id>/delete`
- `/products/create`
- `/products/<id>/update`
- `/products/<id>/delete`
- `/products/<id>/inventory/create`
- `/products/<id>/inventory/<item_id>/update`
- `/products/<id>/inventory/<item_id>/delete`

## Idioma (i18n)
- Idioma por defecto: `es`.
- Idiomas soportados: `es`, `en`.
- Se puede cambiar con query param `?lang=es` o `?lang=en` en cualquier ruta.
- La preferencia se persiste en sesión para siguientes navegaciones.

## Dataset de prueba
`data/seed.json` incluye:
- 4 tiendas
- 4 baldas por tienda (16 baldas)
- 10 productos
- 2 productos por balda (32 `InventoryItem`)
- atributo `image` en cada tienda y producto usando URLs online gratuitas

## Validaciones aplicadas
Frontend:
- Reglas HTML (`required`, `min`) en formularios
- Regla JS para `shelfCount <= stockCount`
- En creación de inventario desde detalle de producto, el selector de baldas se filtra por la tienda seleccionada y exige selección explícita de balda al cambiar tienda

Backend (Flask-WTF + WTForms):
- Validación de campos y rangos en formularios
- CSRF en operaciones POST
- Persistencia en `data/seed.json` solo si pasan validaciones

Integridad de dominio en repositorio:
- `stockCount >= 0`
- `shelfCount >= 0`
- `shelfCount <= stockCount`
- Carga total por balda `<= maxCapacity`
- referencias `refStore`, `refShelf`, `refProduct` resolubles
- coherencia `refShelf` ↔ `refStore`
- `image` válida en `Store` y `Product`

Las inconsistencias se muestran como avisos en la interfaz.

## Documentación
- [architecture.md](architecture.md)
- [PRD.md](PRD.md)
- [AGENTS.md](AGENTS.md)
