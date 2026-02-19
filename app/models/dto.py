from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class Store:
    id: str
    type: str
    name: str
    address: str
    image: str
    location: dict[str, Any]

    @staticmethod
    def from_dict(payload: dict[str, Any]) -> "Store":
        return Store(
            id=payload["id"],
            type=payload.get("type", "Store"),
            name=payload["name"],
            address=payload["address"],
            image=payload.get("image", ""),
            location=payload.get("location", {}),
        )


@dataclass(slots=True)
class Shelf:
    id: str
    type: str
    name: str
    location: dict[str, Any]
    max_capacity: int
    ref_store: str

    @staticmethod
    def from_dict(payload: dict[str, Any]) -> "Shelf":
        return Shelf(
            id=payload["id"],
            type=payload.get("type", "Shelf"),
            name=payload["name"],
            location=payload.get("location", {}),
            max_capacity=payload["maxCapacity"],
            ref_store=payload["refStore"],
        )


@dataclass(slots=True)
class Product:
    id: str
    type: str
    name: str
    price: int
    size: str
    image: str

    @staticmethod
    def from_dict(payload: dict[str, Any]) -> "Product":
        return Product(
            id=payload["id"],
            type=payload.get("type", "Product"),
            name=payload["name"],
            price=payload["price"],
            size=payload["size"],
            image=payload.get("image", ""),
        )


@dataclass(slots=True)
class InventoryItem:
    id: str
    type: str
    ref_product: str
    ref_store: str
    ref_shelf: str
    stock_count: int
    shelf_count: int

    @staticmethod
    def from_dict(payload: dict[str, Any]) -> "InventoryItem":
        return InventoryItem(
            id=payload["id"],
            type=payload.get("type", "InventoryItem"),
            ref_product=payload["refProduct"],
            ref_store=payload["refStore"],
            ref_shelf=payload["refShelf"],
            stock_count=payload["stockCount"],
            shelf_count=payload["shelfCount"],
        )
