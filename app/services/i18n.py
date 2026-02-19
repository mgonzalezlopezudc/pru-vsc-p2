DEFAULT_LANGUAGE = "es"
SUPPORTED_LANGUAGES = ("es", "en")

LANGUAGE_LABELS = {
    "es": "ES",
    "en": "EN",
}

TRANSLATIONS = {
    "es": {
        "app.title": "Retail Viewer",
        "app.header": "Retail Data Viewer",
        "nav.home": "Inicio",
        "nav.inventory": "Inventario global",
        "lang.label": "Idioma",
        "warnings.title": "Validaciones",
        "index.title": "Inicio | Retail Viewer",
        "index.eyebrow": "Retail intelligence",
        "index.heading": "Explora tiendas y productos con una vista clara del inventario",
        "index.meta": "Dataset de prueba con 4 tiendas, 16 baldas y 10 productos enlazados.",
        "index.stores": "Tiendas",
        "index.products": "Productos",
        "store.title": "{name} | Tienda",
        "store.eyebrow": "Tienda",
        "store.location": "Ubicación",
        "store.shelves": "Baldas",
        "store.inventory": "Inventario de la tienda",
        "product.title": "{name} | Producto",
        "product.eyebrow": "Producto",
        "product.size": "Tamaño",
        "product.price": "Precio",
        "product.availability": "Disponibilidad por tienda",
        "inventory.title": "Inventario global | Retail Viewer",
        "inventory.heading": "Inventario global",
        "table.name": "Nombre",
        "table.current_load": "Carga actual",
        "table.max_capacity": "Capacidad máxima",
        "table.store": "Tienda",
        "table.shelf": "Balda",
        "table.product": "Producto",
        "table.price": "Precio",
        "table.stock_total": "Stock total",
        "table.on_shelf": "En balda",
    },
    "en": {
        "app.title": "Retail Viewer",
        "app.header": "Retail Data Viewer",
        "nav.home": "Home",
        "nav.inventory": "Global inventory",
        "lang.label": "Language",
        "warnings.title": "Validations",
        "index.title": "Home | Retail Viewer",
        "index.eyebrow": "Retail intelligence",
        "index.heading": "Explore stores and products with a clear inventory view",
        "index.meta": "Test dataset with 4 stores, 16 shelves, and 10 linked products.",
        "index.stores": "Stores",
        "index.products": "Products",
        "store.title": "{name} | Store",
        "store.eyebrow": "Store",
        "store.location": "Location",
        "store.shelves": "Shelves",
        "store.inventory": "Store inventory",
        "product.title": "{name} | Product",
        "product.eyebrow": "Product",
        "product.size": "Size",
        "product.price": "Price",
        "product.availability": "Availability by store",
        "inventory.title": "Global inventory | Retail Viewer",
        "inventory.heading": "Global inventory",
        "table.name": "Name",
        "table.current_load": "Current load",
        "table.max_capacity": "Maximum capacity",
        "table.store": "Store",
        "table.shelf": "Shelf",
        "table.product": "Product",
        "table.price": "Price",
        "table.stock_total": "Total stock",
        "table.on_shelf": "On shelf",
    },
}


def normalize_language(language: str | None) -> str | None:
    if language is None:
        return None
    language_code = language.strip().lower()
    if language_code in SUPPORTED_LANGUAGES:
        return language_code
    return None


def translate(language: str, key: str, **kwargs: str) -> str:
    catalog = TRANSLATIONS.get(language, TRANSLATIONS[DEFAULT_LANGUAGE])
    message = catalog.get(key, TRANSLATIONS[DEFAULT_LANGUAGE].get(key, key))
    if kwargs:
        return message.format(**kwargs)
    return message