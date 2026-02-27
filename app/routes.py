from pathlib import Path

from flask import Blueprint, abort, current_app, flash, g, redirect, render_template, request, url_for

from app.forms import DeleteForm, InventoryItemCreateForm, InventoryItemForm, ProductForm, ShelfForm, StoreForm
from app.services.i18n import DEFAULT_LANGUAGE, translate
from app.services.repository import DataRepository
from app.services.repository import DataValidationError

bp = Blueprint("main", __name__)


def _safe_prefix(value: str) -> str:
    return value.replace(":", "_").replace("-", "_")


def _t(key: str, **kwargs: str) -> str:
    return translate(g.get("current_lang", DEFAULT_LANGUAGE), key, **kwargs)


def _collect_form_errors(
    form: ShelfForm | InventoryItemForm | InventoryItemCreateForm | DeleteForm | StoreForm | ProductForm,
) -> list[str]:
    messages: list[str] = []
    for field, field_errors in form.errors.items():
        field_label = _t(f"field.{field}")
        for error in field_errors:
            error_message = _t(error) if error.startswith("error.") else error
            messages.append(f"{field_label}: {error_message}")
    return messages


def _flash_messages(messages: list[str], category: str = "error") -> None:
    for message in messages:
        flash(message, category)


def _parse_coordinate(raw_value: str, label_key: str) -> tuple[float | None, str | None]:
    try:
        value = float(raw_value)
    except (TypeError, ValueError):
        return None, _t("error.invalid_coordinate", field=_t(label_key))
    return value, None


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
    stores = repository.list_stores()
    store_map_points = [
        {
            "id": store.id,
            "name": store.name,
            "address": store.address,
            "location": store.location,
            "detail_url": url_for("main.store_detail", store_id=store.id, lang=g.current_lang),
        }
        for store in stores
    ]
    store_create_form = StoreForm(prefix="store_create")
    product_create_form = ProductForm(prefix="product_create")
    delete_form = DeleteForm(prefix="delete_shared")
    return render_template(
        "index.html",
        stores=stores,
        store_map_points=store_map_points,
        products=repository.list_products(),
        store_create_form=store_create_form,
        product_create_form=product_create_form,
        delete_form=delete_form,
        warnings=repository.get_warnings(),
    )


@bp.route("/stores/<path:store_id>")
def store_detail(store_id: str):
    repository = get_repository()
    store = repository.get_store(store_id)
    if store is None:
        abort(404)

    edit_shelf_id = request.args.get("edit_shelf_id")
    edit_item_id = request.args.get("edit_item_id")

    selected_shelf = repository.get_shelf(edit_shelf_id) if edit_shelf_id else None
    if selected_shelf and selected_shelf.ref_store != store_id:
        selected_shelf = None

    selected_item = repository.get_inventory_item(edit_item_id) if edit_item_id else None
    if selected_item and selected_item.ref_store != store_id:
        selected_item = None

    shelf_create_form = ShelfForm(prefix="shelf_create")
    inventory_create_form = InventoryItemCreateForm(prefix="inv_create")
    delete_form = DeleteForm(prefix="delete_shared")
    store_edit_form = StoreForm(
        prefix=f"store_edit_{_safe_prefix(store.id)}",
        data={
            "name": store.name,
            "address": store.address,
            "image": store.image,
            "latitude": store.location.get("coordinates", [None, None])[1],
            "longitude": store.location.get("coordinates", [None, None])[0],
        },
    )

    shelf_edit_form = None
    if selected_shelf:
        shelf_edit_form = ShelfForm(
            prefix=f"shelf_edit_{_safe_prefix(selected_shelf.id)}",
            data={
                "name": selected_shelf.name,
                "max_capacity": selected_shelf.max_capacity,
            },
        )

    inventory_edit_form = None
    if selected_item:
        inventory_edit_form = InventoryItemForm(
            prefix=f"inv_edit_{_safe_prefix(selected_item.id)}",
            data={
                "stock_count": selected_item.stock_count,
                "shelf_count": selected_item.shelf_count,
            },
        )

    return render_template(
        "store_detail.html",
        store=store,
        shelves=repository.list_shelves_by_store(store_id),
        inventory=repository.list_inventory_by_store(store_id),
        products=repository.list_products(),
        edit_shelf_id=edit_shelf_id,
        edit_item_id=edit_item_id,
        selected_shelf=selected_shelf,
        selected_item=selected_item,
        shelf_create_form=shelf_create_form,
        inventory_create_form=inventory_create_form,
        shelf_edit_form=shelf_edit_form,
        inventory_edit_form=inventory_edit_form,
        store_edit_form=store_edit_form,
        delete_form=delete_form,
        warnings=repository.get_warnings(),
    )


