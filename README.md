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
- La visualización incluye estanterías físicas, productos por balda con objetos 3D semánticos (p. ej. botellas, latas, bolsas, tarros y barritas) y recorrido virtual en primera persona (flechas del cursor + ratón).
- La vista 3D permite alternar a pantalla completa desde el HUD del visor.
- La escena 3D incluye un cartel colgante horizontal destacado y carteles de gran tamaño con el nombre de la tienda en 2 puntos de la pared de fondo y 1 en cada pared lateral.
- Se prioriza una estética hiper-realista/premium de tipo showroom mediante materiales PBR refinados (suelo pulido, estanterías metal/cristal con acentos LED, señalética emisiva), atmósfera interior con niebla suave e iluminación multicapa.
- El render aplica postprocesado ligero (`EffectComposer` + `UnrealBloomPass`) para un acabado más cinematográfico sin perder legibilidad.
- La sensibilidad de desplazamiento con flechas está ajustada para movimientos más cortos y precisos.
- Durante el recorrido inmersivo, un panel en tiempo real muestra la atribución/licencia del producto apuntado con la retícula.
- Los productos se mapean a modelos `.glb` locales descargados en `app/static/models/products/` y cargados en runtime con Three.js `GLTFLoader`.
- La escena inmersiva incorpora además el modelo completo `app/static/models/products/supermarket.glb` como entorno base del supermercado (con fallback a la geometría procedural existente).
- El producto `Cola` usa el modelo local `app/static/models/products/source/cola.glb` (extraído desde `classic-cola-can.zip`).
- Atribuciones y licencias de modelos externos: `app/static/models/products/ATTRIBUTION.html`.

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
- `/stores/<id>`: detalle de tienda (mapa + recorrido 3D inmersivo de baldas con Three.js, objetos de producto semánticos hiper-realistas + tablas de baldas e inventario)
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
