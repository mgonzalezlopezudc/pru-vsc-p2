from pathlib import Path

from flask import Flask, g, request, session, url_for
from flask_wtf.csrf import CSRFProtect

from .services.i18n import (
    DEFAULT_LANGUAGE,
    LANGUAGE_LABELS,
    SUPPORTED_LANGUAGES,
    normalize_language,
    translate,
)


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["SECRET_KEY"] = app.config.get("SECRET_KEY") or "dev"
    CSRFProtect(app)

    root_path = Path(__file__).resolve().parent.parent
    app.config["SEED_PATH"] = str(root_path / "data" / "seed.json")

    @app.template_filter("currency")
    def currency_filter(value: int) -> str:
        return f"€{value / 100:.2f}"

    @app.before_request
    def set_language() -> None:
        requested_language = normalize_language(request.args.get("lang"))
        if requested_language is not None:
            session["lang"] = requested_language
            g.current_lang = requested_language
            return

        session_language = normalize_language(session.get("lang"))
        g.current_lang = session_language or DEFAULT_LANGUAGE

    @app.context_processor
    def inject_i18n() -> dict[str, object]:
        def t(key: str, **kwargs: str) -> str:
            return translate(g.get("current_lang", DEFAULT_LANGUAGE), key, **kwargs)

        def localized_url(language: str) -> str:
            normalized = normalize_language(language) or DEFAULT_LANGUAGE
            if request.endpoint is None:
                return request.path

            route_values = dict(request.view_args or {})
            query_params = request.args.to_dict(flat=True)
            query_params["lang"] = normalized
            return url_for(request.endpoint, **route_values, **query_params)

        return {
            "t": t,
            "current_lang": g.get("current_lang", DEFAULT_LANGUAGE),
            "supported_languages": SUPPORTED_LANGUAGES,
            "language_labels": LANGUAGE_LABELS,
            "localized_url": localized_url,
        }

    from .routes import bp

    app.register_blueprint(bp)
    return app