@bp.route("/products/<path:product_id>")
def product_detail(product_id: str):
    repository = get_repository()
    product = repository.get_product(product_id)
    if product is None:
        abort(404)

    edit_item_id = request.args.get("edit_item_id")
    selected_item = repository.get_inventory_item(edit_item_id) if edit_item_id else None
    if selected_item and selected_item.ref_product != product_id:
        selected_item = None

    inventory_create_form = InventoryItemCreateForm(
        prefix="prod_inv_create",
        data={"product_id": product_id},
    )
    delete_form = DeleteForm(prefix="delete_shared")
    product_edit_form = ProductForm(
        prefix=f"product_edit_{_safe_prefix(product.id)}",
        data={
            "name": product.name,
            "size": product.size,
            "price": product.price,
            "image": product.image,
        },
    )

    inventory_edit_form = None
    if selected_item:
        inventory_edit_form = InventoryItemForm(
            prefix=f"prod_inv_edit_{_safe_prefix(selected_item.id)}",
            data={
                "stock_count": selected_item.stock_count,
                "shelf_count": selected_item.shelf_count,
            },
        )

    return render_template(
        "product_detail.html",
        product=product,
        inventory=repository.list_inventory_by_product(product_id),
        stores=repository.list_stores(),
        shelves=repository.list_shelves(),
        selected_item=selected_item,
        edit_item_id=edit_item_id,
        inventory_create_form=inventory_create_form,
        inventory_edit_form=inventory_edit_form,
        product_edit_form=product_edit_form,
        delete_form=delete_form,
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


@bp.route("/stores/create", methods=["POST"])
def create_store():
    repository = get_repository()
    form = StoreForm(prefix="store_create")
    if form.validate_on_submit():
        lat, lat_error = _parse_coordinate(form.latitude.data, "field.latitude")
        lon, lon_error = _parse_coordinate(form.longitude.data, "field.longitude")
        errors = [error for error in [lat_error, lon_error] if error]
        if errors:
            _flash_messages(errors)
        else:
            try:
                store_id = repository.create_store(
                    name=form.name.data.strip(),
                    address=form.address.data.strip(),
                    image=form.image.data.strip(),
                    latitude=lat,
                    longitude=lon,
                )
                flash(_t("flash.store_created"), "success")
                return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))
            except DataValidationError as exc:
                _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.index", lang=g.current_lang))


@bp.route("/stores/<path:store_id>/update", methods=["POST"])
def update_store(store_id: str):
    repository = get_repository()
    if repository.get_store(store_id) is None:
        abort(404)

    form = StoreForm(prefix=f"store_edit_{_safe_prefix(store_id)}")
    if form.validate_on_submit():
        lat, lat_error = _parse_coordinate(form.latitude.data, "field.latitude")
        lon, lon_error = _parse_coordinate(form.longitude.data, "field.longitude")
        errors = [error for error in [lat_error, lon_error] if error]
        if errors:
            _flash_messages(errors)
        else:
            try:
                repository.update_store(
                    store_id=store_id,
                    name=form.name.data.strip(),
                    address=form.address.data.strip(),
                    image=form.image.data.strip(),
                    latitude=lat,
                    longitude=lon,
                )
                flash(_t("flash.store_updated"), "success")
            except DataValidationError as exc:
                _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))


@bp.route("/stores/<path:store_id>/delete", methods=["POST"])
def delete_store(store_id: str):
    repository = get_repository()
    if repository.get_store(store_id) is None:
        abort(404)

    form = DeleteForm(prefix="delete_shared")
    if form.validate_on_submit():
        try:
            repository.delete_store(store_id)
            flash(_t("flash.store_deleted"), "success")
            return redirect(url_for("main.index", lang=g.current_lang))
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))


