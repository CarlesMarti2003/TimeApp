import sqlite3

conexion = sqlite3.connect('database.db')
cursor = conexion.cursor()

cursor.executescript('''
    DROP TABLE IF EXISTS rewards;
    DROP TABLE IF EXISTS events;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        xp_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1
    );

    CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        start_time TEXT,
        end_time TEXT,
        status TEXT DEFAULT 'pending',
        xp_reward INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        cost_xp INTEGER,
        is_redeemed BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
''')

conexion.commit()
conexion.close()
print("Base de datos configurada para login completo.")