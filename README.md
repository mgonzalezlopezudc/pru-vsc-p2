# Retail Viewer (Flask + Jinja2)

Aplicación web SSR para visualizar tiendas, baldas, productos e inventario usando el modelo de `DATA_MODEL.md`.

## Requisitos
- Python 3.10+
- Node.js 18+ (para compilar estilos Tailwind)

## Instalación
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
```

## Frontend (Tailwind + Flowbite + Alpine + Chart.js)
Compilar estilos:
```bash
npm run build:css
```

Modo watch en desarrollo:
```bash
npm run watch:css
```

Salida CSS compilada: `app/static/dist/styles.css`.

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

## Rutas
- `/`: índice con tiendas y productos
- `/stores/<id>`: detalle de tienda (baldas + inventario)
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
