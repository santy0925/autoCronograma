// Configuración global
let appConfig = {
    dailyCapacity: 52,
    teams: [],
    weekSchedule: {
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: []
    }
};

let teamIdCounter = 1;
let editingTeamId = null;

// Días de la semana
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const DAY_NAMES = {
    monday: 'Lunes',
    tuesday: 'Martes', 
    wednesday: 'Miércoles',
    thursday: 'Jueves',
    friday: 'Viernes'
};

/**
 * Función para mezclar un array aleatoriamente (Fisher-Yates shuffle)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Carga los datos guardados
 */
function loadData() {
    const savedData = JSON.parse(localStorage.getItem('flyOfficeData') || '{}');
    if (savedData.appConfig) {
        appConfig = savedData.appConfig;
    }
    if (savedData.teamIdCounter) {
        teamIdCounter = savedData.teamIdCounter;
    }
    
    // Actualizar input de capacidad
    document.getElementById('dailyCapacityInput').value = appConfig.dailyCapacity;
}

/**
 * Guarda los datos
 */
function saveData() {
    const dataToSave = {
        appConfig: appConfig,
        teamIdCounter: teamIdCounter
    };
    localStorage.setItem('flyOfficeData', JSON.stringify(dataToSave));
}

/**
 * Actualiza la fecha actual
 */
function updateCurrentDate() {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = today.toLocaleDateString('es-ES', options);
}

/**
 * Actualiza la capacidad diaria
 */
function updateDailyCapacity(value) {
    appConfig.dailyCapacity = parseInt(value) || 52;
    saveData();
    redistributeTeams(); // Redistribuir al cambiar la capacidad
    updateStats();
}

/**
 * Agrega un nuevo equipo
 */
function addTeam() {
    const name = document.getElementById('teamName').value.trim();
    const size = parseInt(document.getElementById('teamSize').value) || 0;
    const daysPerWeek = 0; 
    
    const messageDiv = document.getElementById('addTeamMessage');
    
    if (!name) {
        if (messageDiv) {
            messageDiv.innerHTML = '<div class="alert">Por favor, ingresa el nombre del equipo.</div>';
        }
        return;
    }
    
    if (size <= 0 || size > appConfig.dailyCapacity) {
        if (messageDiv) {
            messageDiv.innerHTML = `<div class="alert">El número de personas debe estar entre 1 y ${appConfig.dailyCapacity}.</div>`;
        }
        return;
    }
    
    const newTeam = {
        id: teamIdCounter++,
        name: name,
        size: size,
        daysPerWeek: daysPerWeek,
        assignedDays: []
    };
    
    appConfig.teams.push(newTeam);
    
    // Limpiar formulario
    document.getElementById('teamName').value = '';
    document.getElementById('teamSize').value = '5';
    
    if (messageDiv) {
        messageDiv.innerHTML = '<div class="success">✅ Equipo agregado exitosamente.</div>';
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }
    
    saveData();
    redistributeTeams();
    renderTeamsList();
    updateStats();
}

/**
 * Elimina un equipo
 */
function deleteTeam(teamId) {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        appConfig.teams = appConfig.teams.filter(team => team.id !== teamId);
        saveData();
        redistributeTeams();
        renderTeamsList();
        updateStats();
    }
}

/**
 * Activa el modo de edición para un equipo
 */
function editTeam(teamId) {
    if (editingTeamId && editingTeamId !== teamId) {
        cancelEdit(editingTeamId);
    }
    
    editingTeamId = teamId;
    const teamCard = document.querySelector(`[data-team-id="${teamId}"]`);
    const team = appConfig.teams.find(t => t.id === teamId);
    
    if (!teamCard || !team) return;
    
    teamCard.classList.add('editing');
    
    const editForm = teamCard.querySelector('.edit-form');
    editForm.classList.add('active');
    
    editForm.querySelector('.edit-name').value = team.name;
    editForm.querySelector('.edit-size').value = team.size;
    editForm.querySelector('.edit-days').value = `${team.daysPerWeek} día(s)`;
    
    const normalActions = teamCard.querySelector('.normal-actions');
    normalActions.style.display = 'none';
    
    const editActions = teamCard.querySelector('.edit-actions');
    editActions.style.display = 'flex';
}

