// Configuración base
const API_URL = 'https://CarlesMarti.pythonanywhere.com';
const USER_ID = 1; // Usamos el ID 1 que creamos en los datos de prueba

// Elementos de la interfaz (DOM)
const eventsList = document.getElementById('events-list');
const userLevelEl = document.getElementById('user-level');
const userXpEl = document.getElementById('user-xp');
const xpBarEl = document.getElementById('xp-bar');

// 1. Cargar estadísticas del usuario (Nivel y XP)
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/user/${USER_ID}`);
        const user = await response.json();
        
        // Actualizamos los textos en la cabecera
        userLevelEl.textContent = `Nivel ${user.level}`;
        userXpEl.textContent = `${user.xp_points} XP`;
        
        // Calculamos el progreso de la barra (ej. subes de nivel cada 100 XP)
        const xpInCurrentLevel = user.xp_points % 100;
        xpBarEl.style.width = `${xpInCurrentLevel}%`;
    } catch (error) {
        console.error('Error cargando el perfil:', error);
    }
}

// 2. Cargar las tareas pendientes desde la base de datos
async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();
        
        eventsList.innerHTML = ''; // Limpiamos el texto de "Cargando..."
        
        // Si no hay eventos, mostramos un mensaje
        if (events.length === 0) {
            eventsList.innerHTML = '<p class="loading-text">¡Todo completado por hoy!</p>';
            return;
        }

        // Generamos una tarjeta HTML por cada evento pendiente
        events.forEach(event => {
            const li = document.createElement('li');
            
            li.innerHTML = `
                <div class="task-info">
                    <p class="task-title">${event.title}</p>
                    <span class="task-xp">+${event.xp_reward} XP</span>
                </div>
                <button class="action-btn" onclick="completeEvent(${event.id})">Completar</button>
            `;
            
            eventsList.appendChild(li);
        });
    } catch (error) {
        console.error('Error cargando eventos:', error);
        eventsList.innerHTML = '<p class="loading-text">Error al conectar con el servidor.</p>';
    }
}

// 3. Lógica para completar un evento y ganar experiencia
async function completeEvent(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/complete`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (response.ok) {
            // Si el backend nos avisa de que subimos de nivel, lanzamos una alerta
            if (data.sube_de_nivel) {
                alert(`¡Enhorabuena! Has subido al Nivel ${data.nivel_actual}`);
            }
            
            // Recargamos automáticamente los datos para ver la barra crecer y la tarea desaparecer
            loadUserProfile();
            loadEvents();
        } else {
            alert(data.error || 'Error al completar el evento');
        }
    } catch (error) {
        console.error('Error al completar:', error);
    }
}

// Iniciar la aplicación en cuanto cargue el HTML
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadEvents();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado correctamente.', reg))
            .catch(err => console.error('Error al registrar el Service Worker.', err));
    });
}