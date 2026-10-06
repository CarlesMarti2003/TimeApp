# ==========================================
# 1. CONFIGURACIÓN Y DEPENDENCIAS
# ==========================================
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app) # Permite que el frontend en Vercel se comunique con esta API

# ==========================================
# 2. CONEXIÓN A BASE DE DATOS
# ==========================================
def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

# ==========================================
# 3. SISTEMA DE LOGIN Y REGISTRO
# ==========================================
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'Faltan datos de inicio de sesión'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Buscamos si el usuario ya existe en la base de datos
    user = cursor.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()

    if user:
        # Si existe, comprobamos que la contraseña coincide
        if user['password'] != password:
            conn.close()
            return jsonify({'error': 'Contraseña incorrecta'}), 401
    else:
        # Si no existe, creamos la cuenta nueva con Nivel 1 y 0 XP
        cursor.execute('''
            INSERT INTO users (username, email, password, level, xp_points) 
            VALUES (?, ?, ?, 1, 0)
        ''', (username, email, password))
        conn.commit()

    conn.close()
    return jsonify({'mensaje': 'Login exitoso', 'username': username}), 200

# ==========================================
# 4. RUTAS DE EVENTOS (TAREAS)
# ==========================================

# Obtener eventos pendientes
@app.route('/events', methods=['GET'])
def get_events():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Se requiere un nombre de usuario'}), 400

    conn = get_db_connection()
    # Obtenemos el ID del usuario validado
    user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    # Filtramos las tareas pendientes exclusivas de este usuario
    events = conn.execute('SELECT * FROM events WHERE status = "pending" AND user_id = ?', (user['id'],)).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in events])

# Crear un evento nuevo
@app.route('/events', methods=['POST'])
def add_event():
    data = request.get_json()
    username = data.get('username')
    titulo = data.get('title')
    xp = data.get('xp_reward')
    fecha = data.get('date') 
    
    if not username or not titulo or not xp or not fecha:
        return jsonify({'error': 'Faltan datos'}), 400

    conn = get_db_connection()
    # Obtenemos el ID real del usuario para asociarle la tarea
    user = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()
    
    if not user:
        conn.close()
        return jsonify({'error': 'Usuario no encontrado'}), 404
    
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (title, xp_reward, start_time, status, user_id) 
        VALUES (?, ?, ?, 'pending', ?)
    ''', (titulo, xp, fecha, user['id']))
    
    conn.commit()
    conn.close()
    
    return jsonify({'mensaje': 'Evento creado correctamente'}), 201

# Completar un evento (Lógica de gamificación y XP)
@app.route('/events/<int:event_id>/complete', methods=['POST'])
def complete_event(event_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    evento = cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,)).fetchone()
    
    if not evento or evento['status'] == 'completed':
        conn.close()
        return jsonify({'error': 'Evento no válido o ya completado'}), 400

    user_id = evento['user_id']
    xp_ganada = evento['xp_reward']

    # Marcar completado y sumar XP
    cursor.execute('UPDATE events SET status = "completed" WHERE id = ?', (event_id,))
    cursor.execute('UPDATE users SET xp_points = xp_points + ? WHERE id = ?', (xp_ganada, user_id))
    
    # Comprobar si sube de nivel (Cada 100 XP = 1 Nivel)
    usuario = cursor.execute('SELECT xp_points, level FROM users WHERE id = ?', (user_id,)).fetchone()
    nuevo_nivel = (usuario['xp_points'] // 100) + 1
    
    sube_de_nivel = False
    if nuevo_nivel > usuario['level']:
        cursor.execute('UPDATE users SET level = ? WHERE id = ?', (nuevo_nivel, user_id))
        sube_de_nivel = True

    conn.commit()
    conn.close()

    return jsonify({
        'mensaje': '¡Evento completado!',
        'xp_ganada': xp_ganada,
        'xp_total': usuario['xp_points'],
        'sube_de_nivel': sube_de_nivel,
        'nivel_actual': nuevo_nivel
    })

# ==========================================
# 5. RUTAS DE PERFIL DE USUARIO
# ==========================================

# Obtener el perfil del usuario (para ver su Nivel y XP)
@app.route('/user', methods=['GET'])
def get_user():
    username = request.args.get('username')
    if not username:
        return jsonify({'error': 'Se requiere un nombre de usuario'}), 400
        
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 404
        
    return jsonify(dict(user))

# ==========================================
# 6. EJECUCIÓN DEL SERVIDOR LOCAL
# ==========================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)