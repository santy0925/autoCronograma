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
    // daysPerWeek ya no se toma del input, se asignará automáticamente
    const daysPerWeek = 0; 
    
    const messageDiv = document.getElementById('addTeamMessage');
    
    if (!name) {
        messageDiv.innerHTML = '<div class="alert">Por favor, ingresa el nombre del equipo.</div>';
        return;
    }
    
    if (size <= 0 || size > appConfig.dailyCapacity) {
        messageDiv.innerHTML = `<div class="alert">El número de personas debe estar entre 1 y ${appConfig.dailyCapacity}.</div>`;
        return;
    }
    
    const newTeam = {
        id: teamIdCounter++,
        name: name,
        size: size,
        daysPerWeek: daysPerWeek, // Inicialmente 0, se asignará en la redistribución
        assignedDays: []
    };
    
    appConfig.teams.push(newTeam);
    
    // Limpiar formulario
    document.getElementById('teamName').value = '';
    document.getElementById('teamSize').value = '5';
    // document.getElementById('daysPerWeek').value = '3'; // Se elimina
    
    messageDiv.innerHTML = '<div class="success">✅ Equipo agregado exitosamente.</div>';
    
    saveData();
    redistributeTeams(); // Redistribuir después de agregar
    renderTeamsList();
    updateStats();
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

/**
 * Elimina un equipo
 */
function deleteTeam(teamId) {
    if (confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
        appConfig.teams = appConfig.teams.filter(team => team.id !== teamId);
        saveData();
        redistributeTeams(); // Redistribuir después de eliminar
        renderTeamsList();
        updateStats();
    }
}

/**
 * Activa el modo de edición para un equipo
 */
function editTeam(teamId) {
    // Cancelar cualquier edición anterior
    if (editingTeamId && editingTeamId !== teamId) {
        cancelEdit(editingTeamId);
    }
    
    editingTeamId = teamId;
    const teamCard = document.querySelector(`[data-team-id="${teamId}"]`);
    const team = appConfig.teams.find(t => t.id === teamId);
    
    if (!teamCard || !team) return;
    
    // Agregar clase de edición
    teamCard.classList.add('editing');
    
    // Mostrar formulario de edición
    const editForm = teamCard.querySelector('.edit-form');
    editForm.classList.add('active');
    
    // Rellenar valores actuales
    editForm.querySelector('.edit-name').value = team.name;
    editForm.querySelector('.edit-size').value = team.size;
    // Los días por semana son automáticos, solo se muestran
    editForm.querySelector('.edit-days').value = `${team.daysPerWeek} día(s)`;
    
    // Ocultar botones de acción normales
    const normalActions = teamCard.querySelector('.normal-actions');
    normalActions.style.display = 'none';
    
    // Mostrar botones de edición
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
    // newDays ya no se toma de un input editable
    
    // Validaciones
    if (!newName) {
        alert('Por favor, ingresa el nombre del equipo.');
        return;
    }
    
    if (newSize <= 0 || newSize > appConfig.dailyCapacity) {
        alert(`El número de personas debe estar entre 1 y ${appConfig.dailyCapacity}.`);
        return;
    }
    
    // Actualizar el equipo
    team.name = newName;
    team.size = newSize;
    // team.daysPerWeek se reasigna en redistributeTeams()
    
    // Guardar y redistribuir
    saveData();
    redistributeTeams(); // Redistribuir después de editar
    renderTeamsList();
    updateStats();
    
    // Mensaje de éxito
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
    
    // Remover clase de edición
    teamCard.classList.remove('editing');
    
    // Ocultar formulario de edición
    const editForm = teamCard.querySelector('.edit-form');
    editForm.classList.remove('active');
    
    // Mostrar botones normales
    const normalActions = teamCard.querySelector('.normal-actions');
    normalActions.style.display = 'flex';
    
    // Ocultar botones de edición
    const editActions = teamCard.querySelector('.edit-actions');
    editActions.style.display = 'none';
    
    editingTeamId = null;
}

/**
 * Algoritmo para redistribuir equipos automáticamente
 */
