from pathlib import Path

from flask import Blueprint, abort, current_app, render_template

from app.services.repository import DataRepository

bp = Blueprint("main", __name__)


def get_repository() -> DataRepository:
    repository = current_app.extensions.get("repository")
    seed_path = current_app.config["SEED_PATH"]
    seed_mtime = None
    try:
        seed_mtime = Path(seed_path).stat().st_mtime
    except OSError:
        seed_mtime = None

    cached_mtime = current_app.extensions.get("repository_seed_mtime")

    if repository is None or cached_mtime != seed_mtime:
        repository = DataRepository(current_app.config["SEED_PATH"])
        current_app.extensions["repository"] = repository
        current_app.extensions["repository_seed_mtime"] = seed_mtime
    return repository


@bp.route("/")
def index():
    repository = get_repository()
    return render_template(
        "index.html",
        stores=repository.list_stores(),
        products=repository.list_products(),
        warnings=repository.get_warnings(),
    )


@bp.route("/stores/<path:store_id>")
def store_detail(store_id: str):
    repository = get_repository()
    store = repository.get_store(store_id)
    if store is None:
        abort(404)

    return render_template(
        "store_detail.html",
        store=store,
        shelves=repository.list_shelves_by_store(store_id),
        inventory=repository.list_inventory_by_store(store_id),
        warnings=repository.get_warnings(),
    )


@bp.route("/products/<path:product_id>")
def product_detail(product_id: str):
    repository = get_repository()
    product = repository.get_product(product_id)
    if product is None:
        abort(404)

    return render_template(
        "product_detail.html",
        product=product,
        inventory=repository.list_inventory_by_product(product_id),
        warnings=repository.get_warnings(),
    )


@bp.route("/inventory")
def inventory_global():
    repository = get_repository()
    return render_template(
        "inventory.html",
        inventory=repository.list_inventory_global(),
        warnings=repository.get_warnings(),
    )
