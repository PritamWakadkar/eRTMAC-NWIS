import psycopg


DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "dbname": "ertmac_nwis",
    "user": "postgres",
    "password": "Pritam@9579"
}


def get_connection():
    return psycopg.connect(**DB_CONFIG)