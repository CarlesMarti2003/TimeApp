// ==========================================
// 1. CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================
const API_URL = 'https://CarlesMarti.pythonanywhere.com';

let USERNAME = localStorage.getItem('timeapp_username');
let currentWeekStart = new Date(); // Variable para controlar la navegación semanal

// Elementos DOM - Perfil
const userLevelEl = document.getElementById('user-level');
const userXpEl = document.getElementById('user-xp');
const xpBarEl = document.getElementById('xp-bar');

// Elementos DOM - Tareas y Vistas
const eventsList = document.getElementById('events-list'); 
const allTasksList = document.getElementById('all-tasks-list'); 
const homeSection = document.getElementById('home-section');
const pendingSection = document.getElementById('pending-tasks-section');

// Elementos DOM - Navegación y Filtros
const navHome = document.getElementById('nav-home');
const navTasks = document.getElementById('nav-tasks');
const sortSelect = document.getElementById('sort-tasks');

// Elementos DOM - Calendario y Modal
const monthYearDisplay = document.getElementById('month-year-display');
const calendarDays = document.getElementById('calendar-days'); // Ahora es .weekly-grid
const fabAdd = document.getElementById('fab-add');
const addModal = document.getElementById('add-modal');
const cancelBtn = document.getElementById('cancel-btn');
const saveBtn = document.getElementById('save-btn');
const dateInput = document.getElementById('task-date');

// ==========================================
// 2. INICIALIZACIÓN Y LOGIN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const appContent = document.getElementById('app-content');
    const loginForm = document.getElementById('login-form');

    // Si ya hay usuario, ocultar login y arrancar app
    if (USERNAME) {
        loginScreen.classList.add('hidden');
        appContent.classList.remove('hidden');
        initApp();
    }

    // Interceptar envío del formulario de login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('login-user').value;
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, email: email, password: pass })
            });

            if (response.ok) {
                USERNAME = user;
                localStorage.setItem('timeapp_username', USERNAME);
                loginScreen.classList.add('hidden');
                appContent.classList.remove('hidden');
                initApp();
            } else {
                const data = await response.json();
                alert(data.error);
            }
        } catch (err) {
            console.error("Error en login", err);
            alert("No se pudo conectar con el servidor.");
        }
    });
});

async function initApp() {
    // Calcular el lunes de la semana actual y poner la hora a 00:00
    currentWeekStart.setHours(0, 0, 0, 0);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);

    await loadUserProfile();
    await loadEvents();
    renderWeeklyCalendar();
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker registrado correctamente.', reg))
            .catch(err => console.error('Error al registrar el Service Worker.', err));
    });
}

// ==========================================
// 3. FUNCIONES DE USUARIO Y TAREAS
// ==========================================
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_URL}/user?username=${USERNAME}`);
        const user = await response.json();
        
        userLevelEl.textContent = `Nivel ${user.level}`;
        userXpEl.textContent = `${user.xp_points} XP`;
        
        const xpInCurrentLevel = user.xp_points % 100;
        xpBarEl.style.width = `${xpInCurrentLevel}%`;
    } catch (error) {
        console.error('Error cargando el perfil:', error);
    }
}

async function loadEvents() {
    try {
        const response = await fetch(`${API_URL}/events?username=${USERNAME}`);
        const events = await response.json();
        
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const todayStr = (new Date(today - offset)).toISOString().split('T')[0];
        
        const todaysEvents = events.filter(ev => ev.start_time === todayStr && ev.status === 'pending');
        
        eventsList.innerHTML = '';
        if (todaysEvents.length === 0) {
            eventsList.innerHTML = '<p style="text-align:center; color: #7F8C8D; font-size: 14px;">¡Todo completado por hoy!</p>';
            return;
        }

        todaysEvents.forEach(event => {
            const dateObj = new Date(event.start_time);
            const formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });

            const el = document.createElement('div');
            el.className = 'event-card';
            el.innerHTML = `
                <h4>${event.title}</h4>
                <span class="event-date">Fecha de fin: ${formattedDate}</span>
                <button class="action-btn" onclick="completeEvent(${event.id})">${event.xp_reward} EXP</button>
            `;
            eventsList.appendChild(el);
        });
    } catch (error) {
        console.error('Error cargando eventos:', error);
    }
}

async function loadAllTasks() {
    try {
        const response = await fetch(`${API_URL}/events?username=${USERNAME}`);
        let events = await response.json();
        events = events.filter(ev => ev.status === 'pending');
        
        const sortType = sortSelect.value;
        if(sortType === 'date-asc') {
            events.sort((a,b) => new Date(a.start_time) - new Date(b.start_time));
        } else if(sortType === 'date-desc') {
            events.sort((a,b) => new Date(b.start_time) - new Date(a.start_time));
        } else if(sortType === 'xp-desc') {
            events.sort((a,b) => b.xp_reward - a.xp_reward);
        } else if(sortType === 'xp-asc') {
            events.sort((a,b) => a.xp_reward - b.xp_reward);
        }

        allTasksList.innerHTML = '';
        if (events.length === 0) {
            allTasksList.innerHTML = '<p style="text-align:center; color: #7F8C8D;">No hay tareas pendientes.</p>';
            return;
        }

        events.forEach(event => {
            const dateObj = new Date(event.start_time);
            const formattedDate = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            
            const el = document.createElement('div');
            el.className = 'event-card';
            el.innerHTML = `
                <h4>${event.title}</h4>
                <span class="event-date">Fecha de fin: ${formattedDate}</span>
                <button class="action-btn" onclick="completeEvent(${event.id})">${event.xp_reward} EXP</button>
            `;
            allTasksList.appendChild(el);
        });
    } catch (error) {
        console.error('Error cargando todas las tareas:', error);
    }
}

async function completeEvent(eventId) {
    try {
        const response = await fetch(`${API_URL}/events/${eventId}/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: USERNAME })
        });
        const data = await response.json();
        
        if (response.ok) {
            if (data.sube_de_nivel) {
                alert(`¡Enhorabuena! Has subido al Nivel ${data.nivel_actual}`);
            }
            loadUserProfile();
            loadEvents();
            if(!pendingSection.classList.contains('hidden')) {
                loadAllTasks();
            }
            renderWeeklyCalendar();
        } else {
            alert(data.error || 'Error al completar el evento');
        }
    } catch (error) {
        console.error('Error al completar:', error);
    }
}

