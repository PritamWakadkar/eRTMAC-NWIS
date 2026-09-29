import os
import psycopg

# Optional: load a local .env file when running on your own computer.
# On Render this is not needed (environment variables are set in the dashboard).
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    # On Render: use the DATABASE_URL environment variable
    if database_url:
        return psycopg.connect(database_url)

    # On your computer: use the local database
    return psycopg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME", "ertmac_nwis"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
    )