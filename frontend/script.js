const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_NAMES = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes'
};

let appConfig = {
    dailyCapacity: 52,
    teams: [],
    weekSchedule: {
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
    }
};

let editingTeamId = null;

// --------------------- BACKEND API -----------------------

async function loadData() {
    const res = await fetch('http://localhost:3000/equipos');
    const equipos = await res.json();

    appConfig.teams = equipos.map(e => ({
        id: e.id,
        name: e.nombre,
        size: e.personas,
        daysPerWeek: e.dias,
        assignedDays: []
    }));

    redistributeTeams();
    renderTeamsList();
    updateStats();
}

async function saveTeamToDB(name, size, dias) {
    await fetch('http://localhost:3000/equipos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: name, personas: size, dias })
    });
    await loadData();
}

async function deleteTeamFromDB(id) {
    await fetch(`http://localhost:3000/equipos/${id}`, {
        method: 'DELETE'
    });
    await loadData();
}

// -------------------- FUNCIONES UI ------------------------

function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);
}

function updateDailyCapacity(value) {
    appConfig.dailyCapacity = parseInt(value) || 52;
    redistributeTeams();
    updateStats();
}

function addTeam() {
    const name = document.getElementById('teamName').value.trim();
    const size = parseInt(document.getElementById('teamSize').value) || 0;
    const dias = 0;

    if (!name || size <= 0 || size > appConfig.dailyCapacity) {
        alert("Completa bien los datos");
        return;
    }

    saveTeamToDB(name, size, dias);
    document.getElementById('teamName').value = '';
    document.getElementById('teamSize').value = '5';
}

function deleteTeam(id) {
    if (confirm('¿Seguro que quieres eliminar este equipo?')) {
        deleteTeamFromDB(id);
    }
}

function renderTeamsList() {
    const container = document.getElementById('teamsList');
    if (appConfig.teams.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos registrados.</div>';
        return;
    }

    container.innerHTML = appConfig.teams.map(team => `
        <div class="team-card">
            <div class="team-header">
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-details">
                        👥 ${team.size} personas • 📅 ${team.daysPerWeek} día(s)/semana
                        ${team.assignedDays.length > 0 ? ` • Asignado: ${team.assignedDays.map(day => DAY_NAMES[day]).join(', ')}` : ' • Sin asignar'}
                    </div>
                </div>
                <div class="team-actions">
                    <button class="btn btn-small btn-danger" onclick="deleteTeam(${team.id})">Eliminar</button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('totalTeams').textContent = appConfig.teams.length;
    document.getElementById('totalPeople').textContent = appConfig.teams.reduce((sum, t) => sum + t.size, 0);
    
    const today = new Date().getDay();
    const dayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][today];
    const peopleToday = appConfig.weekSchedule[dayKey]?.reduce((sum, t) => sum + t.size, 0) || 0;
    
    document.getElementById('todayOccupancy').textContent = peopleToday;
    document.getElementById('dailyCapacity').textContent = appConfig.dailyCapacity;
}

// --------------------- REDISTRIBUCIÓN ------------------------

function redistributeTeams() {
    DAYS.forEach(day => appConfig.weekSchedule[day] = []);
    appConfig.teams.forEach(team => {
        team.assignedDays = [];
        let assigned = assignTeamToDaysRandomly(team);
        team.assignedDays = assigned;
        assigned.forEach(day => appConfig.weekSchedule[day].push(team));
    });
    renderWeekSchedule();
}

function assignTeamToDaysRandomly(team) {
    const shuffledDays = [...DAYS].sort(() => 0.5 - Math.random());
    const targetDays = team.daysPerWeek || (Math.random() < 0.5 ? 2 : 3);
    const result = [];

    for (let day of shuffledDays) {
        const dayTotal = appConfig.weekSchedule[day].reduce((sum, t) => sum + t.size, 0);
        if (dayTotal + team.size <= appConfig.dailyCapacity) {
            result.push(day);
            if (result.length >= targetDays) break;
        }
    }

    return result;
}

function renderWeekSchedule() {
    const container = document.getElementById('weekSchedule');
    container.innerHTML = '';

    DAYS.forEach(day => {
        const totalPeople = appConfig.weekSchedule[day].reduce((sum, team) => sum + team.size, 0);
        const over = totalPeople > appConfig.dailyCapacity;

        container.innerHTML += `
        <div class="day-column">
            <div class="day-header ${over ? 'alert' : ''}">${DAY_NAMES[day]}</div>
            <div class="day-content">
                ${appConfig.weekSchedule[day].map(team => `
                    <div class="team-in-day"><strong>${team.name}</strong><br>👥 ${team.size}</div>
                `).join('')}
            </div>
            <div class="day-counter ${over ? 'alert' : ''}">
                ${totalPeople}/${appConfig.dailyCapacity}
            </div>
        </div>`;
    });
}

// ---------------------- INICIO ----------------------------

function init() {
    updateCurrentDate();
    loadData();
}

window.onload = init;
