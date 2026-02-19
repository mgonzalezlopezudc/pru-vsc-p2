import os
import re
import time
from urllib.parse import quote, unquote

import requests


BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:5000")
TIMEOUT = 20


class E2EError(RuntimeError):
    pass


class CrudE2E:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path}"

    def _get(self, path: str, **kwargs):
        response = self.session.get(self._url(path), timeout=TIMEOUT, **kwargs)
        return response

    def _post(self, path: str, data: dict[str, str], **kwargs):
        response = self.session.post(self._url(path), data=data, timeout=TIMEOUT, **kwargs)
        return response

    @staticmethod
    def _token(html: str, field_name: str) -> str:
        match = re.search(rf'name="{re.escape(field_name)}"[^>]*value="([^"]+)"', html)
        if not match:
            raise E2EError(f"No token found for {field_name}")
        return match.group(1)

    @staticmethod
    def _safe_id(value: str) -> str:
        return value.replace(":", "_").replace("-", "_")

    def run_store_crud(self) -> None:
        unique = int(time.time())
        name = f"Store E2E {unique}"

        home = self._get("/")
        home.raise_for_status()
        create_token = self._token(home.text, "store_create-csrf_token")

        create_payload = {
            "store_create-csrf_token": create_token,
            "store_create-name": name,
            "store_create-address": "E2E Street 1, Berlin",
            "store_create-image": "https://example.com/store-e2e.jpg",
            "store_create-latitude": "52.5201",
            "store_create-longitude": "13.4051",
        }
        created = self._post("/stores/create", create_payload, allow_redirects=True)
        created.raise_for_status()
        if "/stores/" not in created.url:
            raise E2EError(f"Store create did not redirect to detail: {created.url}")

        store_id = unquote(created.url.split("/stores/", 1)[1].split("?", 1)[0])
        print(f"STORE CREATED: {store_id}")

        encoded = quote(store_id, safe="")
        detail = self._get(f"/stores/{encoded}")
        detail.raise_for_status()
        safe_id = self._safe_id(store_id)
        update_token = self._token(detail.text, f"store_edit_{safe_id}-csrf_token")
        delete_token = self._token(detail.text, "delete_shared-csrf_token")

        updated_name = f"{name} Updated"
        update_payload = {
            f"store_edit_{safe_id}-csrf_token": update_token,
            f"store_edit_{safe_id}-name": updated_name,
            f"store_edit_{safe_id}-address": "E2E Street 2, Berlin",
            f"store_edit_{safe_id}-image": "https://example.com/store-e2e-updated.jpg",
            f"store_edit_{safe_id}-latitude": "52.5202",
            f"store_edit_{safe_id}-longitude": "13.4052",
        }
        updated = self._post(f"/stores/{encoded}/update", update_payload, allow_redirects=True)
        updated.raise_for_status()
        if updated_name not in updated.text:
            raise E2EError("Updated store name was not rendered")
        print("STORE UPDATED: ok")

        deleted = self._post(
            f"/stores/{encoded}/delete",
            {"delete_shared-csrf_token": delete_token},
            allow_redirects=True,
        )
        deleted.raise_for_status()
        if "/stores/" in deleted.url:
            raise E2EError(f"Store delete did not return to index: {deleted.url}")

        verify = self._get(f"/stores/{encoded}", allow_redirects=False)
        if verify.status_code != 404:
            raise E2EError(f"Expected 404 after store delete, got {verify.status_code}")
        print("STORE DELETED: ok")

    def run_product_crud(self) -> None:
        unique = int(time.time())
        name = f"Product E2E {unique}"

        home = self._get("/")
        home.raise_for_status()
        create_token = self._token(home.text, "product_create-csrf_token")

        create_payload = {
            "product_create-csrf_token": create_token,
            "product_create-name": name,
            "product_create-size": "XL",
            "product_create-price": "1234",
            "product_create-image": "https://example.com/product-e2e.jpg",
        }
        created = self._post("/products/create", create_payload, allow_redirects=True)
        created.raise_for_status()
        if "/products/" not in created.url:
            raise E2EError(f"Product create did not redirect to detail: {created.url}")

        product_id = unquote(created.url.split("/products/", 1)[1].split("?", 1)[0])
        print(f"PRODUCT CREATED: {product_id}")

        encoded = quote(product_id, safe="")
        detail = self._get(f"/products/{encoded}")
        detail.raise_for_status()
        safe_id = self._safe_id(product_id)
        update_token = self._token(detail.text, f"product_edit_{safe_id}-csrf_token")
        delete_token = self._token(detail.text, "delete_shared-csrf_token")

        updated_name = f"{name} Updated"
        update_payload = {
            f"product_edit_{safe_id}-csrf_token": update_token,
            f"product_edit_{safe_id}-name": updated_name,
            f"product_edit_{safe_id}-size": "L",
            f"product_edit_{safe_id}-price": "2222",
            f"product_edit_{safe_id}-image": "https://example.com/product-e2e-updated.jpg",
        }
        updated = self._post(f"/products/{encoded}/update", update_payload, allow_redirects=True)
        updated.raise_for_status()
        if updated_name not in updated.text:
            raise E2EError("Updated product name was not rendered")
        print("PRODUCT UPDATED: ok")

        deleted = self._post(
            f"/products/{encoded}/delete",
            {"delete_shared-csrf_token": delete_token},
            allow_redirects=True,
        )
        deleted.raise_for_status()
        if "/products/" in deleted.url:
            raise E2EError(f"Product delete did not return to index: {deleted.url}")

        verify = self._get(f"/products/{encoded}", allow_redirects=False)
        if verify.status_code != 404:
            raise E2EError(f"Expected 404 after product delete, got {verify.status_code}")
        print("PRODUCT DELETED: ok")


if __name__ == "__main__":
    runner = CrudE2E(BASE_URL)
    runner.run_store_crud()
    runner.run_product_crud()
    print("E2E_CRUD_REQUESTS_OK")
