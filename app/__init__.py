from pathlib import Path

from flask import Flask


def create_app() -> Flask:
    app = Flask(__name__)

    root_path = Path(__file__).resolve().parent.parent
    app.config["SEED_PATH"] = str(root_path / "data" / "seed.json")

    @app.template_filter("currency")
    def currency_filter(value: int) -> str:
        return f"€{value / 100:.2f}"

    from .routes import bp

    app.register_blueprint(bp)
    return app
