import os
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from urllib.parse import urlparse

import psycopg2
import psycopg2.extras


@dataclass
class ContactRow:
    id: int
    name: str
    email: str
    message: str
    created_at: str


def _sqlite_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(here, "portfolio.db")


def _is_postgres() -> bool:
    return bool(os.getenv("DATABASE_URL"))


def _pg_connect():
    # Neon provides a full postgres connection string. psycopg2 accepts it.
    return psycopg2.connect(os.getenv("DATABASE_URL"), cursor_factory=psycopg2.extras.RealDictCursor)


def _sqlite_connect():
    con = sqlite3.connect(_sqlite_path(), check_same_thread=False)
    con.row_factory = sqlite3.Row
    return con


def init_db():
    if _is_postgres():
        with _pg_connect() as con:
            with con.cursor() as cur:
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS contacts (
                      id SERIAL PRIMARY KEY,
                      name VARCHAR(200) NOT NULL,
                      email VARCHAR(320) NOT NULL,
                      message TEXT NOT NULL,
                      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                    );
                    """
                )
                cur.execute(
                    """
                    CREATE TABLE IF NOT EXISTS stats (
                      key VARCHAR(64) PRIMARY KEY,
                      value VARCHAR(255) NOT NULL
                    );
                    """
                )
                cur.execute(
                    """
                    INSERT INTO stats(key, value)
                    VALUES ('visitors', '0')
                    ON CONFLICT (key) DO NOTHING;
                    """
                )
            con.commit()
        return

    with _sqlite_connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS contacts (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              email TEXT NOT NULL,
              message TEXT NOT NULL,
              created_at TEXT NOT NULL
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS stats (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );
            """
        )
        cur.execute(
            """
            INSERT OR IGNORE INTO stats(key, value) VALUES ('visitors', '0');
            """
        )
        con.commit()


def add_contact(name: str, email: str, message: str):
    if _is_postgres():
        with _pg_connect() as con:
            with con.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO contacts(name, email, message)
                    VALUES (%s, %s, %s)
                    RETURNING id, name, email, message, created_at;
                    """,
                    (name, email, message),
                )
                row = cur.fetchone()
            con.commit()
        return row

    created_at = datetime.now(timezone.utc).isoformat()
    with _sqlite_connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            INSERT INTO contacts(name, email, message, created_at)
            VALUES (?, ?, ?, ?);
            """,
            (name, email, message, created_at),
        )
        cid = cur.lastrowid
        con.commit()
        return {"id": cid, "name": name, "email": email, "message": message, "created_at": created_at}


def list_contacts():
    if _is_postgres():
        with _pg_connect() as con:
            with con.cursor() as cur:
                cur.execute(
                    """
                    SELECT id, name, email, message, created_at
                    FROM contacts
                    ORDER BY created_at DESC;
                    """
                )
                rows = cur.fetchall()
        return rows

    with _sqlite_connect() as con:
        cur = con.cursor()
        cur.execute(
            """
            SELECT id, name, email, message, created_at
            FROM contacts
            ORDER BY created_at DESC;
            """
        )
        rows = cur.fetchall()
        return [dict(r) for r in rows]


def increment_visitors() -> int:
    if _is_postgres():
        with _pg_connect() as con:
            with con.cursor() as cur:
                cur.execute("SELECT value FROM stats WHERE key='visitors';")
                row = cur.fetchone()
                current = int(row["value"]) if row and str(row["value"]).isdigit() else 0
                current += 1
                cur.execute(
                    """
                    INSERT INTO stats(key, value) VALUES ('visitors', %s)
                    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
                    """,
                    (str(current),),
                )
            con.commit()
        return current

    with _sqlite_connect() as con:
        cur = con.cursor()
        cur.execute("SELECT value FROM stats WHERE key='visitors';")
        row = cur.fetchone()
        try:
            current = int(row["value"]) if row else 0
        except Exception:
            current = 0
        current += 1
        cur.execute(
            """
            INSERT INTO stats(key, value) VALUES ('visitors', ?)
            ON CONFLICT(key) DO UPDATE SET value=excluded.value;
            """,
            (str(current),),
        )
        con.commit()
        return current


def get_visitors() -> int:
    if _is_postgres():
        with _pg_connect() as con:
            with con.cursor() as cur:
                cur.execute("SELECT value FROM stats WHERE key='visitors';")
                row = cur.fetchone()
        try:
            return int(row["value"]) if row else 0
        except Exception:
            return 0

    with _sqlite_connect() as con:
        cur = con.cursor()
        cur.execute("SELECT value FROM stats WHERE key='visitors';")
        row = cur.fetchone()
        try:
            return int(row["value"]) if row else 0
        except Exception:
            return 0