@bp.route("/products/create", methods=["POST"])
def create_product():
    repository = get_repository()
    form = ProductForm(prefix="product_create")
    if form.validate_on_submit():
        try:
            product_id = repository.create_product(
                name=form.name.data.strip(),
                size=form.size.data.strip(),
                price=form.price.data,
                image=form.image.data.strip(),
            )
            flash(_t("flash.product_created"), "success")
            return redirect(url_for("main.product_detail", product_id=product_id, lang=g.current_lang))
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.index", lang=g.current_lang))


@bp.route("/products/<path:product_id>/update", methods=["POST"])
def update_product(product_id: str):
    repository = get_repository()
    if repository.get_product(product_id) is None:
        abort(404)

    form = ProductForm(prefix=f"product_edit_{_safe_prefix(product_id)}")
    if form.validate_on_submit():
        try:
            repository.update_product(
                product_id=product_id,
                name=form.name.data.strip(),
                size=form.size.data.strip(),
                price=form.price.data,
                image=form.image.data.strip(),
            )
            flash(_t("flash.product_updated"), "success")
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.product_detail", product_id=product_id, lang=g.current_lang))


@bp.route("/products/<path:product_id>/delete", methods=["POST"])
def delete_product(product_id: str):
    repository = get_repository()
    if repository.get_product(product_id) is None:
        abort(404)

    form = DeleteForm(prefix="delete_shared")
    if form.validate_on_submit():
        try:
            repository.delete_product(product_id)
            flash(_t("flash.product_deleted"), "success")
            return redirect(url_for("main.index", lang=g.current_lang))
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.product_detail", product_id=product_id, lang=g.current_lang))


@bp.route("/stores/<path:store_id>/shelves/create", methods=["POST"])
def create_shelf(store_id: str):
    repository = get_repository()
    if repository.get_store(store_id) is None:
        abort(404)

    form = ShelfForm(prefix="shelf_create")
    if form.validate_on_submit():
        try:
            repository.create_shelf(
                store_id=store_id,
                name=form.name.data.strip(),
                max_capacity=form.max_capacity.data,
            )
            flash(_t("flash.shelf_created"), "success")
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))


@bp.route("/stores/<path:store_id>/shelves/<path:shelf_id>/update", methods=["POST"])
def update_shelf(store_id: str, shelf_id: str):
    repository = get_repository()
    store = repository.get_store(store_id)
    shelf = repository.get_shelf(shelf_id)
    if store is None or shelf is None or shelf.ref_store != store_id:
        abort(404)

    form = ShelfForm(prefix=f"shelf_edit_{_safe_prefix(shelf_id)}")
    redirect_args = {
        "store_id": store_id,
        "lang": g.current_lang,
        "edit_shelf_id": shelf_id,
    }

    if form.validate_on_submit():
        try:
            repository.update_shelf(
                shelf_id=shelf_id,
                name=form.name.data.strip(),
                max_capacity=form.max_capacity.data,
            )
            flash(_t("flash.shelf_updated"), "success")
            redirect_args.pop("edit_shelf_id", None)
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", **redirect_args))


@bp.route("/stores/<path:store_id>/shelves/<path:shelf_id>/delete", methods=["POST"])
def delete_shelf(store_id: str, shelf_id: str):
    repository = get_repository()
    store = repository.get_store(store_id)
    shelf = repository.get_shelf(shelf_id)
    if store is None or shelf is None or shelf.ref_store != store_id:
        abort(404)

    form = DeleteForm(prefix="delete_shared")
    if form.validate_on_submit():
        try:
            repository.delete_shelf(shelf_id)
            flash(_t("flash.shelf_deleted"), "success")
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))


@bp.route("/stores/<path:store_id>/inventory/create", methods=["POST"])
def create_store_inventory_item(store_id: str):
    repository = get_repository()
    if repository.get_store(store_id) is None:
        abort(404)

    form = InventoryItemCreateForm(prefix="inv_create")
    if form.validate_on_submit():
        if form.store_id.data != store_id:
            _flash_messages([_t("error.invalid_store_ref")])
        elif (shelf := repository.get_shelf(form.shelf_id.data)) is None or shelf.ref_store != store_id:
            _flash_messages([_t("error.invalid_shelf_ref")])
        else:
            try:
                repository.create_inventory_item(
                    store_id=form.store_id.data,
                    shelf_id=form.shelf_id.data,
                    product_id=form.product_id.data,
                    stock_count=form.stock_count.data,
                    shelf_count=form.shelf_count.data,
                )
                flash(_t("flash.inventory_created"), "success")
            except DataValidationError as exc:
                _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))