/**
 * Guarda los cambios de un equipo
 */
function saveTeamEdit(teamId) {
    const teamCard = document.querySelector(`[data-team-id="${teamId}"]`);
    const team = appConfig.teams.find(t => t.id === teamId);
    
    if (!teamCard || !team) return;
    
    const editForm = teamCard.querySelector('.edit-form');
    const newName = editForm.querySelector('.edit-name').value.trim();
    const newSize = parseInt(editForm.querySelector('.edit-size').value) || 0;
    
    if (!newName) {
        alert('Por favor, ingresa el nombre del equipo.');
        return;
    }
    
    if (newSize <= 0 || newSize > appConfig.dailyCapacity) {
        alert(`El número de personas debe estar entre 1 y ${appConfig.dailyCapacity}.`);
        return;
    }
    
    team.name = newName;
    team.size = newSize;
    
    saveData();
    redistributeTeams();
    renderTeamsList();
    updateStats();
    
    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = '<div class="success">✅ Equipo actualizado exitosamente.</div>';
    teamCard.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
    
    editingTeamId = null;
}

/**
 * Cancela la edición de un equipo
 */
function cancelEdit(teamId) {
    const teamCard = document.querySelector(`[data-team-id="${teamId}"]`);
    
    if (!teamCard) return;
    
    teamCard.classList.remove('editing');
    
    const editForm = teamCard.querySelector('.edit-form');
    editForm.classList.remove('active');
    
    const normalActions = teamCard.querySelector('.normal-actions');
    normalActions.style.display = 'flex';
    
    const editActions = teamCard.querySelector('.edit-actions');
    editActions.style.display = 'none';
    
    editingTeamId = null;
}

/**
 * Algoritmo mejorado para redistribuir equipos con más aleatoriedad
 */
