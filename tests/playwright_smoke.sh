#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_BIN="${PYTHON_BIN:-$ROOT_DIR/.venv/bin/python}"
BASE_URL="${BASE_URL:-http://127.0.0.1:5000}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5000}"

if [[ ! -x "$PYTHON_BIN" ]]; then
  echo "No se encontró intérprete Python ejecutable en: $PYTHON_BIN"
  exit 1
fi

pw() {
  if command -v playwright-cli >/dev/null 2>&1; then
    playwright-cli "$@"
  else
    npx -y playwright-cli "$@"
  fi
}

current_path() {
  pw eval "location.pathname" | grep -E '^"/' | tail -n 1 | tr -d '"'
}

cleanup() {
  pw close-all >/dev/null 2>&1 || true
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "$ROOT_DIR"

FLASK_APP=app "$PYTHON_BIN" -m flask run --host "$HOST" --port "$PORT" >/tmp/playwright-smoke-flask.log 2>&1 &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -fsS "$BASE_URL/" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl -fsS "$BASE_URL/" >/dev/null 2>&1; then
  echo "La app no respondió en $BASE_URL"
  exit 1
fi

STORE_ID="$($PYTHON_BIN -c "import json; print(json.load(open('data/seed.json', encoding='utf-8'))['stores'][0]['id'])")"
PRODUCT_ID="$($PYTHON_BIN -c "import json; print(json.load(open('data/seed.json', encoding='utf-8'))['products'][0]['id'])")"

pw open "$BASE_URL/" >/dev/null
[[ "$(current_path)" == "/" ]]

pw goto "$BASE_URL/inventory" >/dev/null
[[ "$(current_path)" == "/inventory" ]]

pw goto "$BASE_URL/stores/$STORE_ID" >/dev/null
[[ "$(current_path)" == "/stores/$STORE_ID" ]]

pw goto "$BASE_URL/products/$PRODUCT_ID" >/dev/null
[[ "$(current_path)" == "/products/$PRODUCT_ID" ]]

echo "Playwright smoke navigation OK"
