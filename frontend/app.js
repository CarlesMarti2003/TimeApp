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

// Variables del calendario y modal
let currentDate = new Date();
const monthYearDisplay = document.getElementById('month-year-display');
const calendarDays = document.getElementById('calendar-days');
const fabAdd = document.getElementById('fab-add');
const addModal = document.getElementById('add-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');

// 4. Lógica del Calendario
async function renderCalendar() {
    currentDate.setDate(1);
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Nombres de los meses
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
    
    const firstDayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1; // Ajustar a lunes
    const lastDay = new Date(year, month + 1, 0).getDate();
    
    calendarDays.innerHTML = '';
    
    // Obtener los eventos del servidor para marcar los días
    const response = await fetch(`${API_URL}/events`);
    const events = await response.json();
    const eventDates = events.map(ev => ev.start_time); // Extraemos solo las fechas

    // Rellenar espacios vacíos del principio del mes
    for (let x = 0; x < firstDayIndex; x++) {
        calendarDays.innerHTML += `<div></div>`;
    }
    
    // Rellenar los días
    for (let i = 1; i <= lastDay; i++) {
        // Formatear la fecha actual a YYYY-MM-DD para compararla
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        let classes = 'cal-day';
        if (i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
            classes += ' today';
        }
        if (eventDates.includes(dateStr)) {
            classes += ' has-event'; // Marcamos visualmente si hay evento ese día
        }
        
        calendarDays.innerHTML += `<div class="${classes}">${i}</div>`;
    }
}

document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

// 5. Lógica del Modal y creación de eventos
fabAdd.addEventListener('click', () => addModal.classList.remove('hidden'));
cancelBtn.addEventListener('click', () => addModal.classList.add('hidden'));

saveBtn.addEventListener('click', async () => {
    const title = document.getElementById('new-title').value;
    const date = document.getElementById('new-date').value;
    const xp = document.getElementById('new-xp').value;
    
    if(!title || !date || !xp) return alert("Rellena todos los campos");

    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: title, date: date, xp_reward: parseInt(xp) })
        });
        
        if (response.ok) {
            addModal.classList.add('hidden');
            // Limpiar formulario
            document.getElementById('new-title').value = '';
            document.getElementById('new-date').value = '';
            document.getElementById('new-xp').value = '';
            
            // Recargar interfaz
            loadEvents();
            renderCalendar();
        }
    } catch (error) {
        console.error('Error guardando evento:', error);
    }
});

// Añadimos renderCalendar al evento global de carga inicial (busca la línea que ya tenías y añade la función)
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadEvents();
    renderCalendar(); // Añadimos esto
});