function redistributeTeams() {
    const messageDiv = document.getElementById('redistributionMessage');

    // Ordenar equipos por tamaño (más grandes primero) para mejor distribución
    const teamsToAssign = [...appConfig.teams].sort((a, b) => b.size - a.size);

    let maxRetries = 10;
    let retry = 0;
    let stillUnassigned = true;

    while (retry < maxRetries && stillUnassigned) {
        // Limpiar horario actual
        DAYS.forEach(day => {
            appConfig.weekSchedule[day] = [];
        });

        // Limpiar asignaciones de equipos
        appConfig.teams.forEach(team => {
            team.assignedDays = [];
            team.daysPerWeek = 0; // Reset para que assignTeamToDays lo calcule
        });

        let unassignedTeams = [];

        for (let team of teamsToAssign) {
            const assignedDaysResult = assignTeamToDays(team);
            if (assignedDaysResult.length < 2 && team.size > 0) {
                unassignedTeams.push({
                    team: team,
                    assigned: assignedDaysResult.length,
                    needed: '2-3'
                });
            }
        }

        if (unassignedTeams.length === 0) {
            stillUnassigned = false;
            messageDiv.innerHTML = '<div class="success">✅ Todos los equipos fueron asignados correctamente con 2 o 3 días.</div>';
        }

        retry++;
    }

    if (stillUnassigned) {
        let warningMsg = '<div class="alert">⚠️ No se pudo asignar correctamente a algunos equipos tras varios intentos:<br>';
        appConfig.teams.forEach(team => {
            if (team.assignedDays.length < 2 && team.size > 0) {
                warningMsg += `• ${team.name}: ${team.assignedDays.length} día(s) asignado(s)<br>`;
            }
        });
        warningMsg += '</div>';
        messageDiv.innerHTML = warningMsg;
    }

    saveData();
    renderWeekSchedule();
    renderTeamsList(); // Vuelve a renderizar la lista para mostrar los días asignados
    updateStats();

    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

/**
 * Asigna un equipo a los días disponibles (entre 2 y 3 días).
 * Este algoritmo es más estricto: un equipo solo se asigna si puede obtener 2 o 3 días.
 * Si no puede obtener al menos 2 días sin exceder la capacidad, se considera "no asignado"
 * para los propósitos de este algoritmo, y su daysPerWeek será 0 o 1 si no se pudo más.
 * Modifica directamente appConfig.weekSchedule y team.assignedDays
 * @returns {Array} Los días asignados al equipo.
 */
function assignTeamToDays(team) {
    const availableDays = [...DAYS];

    const getHypotheticalDailyOccupancy = (tempSchedule) => {
        const dailyOccupancy = {};
        DAYS.forEach(day => {
            dailyOccupancy[day] = tempSchedule[day].reduce((sum, t) => sum + t.size, 0);
        });
        return dailyOccupancy;
    };

    const attemptAssignment = (targetDays, force = false) => {
        const assigned = [];
        const tempSchedule = JSON.parse(JSON.stringify(appConfig.weekSchedule));
        let hypothetical = getHypotheticalDailyOccupancy(tempSchedule);

        const sortedDays = [...availableDays].sort((a, b) => hypothetical[a] - hypothetical[b]);

        for (let day of sortedDays) {
            if (assigned.length >= targetDays) break;
            if (hypothetical[day] + team.size <= appConfig.dailyCapacity || force) {
                assigned.push(day);
                hypothetical[day] += team.size;
            }
        }
        return assigned;
    };

    // Alternancia: cada equipo par → 3 días, impar → 2 días (por ID)
    const preferredDays = (team.id % 2 === 0) ? 3 : 2;

    let finalAssignedDays = attemptAssignment(preferredDays);
    if (finalAssignedDays.length === preferredDays) {
        team.daysPerWeek = preferredDays;
    } else {
        // Reintentar con el otro valor
        const fallbackDays = (preferredDays === 3) ? 2 : 3;
        finalAssignedDays = attemptAssignment(fallbackDays);
        if (finalAssignedDays.length === fallbackDays) {
            team.daysPerWeek = fallbackDays;
        } else {
            // Fuerza al menos 2 días
            finalAssignedDays = attemptAssignment(2, true);
            team.daysPerWeek = 2;
        }
    }

    team.assignedDays = finalAssignedDays;
    team.assignedDays.forEach(day => {
        appConfig.weekSchedule[day].push({
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
    
    // Calcular ocupación de hoy
    const today = new Date().getDay(); // 0=domingo, 1=lunes, etc.
    let todayKey = ''; 
    
    switch(today) {
        case 1: todayKey = 'monday'; break;
        case 2: todayKey = 'tuesday'; break;
        case 3: todayKey = 'wednesday'; break;
        case 4: todayKey = 'thursday'; break;
        case 5: todayKey = 'friday'; break;
        default: todayKey = 'monday'; // Asumir lunes si es fin de semana o desconocido
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
    redistributeTeams(); // Redistribuir al cargar la página
}



// Inicializar cuando se carga la página
window.onload = init;