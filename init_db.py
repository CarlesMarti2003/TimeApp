import sqlite3

# Crea o conecta al archivo de la base de datos
conexion = sqlite3.connect('database.db')
cursor = conexion.cursor()

# 1. Crear las tablas (Usuarios, Eventos, Recompensas)
cursor.executescript('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        xp_points INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        start_time TEXT,
        end_time TEXT,
        status TEXT DEFAULT 'pending',
        xp_reward INTEGER,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rewards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        cost_xp INTEGER,
        is_redeemed BOOLEAN DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
''')

# 2. Insertar datos de prueba
cursor.execute("INSERT INTO users (name, xp_points, level) VALUES ('Carles', 0, 1)")

# Eventos para sumar XP
cursor.execute("INSERT INTO events (user_id, title, status, xp_reward) VALUES (1, 'Partido de fútbol sala', 'pending', 50)")
cursor.execute("INSERT INTO events (user_id, title, status, xp_reward) VALUES (1, 'Cocinar cena para los compañeros de piso', 'pending', 40)")
cursor.execute("INSERT INTO events (user_id, title, status, xp_reward) VALUES (1, 'Terminar práctica de Ingeniería Informática UJI', 'pending', 100)")

# Recompensas para canjear
cursor.execute("INSERT INTO rewards (user_id, title, cost_xp) VALUES (1, 'Jugar 1h al EA FC 26 modo mánager', 120)")
cursor.execute("INSERT INTO rewards (user_id, title, cost_xp) VALUES (1, 'Ver un capítulo de The Walking Dead', 80)")

conexion.commit()
conexion.close()

print("Base de datos y datos de prueba inicializados correctamente.")