// ==========================================
// 4. LÓGICA DEL CALENDARIO SEMANAL
// ==========================================
async function renderWeeklyCalendar() {
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    monthYearDisplay.textContent = `${monthNames[currentWeekStart.getMonth()]} ${currentWeekStart.getFullYear()}`;
    
    calendarDays.innerHTML = '';
    
    let events = [];
    try {
        const response = await fetch(`${API_URL}/events?username=${USERNAME}`);
        if(response.ok) {
            events = await response.json();
        }
    } catch(err) {
        console.error("Error cargando eventos para calendario", err);
    }

    // Dibujar los 7 días de la semana
    for (let i = 0; i < 7; i++) {
        const currentDay = new Date(currentWeekStart);
        currentDay.setDate(currentWeekStart.getDate() + i);
        
        // Ajuste de zona horaria para formato de búsqueda (YYYY-MM-DD)
        const offset = currentDay.getTimezoneOffset() * 60000;
        const dateStr = (new Date(currentDay - offset)).toISOString().split('T')[0];

        // Filtrar tareas que caen en este día específico
        const dayEvents = events.filter(ev => ev.start_time === dateStr && ev.status === 'pending');
        
        // Generar etiquetas HTML de tareas
        let tasksHTML = dayEvents.map(ev => `<div class="cal-task">${ev.title}</div>`).join('');

        let classes = 'weekly-day';
        if (currentDay.toDateString() === new Date().toDateString()) {
            classes += ' today';
        }

        calendarDays.innerHTML += `
            <div class="${classes}">
                <div class="weekly-day-num">${currentDay.getDate()}</div>
                ${tasksHTML}
            </div>
        `;
    }
}

// Navegación del Calendario
document.getElementById('prev-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeeklyCalendar();
});

document.getElementById('next-week').addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeeklyCalendar();
});

// Bloqueo de fecha del pasado para el Modal
if (dateInput) {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
    dateInput.setAttribute('min', localISOTime);
}

// ==========================================
// 5. NAVEGACIÓN Y FILTROS
// ==========================================
navHome.addEventListener('click', () => {
    homeSection.classList.remove('hidden');
    pendingSection.classList.add('hidden');
    navHome.classList.add('active');
    navTasks.classList.remove('active');
    loadEvents();
});

navTasks.addEventListener('click', () => {
    homeSection.classList.add('hidden');
    pendingSection.classList.remove('hidden');
    navHome.classList.remove('active');
    navTasks.classList.add('active');
    loadAllTasks();
});

sortSelect.addEventListener('change', loadAllTasks);

// ==========================================
// 6. MODAL Y CREACIÓN DE EVENTOS
// ==========================================
fabAdd.addEventListener('click', () => addModal.classList.remove('hidden'));
cancelBtn.addEventListener('click', () => addModal.classList.add('hidden'));

saveBtn.addEventListener('click', async () => {
    const title = document.getElementById('task-title').value;
    const date = document.getElementById('task-date').value;
    const xp = document.getElementById('task-xp').value;
    
    if(!title || !date || !xp) return alert("Rellena todos los campos");

    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000; 
    const localISOTime = (new Date(today - offset)).toISOString().split('T')[0];
    
    if (date < localISOTime) {
        return alert("No puedes programar tareas en el pasado. Selecciona la fecha de hoy o una futura.");
    }

    try {
        const response = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username: USERNAME,
                title: title, 
                date: date, 
                xp_reward: parseInt(xp) 
            })
        });
        
        if (response.ok) {
            addModal.classList.add('hidden');
            document.getElementById('task-title').value = '';
            document.getElementById('task-date').value = '';
            document.getElementById('task-xp').value = '';
            
            loadEvents();
            if(!pendingSection.classList.contains('hidden')) {
                loadAllTasks();
            }
            renderWeeklyCalendar();
        }
    } catch (error) {
        console.error('Error guardando evento:', error);
    }
});