function redistributeTeams() {
    const messageDiv = document.getElementById('redistributionMessage');

    // Mezclar equipos aleatoriamente para cada redistribución
    const teamsToAssign = shuffleArray(appConfig.teams);

    let maxRetries = 15; // Aumentamos los intentos
    let retry = 0;
    let bestAssignment = null;
    let bestScore = -1;

    while (retry < maxRetries) {
        // Limpiar horario actual
        DAYS.forEach(day => {
            appConfig.weekSchedule[day] = [];
        });

        // Limpiar asignaciones de equipos
        appConfig.teams.forEach(team => {
            team.assignedDays = [];
            team.daysPerWeek = 0;
        });

        let currentAssignment = {
            schedule: JSON.parse(JSON.stringify(appConfig.weekSchedule)),
            teams: appConfig.teams.map(team => ({...team, assignedDays: [], daysPerWeek: 0}))
        };

        let unassignedCount = 0;
        let totalAssignedDays = 0;

        // Asignar equipos con más aleatoriedad
        for (let team of teamsToAssign) {
            const teamInAssignment = currentAssignment.teams.find(t => t.id === team.id);
            const assignedDaysResult = assignTeamToDaysRandomly(teamInAssignment, currentAssignment.schedule);
            
            if (assignedDaysResult.length < 2 && team.size > 0) {
                unassignedCount++;
            }
            totalAssignedDays += assignedDaysResult.length;
        }

        // Calcular puntuación de esta asignación
        const score = totalAssignedDays - (unassignedCount * 10);
        
        if (score > bestScore) {
            bestScore = score;
            bestAssignment = currentAssignment;
        }

        // Si encontramos una asignación perfecta, la usamos
        if (unassignedCount === 0) {
            break;
        }

        retry++;
    }

    // Aplicar la mejor asignación encontrada
    if (bestAssignment) {
        appConfig.weekSchedule = bestAssignment.schedule;
        bestAssignment.teams.forEach(assignedTeam => {
            const originalTeam = appConfig.teams.find(t => t.id === assignedTeam.id);
            if (originalTeam) {
                originalTeam.assignedDays = assignedTeam.assignedDays;
                originalTeam.daysPerWeek = assignedTeam.daysPerWeek;
            }
        });
    }

    // Verificar equipos sin asignar
    const unassignedTeams = appConfig.teams.filter(team => team.assignedDays.length < 2 && team.size > 0);
    
    if (unassignedTeams.length === 0) {
        messageDiv.innerHTML = '<div class="success">✅ Todos los equipos fueron redistribuidos exitosamente con nuevos días.</div>';
    } else {
        let warningMsg = '<div class="alert">⚠️ Algunos equipos no pudieron asignarse completamente:<br>';
        unassignedTeams.forEach(team => {
            warningMsg += `• ${team.name}: ${team.assignedDays.length} día(s) asignado(s)<br>`;
        });
        warningMsg += '</div>';
        messageDiv.innerHTML = warningMsg;
    }

    saveData();
    renderWeekSchedule();
    renderTeamsList();
    updateStats();

    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

/**
 * Asigna un equipo a días aleatorios disponibles (versión con más aleatoriedad)
 */
function assignTeamToDaysRandomly(team, tempSchedule) {
    const getHypotheticalDailyOccupancy = (schedule) => {
        const dailyOccupancy = {};
        DAYS.forEach(day => {
            dailyOccupancy[day] = schedule[day].reduce((sum, t) => sum + t.size, 0);
        });
        return dailyOccupancy;
    };

    const attemptRandomAssignment = (targetDays, force = false) => {
        const assigned = [];
        let hypothetical = getHypotheticalDailyOccupancy(tempSchedule);
        
        // Mezclar días aleatoriamente para cada intento
        const shuffledDays = shuffleArray(DAYS);
        
        // Intentar varias combinaciones aleatorias
        const maxAttempts = 10;
        let bestAssignment = [];
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const currentAssignment = [];
            const tempHypothetical = {...hypothetical};
            const availableDays = shuffleArray(DAYS);
            
            for (let day of availableDays) {
                if (currentAssignment.length >= targetDays) break;
                if (tempHypothetical[day] + team.size <= appConfig.dailyCapacity || force) {
                    currentAssignment.push(day);
                    tempHypothetical[day] += team.size;
                }
            }
            
            if (currentAssignment.length > bestAssignment.length) {
                bestAssignment = [...currentAssignment];
            }
            
            if (bestAssignment.length === targetDays) break;
        }
        
        return bestAssignment;
    };

    // Alternar aleatoriamente entre 2 y 3 días, con más variabilidad
    const random = Math.random();
    let preferredDays;
    
    if (random < 0.6) {
        preferredDays = 3;
    } else {
        preferredDays = 2;
    }

    let finalAssignedDays = attemptRandomAssignment(preferredDays);
    
    if (finalAssignedDays.length === preferredDays) {
        team.daysPerWeek = preferredDays;
    } else {
        // Intentar con el otro valor
        const fallbackDays = (preferredDays === 3) ? 2 : 3;
        finalAssignedDays = attemptRandomAssignment(fallbackDays);
        
        if (finalAssignedDays.length === fallbackDays) {
            team.daysPerWeek = fallbackDays;
        } else {
            // Forzar al menos 2 días
            finalAssignedDays = attemptRandomAssignment(2, true);
            team.daysPerWeek = Math.max(2, finalAssignedDays.length);
        }
    }

    team.assignedDays = finalAssignedDays;
    team.assignedDays.forEach(day => {
        tempSchedule[day].push({
            id: team.id,
            name: team.name,
            size: team.size
        });
    });

    return finalAssignedDays;
}

/**
 * Renderiza el horario semanal
 */
