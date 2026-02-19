# Retail Viewer (Flask + Jinja2)

Aplicación web SSR para visualizar tiendas, baldas, productos e inventario usando el modelo de `DATA_MODEL.md`.

## Requisitos
- Python 3.10+

## Instalación
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Ejecución
```bash
flask --app app run
```

## Rutas
- `/`: índice con tiendas y productos
- `/stores/<id>`: detalle de tienda (baldas + inventario)
- `/products/<id>`: detalle de producto por tienda
- `/inventory`: inventario global

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
- `stockCount >= 0`
- `shelfCount >= 0`
- `shelfCount <= stockCount`
- Carga total por balda `<= maxCapacity`

Las inconsistencias se muestran como avisos en la interfaz.

## Documentación
- [architecture.md](architecture.md)
- [PRD.md](PRD.md)
- [AGENTS.md](AGENTS.md)
