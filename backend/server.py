import os
from datetime import datetime

from flask import Flask, jsonify, render_template, request

from .database import add_contact, get_visitors, increment_visitors, init_db, list_contacts


def create_app() -> Flask:
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="static",
        static_url_path="/static",
    )

    init_db()

    @app.get("/")
    def index():
        return render_template("index.html")

    @app.get("/admin")
    def admin():
        contacts = list_contacts()
        visitors = get_visitors()
        return render_template("admin.html", contacts=contacts, visitors=visitors)

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True, "time": datetime.utcnow().isoformat() + "Z"})

    @app.post("/api/contact")
    def api_contact():
        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        message = (data.get("message") or "").strip()

        if not name or not email or not message:
            return jsonify({"ok": False, "error": "name, email, message are required"}), 400

        # basic email validation
        if "@" not in email or "." not in email.split("@")[-1]:
            return jsonify({"ok": False, "error": "invalid email"}), 400

        c = add_contact(name=name, email=email, message=message)
        return (
            jsonify(
                {
                    "ok": True,
                    "contact": {
                        "id": c["id"],
                        "name": c["name"],
                        "email": c["email"],
                        "message": c["message"],
                        "created_at": str(c["created_at"]),
                    },
                }
            ),
            201,
        )

    @app.get("/api/contacts")
    def api_contacts():
        rows = list_contacts()
        return jsonify(
            {
                "ok": True,
                "contacts": [
                    {
                        "id": r["id"],
                        "name": r["name"],
                        "email": r["email"],
                        "message": r["message"],
                        "created_at": str(r["created_at"]) if r.get("created_at") else None,
                    }
                    for r in rows
                ],
            }
        )

    @app.post("/api/visit")
    def api_visit():
        count = increment_visitors()
        return jsonify({"ok": True, "visitors": count})

    @app.get("/api/visitors")
    def api_visitors():
        return jsonify({"ok": True, "visitors": get_visitors()})

    return app


app = create_app()


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)