@bp.route("/stores/<path:store_id>/inventory/<path:item_id>/update", methods=["POST"])
def update_store_inventory_item(store_id: str, item_id: str):
    repository = get_repository()
    if repository.get_store(store_id) is None:
        abort(404)
    item = repository.get_inventory_item(item_id)
    if item is None or item.ref_store != store_id:
        abort(404)

    form = InventoryItemForm(prefix=f"inv_edit_{_safe_prefix(item_id)}")
    redirect_args = {
        "store_id": store_id,
        "lang": g.current_lang,
        "edit_item_id": item_id,
    }
    if form.validate_on_submit():
        try:
            repository.update_inventory_item(
                item_id=item_id,
                stock_count=form.stock_count.data,
                shelf_count=form.shelf_count.data,
            )
            flash(_t("flash.inventory_updated"), "success")
            redirect_args.pop("edit_item_id", None)
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", **redirect_args))


@bp.route("/stores/<path:store_id>/inventory/<path:item_id>/delete", methods=["POST"])
def delete_store_inventory_item(store_id: str, item_id: str):
    repository = get_repository()
    if repository.get_store(store_id) is None:
        abort(404)
    item = repository.get_inventory_item(item_id)
    if item is None or item.ref_store != store_id:
        abort(404)

    form = DeleteForm(prefix="delete_shared")
    if form.validate_on_submit():
        try:
            repository.delete_inventory_item(item_id)
            flash(_t("flash.inventory_deleted"), "success")
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.store_detail", store_id=store_id, lang=g.current_lang))


@bp.route("/products/<path:product_id>/inventory/create", methods=["POST"])
def create_product_inventory_item(product_id: str):
    repository = get_repository()
    if repository.get_product(product_id) is None:
        abort(404)

    form = InventoryItemCreateForm(prefix="prod_inv_create")
    if form.validate_on_submit():
        if form.product_id.data != product_id:
            _flash_messages([_t("error.invalid_product_ref")])
        elif (shelf := repository.get_shelf(form.shelf_id.data)) is None or shelf.ref_store != form.store_id.data:
            _flash_messages([_t("error.invalid_shelf_ref")])
        else:
            try:
                repository.create_inventory_item(
                    store_id=form.store_id.data,
                    shelf_id=form.shelf_id.data,
                    product_id=form.product_id.data,
                    stock_count=form.stock_count.data,
                    shelf_count=form.shelf_count.data,
                )
                flash(_t("flash.inventory_created"), "success")
            except DataValidationError as exc:
                _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.product_detail", product_id=product_id, lang=g.current_lang))


@bp.route("/products/<path:product_id>/inventory/<path:item_id>/update", methods=["POST"])
def update_product_inventory_item(product_id: str, item_id: str):
    repository = get_repository()
    if repository.get_product(product_id) is None:
        abort(404)
    item = repository.get_inventory_item(item_id)
    if item is None or item.ref_product != product_id:
        abort(404)

    form = InventoryItemForm(prefix=f"prod_inv_edit_{_safe_prefix(item_id)}")
    redirect_args = {
        "product_id": product_id,
        "lang": g.current_lang,
        "edit_item_id": item_id,
    }

    if form.validate_on_submit():
        try:
            repository.update_inventory_item(
                item_id=item_id,
                stock_count=form.stock_count.data,
                shelf_count=form.shelf_count.data,
            )
            flash(_t("flash.inventory_updated"), "success")
            redirect_args.pop("edit_item_id", None)
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.product_detail", **redirect_args))


@bp.route("/products/<path:product_id>/inventory/<path:item_id>/delete", methods=["POST"])
def delete_product_inventory_item(product_id: str, item_id: str):
    repository = get_repository()
    if repository.get_product(product_id) is None:
        abort(404)
    item = repository.get_inventory_item(item_id)
    if item is None or item.ref_product != product_id:
        abort(404)

    form = DeleteForm(prefix="delete_shared")
    if form.validate_on_submit():
        try:
            repository.delete_inventory_item(item_id)
            flash(_t("flash.inventory_deleted"), "success")
        except DataValidationError as exc:
            _flash_messages(exc.messages)
    else:
        _flash_messages(_collect_form_errors(form))

    return redirect(url_for("main.product_detail", product_id=product_id, lang=g.current_lang))
