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
# 3. RUTAS DE EVENTOS (TAREAS)
# ==========================================

# Obtener eventos pendientes
@app.route('/events', methods=['GET'])
def get_events():
    conn = get_db_connection()
    events = conn.execute('SELECT * FROM events WHERE status = "pending"').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in events])

# Crear un evento nuevo
@app.route('/events', methods=['POST'])
def add_event():
    # Recibimos los datos que envía el frontend
    data = request.get_json()
    titulo = data.get('title')
    xp = data.get('xp_reward')
    fecha = data.get('date') # Recibimos la fecha elegida en el calendario
    
    # El status por defecto será 'pending' y el usuario será el ID 1
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (title, xp_reward, start_time, status, user_id) 
        VALUES (?, ?, ?, 'pending', 1)
    ''', (titulo, xp, fecha))
    
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
# 4. RUTAS DE PERFIL DE USUARIO
# ==========================================

# Obtener el perfil del usuario (para ver su Nivel y XP)
@app.route('/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return jsonify(dict(user))

# ==========================================
# 5. EJECUCIÓN DEL SERVIDOR LOCAL
# ==========================================
if __name__ == '__main__':
    app.run(debug=True, port=5000)