from db import get_connection


def main():

    try:

        connection = get_connection()

        print("✅ PostgreSQL connection successful!")

        cursor = connection.cursor()

        cursor.execute("SELECT version();")

        result = cursor.fetchone()

        print(result[0])

        cursor.close()
        connection.close()

    except Exception as e:

        print("❌ Database connection failed:")
        print(e)


if __name__ == "__main__":
    main()