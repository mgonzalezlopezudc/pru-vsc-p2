import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from app.models.dto import InventoryItem, Product, Shelf, Store


class DataValidationError(Exception):
    def __init__(self, messages: list[str]):
        self.messages = messages
        super().__init__("; ".join(messages))


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

        self._warnings, self._shelf_loads = self._collect_validation_issues(payload)

    def _is_valid_url(self, value: str) -> bool:
        parsed = urlparse(value)
        return bool(parsed.scheme in ("http", "https") and parsed.netloc)

    def _collect_validation_issues(
        self,
        payload: dict[str, Any],
    ) -> tuple[list[str], dict[str, int]]:
        warnings: list[str] = []
        shelf_loads: dict[str, int] = defaultdict(int)

        stores = payload.get("stores", [])
        shelves = payload.get("shelves", [])
        products = payload.get("products", [])
        inventory_items = payload.get("inventoryItems", [])

        if len(stores) < 4:
            warnings.append("Dataset must contain at least 4 stores.")
        if len(shelves) < 16:
            warnings.append("Dataset must contain at least 16 shelves.")
        if len(products) < 10:
            warnings.append("Dataset must contain at least 10 products.")

        store_ids = {store.get("id") for store in stores}
        shelf_ids = {shelf.get("id") for shelf in shelves}
        product_ids = {product.get("id") for product in products}

        for store in stores:
            if not store.get("image") or not self._is_valid_url(store.get("image", "")):
                warnings.append(f"Store {store.get('id')} must define a valid image URL.")

        shelves_per_store: dict[str, int] = defaultdict(int)
        for shelf in shelves:
            shelf_store = shelf.get("refStore")
            if shelf_store not in store_ids:
                warnings.append(
                    f"Shelf {shelf.get('id')} references missing Store {shelf_store}."
                )
            if isinstance(shelf_store, str):
                shelves_per_store[shelf_store] += 1

            max_capacity = shelf.get("maxCapacity")
            if not isinstance(max_capacity, int):
                warnings.append(
                    f"Shelf {shelf.get('id')} maxCapacity must be an integer."
                )
            elif max_capacity < 0:
                warnings.append(
                    f"Shelf {shelf.get('id')} has negative maxCapacity ({max_capacity})."
                )

        for store in stores:
            store_id = store.get("id")
            if shelves_per_store.get(store_id, 0) < 4:
                warnings.append(
                    f"Store {store_id} must have at least 4 shelves."
                )

        products_per_shelf: dict[str, int] = defaultdict(int)
        for product in products:
            if not product.get("image") or not self._is_valid_url(product.get("image", "")):
                warnings.append(
                    f"Product {product.get('id')} must define a valid image URL."
                )

        for item in inventory_items:
            stock_count = item.get("stockCount")
            shelf_count = item.get("shelfCount")

            if not isinstance(stock_count, int):
                warnings.append(
                    f"InventoryItem {item.get('id')} stockCount must be an integer."
                )
            elif stock_count < 0:
                warnings.append(
                    f"InventoryItem {item.get('id')} has negative stockCount ({stock_count})."
                )

            if not isinstance(shelf_count, int):
                warnings.append(
                    f"InventoryItem {item.get('id')} shelfCount must be an integer."
                )
            elif shelf_count < 0:
                warnings.append(
                    f"InventoryItem {item.get('id')} has negative shelfCount ({shelf_count})."
                )

            if isinstance(stock_count, int) and isinstance(shelf_count, int) and shelf_count > stock_count:
                warnings.append(
                    f"InventoryItem {item.get('id')} has shelfCount > stockCount ({shelf_count}>{stock_count})."
                )

            ref_store = item.get("refStore")
            ref_shelf = item.get("refShelf")
            ref_product = item.get("refProduct")

            if ref_store not in store_ids:
                warnings.append(
                    f"InventoryItem {item.get('id')} references missing Store {ref_store}."
                )
            if ref_shelf not in shelf_ids:
                warnings.append(
                    f"InventoryItem {item.get('id')} references missing Shelf {ref_shelf}."
                )
            if ref_product not in product_ids:
                warnings.append(
                    f"InventoryItem {item.get('id')} references missing Product {ref_product}."
                )

            related_shelf = next(
                (shelf for shelf in shelves if shelf.get("id") == ref_shelf),
                None,
            )
            if related_shelf is not None and related_shelf.get("refStore") != ref_store:
                warnings.append(
                    f"InventoryItem {item.get('id')} has inconsistent Store/Shelf relationship."
                )

            if isinstance(shelf_count, int) and isinstance(ref_shelf, str):
                shelf_loads[ref_shelf] += shelf_count
                products_per_shelf[ref_shelf] += 1

        for shelf in shelves:
            shelf_id = shelf.get("id")
            shelf_name = shelf.get("name", shelf_id)
            max_capacity = shelf.get("maxCapacity")
            shelf_load = shelf_loads.get(shelf_id, 0)

            if isinstance(max_capacity, int) and shelf_load > max_capacity:
                warnings.append(
                    f"Shelf {shelf_name} exceeds maxCapacity ({shelf_load}/{max_capacity})."
                )

            if products_per_shelf.get(shelf_id, 0) < 2:
                warnings.append(
                    f"Shelf {shelf_id} must contain at least 2 inventory items."
                )

        return warnings, shelf_loads

    def _read_payload(self) -> dict[str, Any]:
        return json.loads(self.seed_path.read_text(encoding="utf-8"))

    def _write_payload(self, payload: dict[str, Any]) -> None:
        self.seed_path.write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        self._load()

    def _validate_payload_or_raise(self, payload: dict[str, Any]) -> None:
        issues, _ = self._collect_validation_issues(payload)
        blocking_issues = [
            issue
            for issue in issues
            if "must contain at least 2 inventory items." not in issue
            and "must have at least 4 shelves." not in issue
        ]
        if blocking_issues:
            raise DataValidationError(blocking_issues)

    def _next_id(self, entity: str) -> str:
        payload = self._read_payload()
        key_map = {
            "Store": "stores",
            "Shelf": "shelves",
            "Product": "products",
            "InventoryItem": "inventoryItems",
        }
        entries = payload.get(key_map[entity], [])
        pattern = re.compile(rf"^urn:ngsi-ld:{entity}:(\d+)$")
        max_value = 0
        for entry in entries:
            entry_id = entry.get("id", "")
            match = pattern.match(entry_id)
            if match:
                max_value = max(max_value, int(match.group(1)))
        return f"urn:ngsi-ld:{entity}:{max_value + 1:03d}"

    def create_store(
        self,
        name: str,
        address: str,
        image: str,
        latitude: float,
        longitude: float,
    ) -> str:
        payload = self._read_payload()
        stores = payload.setdefault("stores", [])
        store_id = self._next_id("Store")
        stores.append(
            {
                "id": store_id,
                "type": "Store",
                "name": name,
                "address": address,
                "image": image,
                "location": {
                    "type": "Point",
                    "coordinates": [longitude, latitude],
                },
            }
        )
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)
        return store_id

    def update_store(
        self,
        store_id: str,
        name: str,
        address: str,
        image: str,
        latitude: float,
        longitude: float,
    ) -> None:
        payload = self._read_payload()
        store = next(
            (entry for entry in payload.get("stores", []) if entry.get("id") == store_id),
            None,
        )
        if store is None:
            raise DataValidationError([f"Store {store_id} does not exist."])

        store["name"] = name
        store["address"] = address
        store["image"] = image
        store["location"] = {
            "type": "Point",
            "coordinates": [longitude, latitude],
        }
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def delete_store(self, store_id: str) -> None:
        payload = self._read_payload()
        stores = payload.get("stores", [])
        if not any(entry.get("id") == store_id for entry in stores):
            raise DataValidationError([f"Store {store_id} does not exist."])

        shelf_ids_to_delete = {
            entry.get("id")
            for entry in payload.get("shelves", [])
            if entry.get("refStore") == store_id
        }
        payload["stores"] = [entry for entry in stores if entry.get("id") != store_id]
        payload["shelves"] = [
            entry
            for entry in payload.get("shelves", [])
            if entry.get("refStore") != store_id
        ]
        payload["inventoryItems"] = [
            entry
            for entry in payload.get("inventoryItems", [])
            if entry.get("refStore") != store_id and entry.get("refShelf") not in shelf_ids_to_delete
        ]
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def create_product(self, name: str, size: str, price: int, image: str) -> str:
        payload = self._read_payload()
        products = payload.setdefault("products", [])
        product_id = self._next_id("Product")
        products.append(
            {
                "id": product_id,
                "type": "Product",
                "name": name,
                "price": price,
                "size": size,
                "image": image,
            }
        )
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)
        return product_id

    def update_product(self, product_id: str, name: str, size: str, price: int, image: str) -> None:
        payload = self._read_payload()
        product = next(
            (entry for entry in payload.get("products", []) if entry.get("id") == product_id),
            None,
        )
        if product is None:
            raise DataValidationError([f"Product {product_id} does not exist."])

        product["name"] = name
        product["size"] = size
        product["price"] = price
        product["image"] = image
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def delete_product(self, product_id: str) -> None:
        payload = self._read_payload()
        products = payload.get("products", [])
        if not any(entry.get("id") == product_id for entry in products):
            raise DataValidationError([f"Product {product_id} does not exist."])

        payload["products"] = [
            entry for entry in products if entry.get("id") != product_id
        ]
        payload["inventoryItems"] = [
            entry
            for entry in payload.get("inventoryItems", [])
            if entry.get("refProduct") != product_id
        ]
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def get_shelf(self, shelf_id: str) -> Shelf | None:
        return self._shelves.get(shelf_id)

    def get_inventory_item(self, item_id: str) -> InventoryItem | None:
        for item in self._inventory:
            if item.id == item_id:
                return item
        return None

    def create_shelf(self, store_id: str, name: str, max_capacity: int) -> str:
        payload = self._read_payload()
        shelves = payload.setdefault("shelves", [])
        store = self._stores.get(store_id)
        if store is None:
            raise DataValidationError([f"Store {store_id} does not exist."])

        shelf_id = self._next_id("Shelf")
        shelves.append(
            {
                "id": shelf_id,
                "type": "Shelf",
                "name": name,
                "location": store.location,
                "maxCapacity": max_capacity,
                "refStore": store_id,
            }
        )
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)
        return shelf_id

    def update_shelf(self, shelf_id: str, name: str, max_capacity: int) -> None:
        payload = self._read_payload()
        shelf = next(
            (entry for entry in payload.get("shelves", []) if entry.get("id") == shelf_id),
            None,
        )
        if shelf is None:
            raise DataValidationError([f"Shelf {shelf_id} does not exist."])

        shelf["name"] = name
        shelf["maxCapacity"] = max_capacity
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def delete_shelf(self, shelf_id: str) -> None:
        payload = self._read_payload()
        shelves = payload.get("shelves", [])
        target = next((entry for entry in shelves if entry.get("id") == shelf_id), None)
        if target is None:
            raise DataValidationError([f"Shelf {shelf_id} does not exist."])

        payload["shelves"] = [entry for entry in shelves if entry.get("id") != shelf_id]
        payload["inventoryItems"] = [
            entry
            for entry in payload.get("inventoryItems", [])
            if entry.get("refShelf") != shelf_id
        ]
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def create_inventory_item(
        self,
        store_id: str,
        shelf_id: str,
        product_id: str,
        stock_count: int,
        shelf_count: int,
    ) -> str:
        payload = self._read_payload()

        inventory_items = payload.setdefault("inventoryItems", [])
        item_id = self._next_id("InventoryItem")
        inventory_items.append(
            {
                "id": item_id,
                "type": "InventoryItem",
                "refProduct": product_id,
                "refStore": store_id,
                "refShelf": shelf_id,
                "stockCount": stock_count,
                "shelfCount": shelf_count,
            }
        )
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)
        return item_id

    def update_inventory_item(
        self,
        item_id: str,
        stock_count: int,
        shelf_count: int,
    ) -> None:
        payload = self._read_payload()
        item = next(
            (entry for entry in payload.get("inventoryItems", []) if entry.get("id") == item_id),
            None,
        )
        if item is None:
            raise DataValidationError([f"InventoryItem {item_id} does not exist."])

        item["stockCount"] = stock_count
        item["shelfCount"] = shelf_count
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

    def delete_inventory_item(self, item_id: str) -> None:
        payload = self._read_payload()
        current = payload.get("inventoryItems", [])
        if not any(entry.get("id") == item_id for entry in current):
            raise DataValidationError([f"InventoryItem {item_id} does not exist."])

        payload["inventoryItems"] = [
            entry for entry in current if entry.get("id") != item_id
        ]
        self._validate_payload_or_raise(payload)
        self._write_payload(payload)

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

    def list_shelves(self) -> list[Shelf]:
        return sorted(self._shelves.values(), key=lambda item: item.name)

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
