import json
from collections import defaultdict
from pathlib import Path
from typing import Any

from app.models.dto import InventoryItem, Product, Shelf, Store


class DataRepository:
    def __init__(self, seed_path: str):
        self.seed_path = Path(seed_path)
        self._stores: dict[str, Store] = {}
        self._shelves: dict[str, Shelf] = {}
        self._products: dict[str, Product] = {}
        self._inventory: list[InventoryItem] = []
        self._warnings: list[str] = []
        self._shelf_loads: dict[str, int] = {}
        self._load()

    def _load(self) -> None:
        payload = json.loads(self.seed_path.read_text(encoding="utf-8"))

        self._stores = {
            item["id"]: Store.from_dict(item)
            for item in payload.get("stores", [])
        }
        self._shelves = {
            item["id"]: Shelf.from_dict(item)
            for item in payload.get("shelves", [])
        }
        self._products = {
            item["id"]: Product.from_dict(item)
            for item in payload.get("products", [])
        }
        self._inventory = [
            InventoryItem.from_dict(item)
            for item in payload.get("inventoryItems", [])
        ]

        self._warnings = []
        self._shelf_loads = defaultdict(int)

        for item in self._inventory:
            self._validate_item(item)
            self._shelf_loads[item.ref_shelf] += item.shelf_count

        for shelf_id, load in self._shelf_loads.items():
            shelf = self._shelves.get(shelf_id)
            if shelf and load > shelf.max_capacity:
                self._warnings.append(
                    f"Shelf {shelf.name} exceeds maxCapacity ({load}/{shelf.max_capacity})."
                )

    def _validate_item(self, item: InventoryItem) -> None:
        if item.stock_count < 0:
            self._warnings.append(
                f"InventoryItem {item.id} has negative stockCount ({item.stock_count})."
            )
        if item.shelf_count < 0:
            self._warnings.append(
                f"InventoryItem {item.id} has negative shelfCount ({item.shelf_count})."
            )
        if item.shelf_count > item.stock_count:
            self._warnings.append(
                f"InventoryItem {item.id} has shelfCount > stockCount ({item.shelf_count}>{item.stock_count})."
            )
        if item.ref_store not in self._stores:
            self._warnings.append(
                f"InventoryItem {item.id} references missing Store {item.ref_store}."
            )
        if item.ref_shelf not in self._shelves:
            self._warnings.append(
                f"InventoryItem {item.id} references missing Shelf {item.ref_shelf}."
            )
        if item.ref_product not in self._products:
            self._warnings.append(
                f"InventoryItem {item.id} references missing Product {item.ref_product}."
            )

    def list_stores(self) -> list[Store]:
        return sorted(self._stores.values(), key=lambda item: item.name)

    def list_products(self) -> list[Product]:
        return sorted(self._products.values(), key=lambda item: item.name)

    def get_store(self, store_id: str) -> Store | None:
        return self._stores.get(store_id)

    def get_product(self, product_id: str) -> Product | None:
        return self._products.get(product_id)

    def list_shelves_by_store(self, store_id: str) -> list[dict[str, Any]]:
        shelves = [
            shelf
            for shelf in self._shelves.values()
            if shelf.ref_store == store_id
        ]
        result = []
        for shelf in sorted(shelves, key=lambda item: item.name):
            current_load = self._shelf_loads.get(shelf.id, 0)
            result.append(
                {
                    "id": shelf.id,
                    "name": shelf.name,
                    "maxCapacity": shelf.max_capacity,
                    "currentLoad": current_load,
                    "location": shelf.location,
                }
            )
        return result

    def list_inventory_global(self) -> list[dict[str, Any]]:
        rows = []
        for item in self._inventory:
            rows.append(self._enrich_item(item))
        return rows

    def list_inventory_by_store(self, store_id: str) -> list[dict[str, Any]]:
        rows = []
        for item in self._inventory:
            if item.ref_store == store_id:
                rows.append(self._enrich_item(item))
        return rows

    def list_inventory_by_product(self, product_id: str) -> list[dict[str, Any]]:
        rows = []
        for item in self._inventory:
            if item.ref_product == product_id:
                rows.append(self._enrich_item(item))
        return rows

    def _enrich_item(self, item: InventoryItem) -> dict[str, Any]:
        store = self._stores.get(item.ref_store)
        shelf = self._shelves.get(item.ref_shelf)
        product = self._products.get(item.ref_product)

        return {
            "id": item.id,
            "storeId": item.ref_store,
            "storeName": store.name if store else "N/A",
            "storeImage": store.image if store else "",
            "shelfId": item.ref_shelf,
            "shelfName": shelf.name if shelf else "N/A",
            "productId": item.ref_product,
            "productName": product.name if product else "N/A",
            "productImage": product.image if product else "",
            "productSize": product.size if product else "N/A",
            "productPrice": product.price if product else 0,
            "stockCount": item.stock_count,
            "shelfCount": item.shelf_count,
        }

    def get_warnings(self) -> list[str]:
        return self._warnings