function renderWeekSchedule() {
    const container = document.getElementById('weekSchedule');
    container.innerHTML = '';
    
    DAYS.forEach(day => {
        const dayColumn = document.createElement('div');
        dayColumn.className = 'day-column';
        
        const totalPeople = appConfig.weekSchedule[day].reduce((sum, team) => sum + team.size, 0);
        const isOverCapacity = totalPeople > appConfig.dailyCapacity;
        
        dayColumn.innerHTML = `
            <div class="day-header ${isOverCapacity ? 'alert' : ''}">${DAY_NAMES[day]}</div>
            <div class="day-content">
                ${appConfig.weekSchedule[day].map(team => `
                    <div class="team-in-day">
                        <strong>${team.name}</strong><br>
                        👥 ${team.size} personas
                    </div>
                `).join('')}
            </div>
            <div class="day-counter ${isOverCapacity ? 'alert' : ''}">
                ${totalPeople}/${appConfig.dailyCapacity}
            </div>
        `;
        
        container.appendChild(dayColumn);
    });
}

/**
 * Renderiza la lista de equipos editables
 */
function renderTeamsList() {
    const container = document.getElementById('teamsList');
    
    if (appConfig.teams.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No hay equipos registrados. Agrega uno nuevo.</div>';
        return;
    }
    
    container.innerHTML = appConfig.teams.map(team => `
        <div class="team-card" data-team-id="${team.id}">
            <div class="team-header">
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-details">
                        👥 ${team.size} personas • 📅 ${team.daysPerWeek} día(s)/semana (auto)
                        ${team.assignedDays.length > 0 ? 
                            ` • Asignado: ${team.assignedDays.map(day => DAY_NAMES[day]).join(', ')}` : 
                            ' • Sin asignar'
                        }
                    </div>
                </div>
                <div class="team-actions">
                    <div class="normal-actions" style="display: flex; gap: 10px;">
                        <button class="btn btn-small btn-warning" onclick="editTeam(${team.id})">✏️ Editar</button>
                        <button class="btn btn-small btn-danger" onclick="deleteTeam(${team.id})">🗑️ Eliminar</button>
                    </div>
                    <div class="edit-actions" style="display: none; gap: 10px;">
                        <button class="btn btn-small btn-success" onclick="saveTeamEdit(${team.id})">💾 Guardar</button>
                        <button class="btn btn-small" onclick="cancelEdit(${team.id})">❌ Cancelar</button>
                    </div>
                </div>
            </div>
            
            <div class="edit-form">
                <div class="form-group">
                    <label>Nombre del Equipo:</label>
                    <input type="text" class="edit-name inline-input" value="${team.name}">
                </div>
                <div class="form-group">
                    <label>Número de Personas:</label>
                    <input type="number" class="edit-size inline-input" min="1" max="${appConfig.dailyCapacity}" value="${team.size}">
                </div>
                <div class="form-group">
                    <label>Días por semana (auto-asignados):</label>
                    <input type="text" class="edit-days inline-input" value="${team.daysPerWeek} día(s)" readonly>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Actualiza las estadísticas
 */
function updateStats() {
    const totalTeams = appConfig.teams.length;
    const totalPeople = appConfig.teams.reduce((sum, team) => sum + team.size, 0);
    
    const today = new Date().getDay();
    let todayKey = ''; 
    
    switch(today) {
        case 1: todayKey = 'monday'; break;
        case 2: todayKey = 'tuesday'; break;
        case 3: todayKey = 'wednesday'; break;
        case 4: todayKey = 'thursday'; break;
        case 5: todayKey = 'friday'; break;
        default: todayKey = 'monday';
    }
    
    const todayOccupancy = appConfig.weekSchedule[todayKey] ? 
        appConfig.weekSchedule[todayKey].reduce((sum, team) => sum + team.size, 0) : 0;
    
    document.getElementById('totalTeams').textContent = totalTeams;
    document.getElementById('totalPeople').textContent = totalPeople;
    document.getElementById('dailyCapacity').textContent = appConfig.dailyCapacity;
    document.getElementById('todayOccupancy').textContent = todayOccupancy;
}

/**
 * Inicialización
 */
function init() {
    loadData();
    updateCurrentDate();
    redistributeTeams();
}

// Inicializar cuando se carga la página
window.onload = init;