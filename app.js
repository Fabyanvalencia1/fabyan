// ============================================
// OASIS CREW - Sistema de Gestión de Horas Proyectadas
// Versión Mejorada con Funcionalidades Completas
// ============================================

// ============================================
// VARIABLES GLOBALES Y CONFIGURACIÓN
// ============================================

let employeeCount = 0;
let commonEmployees = JSON.parse(localStorage.getItem('commonEmployees')) || [];
let copiedSchedule = null;
let undoStack = [];
let redoStack = [];
let charts = {
    department: null,
    employee: null
};

// ============================================
// FUNCIONES DE INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando OASIS CREW...');

    initializeDatePicker();
    setupEventListeners();
    loadFromLocalStorage();
    updateEmployeeSelectors();
    loadDarkModePreference();

    console.log('✅ Sistema OASIS CREW inicializado correctamente');
    showNotification('Sistema cargado exitosamente', 'success');
});

function initializeDatePicker() {
    const weekStartInput = document.getElementById('weekStartDate');
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    weekStartInput.valueAsDate = sunday;
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Botones principales
    document.getElementById('addEmployee').addEventListener('click', () => {
        saveState();
        addEmployeeRow();
    });
    document.getElementById('removeEmployee').addEventListener('click', removeLastEmployee);
    document.getElementById('clearAll').addEventListener('click', clearAllData);
    document.getElementById('calculateAll').addEventListener('click', calculateAllHours);

    // Gestión de empleados
    document.getElementById('manageEmployees').addEventListener('click', openEmployeeModal);
    document.getElementById('closeModal').addEventListener('click', closeEmployeeModal);
    document.querySelector('.close').addEventListener('click', closeEmployeeModal);
    document.getElementById('addNewEmployee').addEventListener('click', addNewCommonEmployee);
    document.getElementById('loadSelectedEmployees').addEventListener('click', loadSelectedEmployees);
    document.getElementById('selectAllEmployees').addEventListener('click', selectAllEmployees);
    document.getElementById('deselectAllEmployees').addEventListener('click', deselectAllEmployees);
    document.getElementById('deleteSelectedEmployees').addEventListener('click', deleteSelectedEmployees);

    // Búsqueda de empleados
    document.getElementById('searchEmployee').addEventListener('input', filterEmployeeList);

    // Filtros de tabla
    document.getElementById('searchFilter').addEventListener('input', filterTable);
    document.getElementById('departmentFilter').addEventListener('change', filterTable);

    // Herramientas de alineación de horarios
    document.getElementById('showAlignmentToolbar').addEventListener('click', showAlignmentToolbar);
    document.getElementById('toggleAlignmentToolbar').addEventListener('click', hideAlignmentToolbar);
    document.getElementById('copySchedule').addEventListener('click', copyScheduleToMultiple);
    document.getElementById('clearScheduleTarget').addEventListener('click', clearTargetSchedules);

    // Exportar e imprimir
    document.getElementById('printTable').addEventListener('click', printTable);
    document.getElementById('exportTable').addEventListener('click', exportToExcel);
    document.getElementById('exportCSV').addEventListener('click', exportToCSV);
    document.getElementById('generatePDF').addEventListener('click', generatePDF);

    // Templates
    document.getElementById('saveTemplate').addEventListener('click', saveTemplate);
    document.getElementById('loadTemplate').addEventListener('click', loadTemplate);

    // Undo/Redo
    document.getElementById('undoAction').addEventListener('click', undo);
    document.getElementById('redoAction').addEventListener('click', redo);

    // Dark Mode
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);

    // Keyboard Shortcuts
    document.getElementById('showShortcuts').addEventListener('click', showKeyboardShortcuts);
    document.querySelector('.close-shortcuts')?.addEventListener('click', closeKeyboardShortcuts);

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const employeeModal = document.getElementById('employeeModal');
        const shortcutsModal = document.getElementById('shortcutsModal');

        if (event.target === employeeModal) {
            closeEmployeeModal();
        }
        if (event.target === shortcutsModal) {
            closeKeyboardShortcuts();
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);

    // Auto-save on input changes
    const container = document.querySelector('.container');
    container.addEventListener('input', debounce(saveToLocalStorage, 1000));
}

// ============================================
// GESTIÓN DE EMPLEADOS - AGREGAR Y ELIMINAR
// ============================================

function addEmployeeRow() {
    employeeCount++;
    const tbody = document.getElementById('employeeRows');
    const row = tbody.insertRow();
    row.className = 'employee-row';
    row.dataset.employeeId = employeeCount;

    // Número de fila
    const cellNum = row.insertCell();
    cellNum.className = 'row-number';
    cellNum.textContent = employeeCount;

    // Código de empleado
    const cellCode = row.insertCell();
    cellCode.innerHTML = `<input type="text" class="employee-code" placeholder="EMP-${employeeCount.toString().padStart(3, '0')}" data-field="code">`;

    // Nombre del empleado
    const cellName = row.insertCell();
    cellName.innerHTML = `<input type="text" class="employee-name" placeholder="Nombre del empleado" data-field="name">`;

    // Departamento
    const cellDept = row.insertCell();
    cellDept.innerHTML = `
        <select class="department-select" data-field="department" onchange="updateDepartmentColor(this)">
            <option value="plantacion">Plantación</option>
            <option value="puller">Puller</option>
            <option value="growing">Growing</option>
            <option value="mantenimiento">Mantenimiento</option>
        </select>
    `;

    // Días de la semana (Domingo a Sábado)
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    days.forEach(day => {
        const cell = row.insertCell();
        cell.innerHTML = `
            <div class="time-container">
                <div class="time-row">
                    <label>In:</label>
                    <input type="time" class="time-input" data-day="${day}" data-type="in">
                </div>
                <div class="time-row">
                    <label>Out:</label>
                    <input type="time" class="time-input" data-day="${day}" data-type="out">
                </div>
                <input type="text" class="day-code" placeholder="Código" data-day="${day}" data-type="code" maxlength="10">
            </div>
        `;
    });

    // Total de horas
    const cellTotal = row.insertCell();
    cellTotal.className = 'total';
    cellTotal.textContent = '0.00';

    // Estado
    const cellStatus = row.insertCell();
    cellStatus.innerHTML = '<span class="badge badge-success">OK</span>';

    // Acciones rápidas
    const cellActions = row.insertCell();
    cellActions.innerHTML = `
        <div class="schedule-actions">
            <button class="copy-schedule-btn" onclick="copyScheduleFrom(${employeeCount})" title="Copiar este horario">
                <i class="fas fa-copy"></i>
            </button>
            <button class="copy-schedule-btn" onclick="pasteScheduleTo(${employeeCount})" title="Pegar horario">
                <i class="fas fa-paste"></i>
            </button>
        </div>
    `;

    updateEmployeeSelectors();
    saveToLocalStorage();
    showNotification('Empleado agregado', 'success');
}

function removeLastEmployee() {
    const tbody = document.getElementById('employeeRows');
    if (tbody.rows.length > 0) {
        if (confirm('¿Eliminar el último empleado de la lista?')) {
            saveState();
            tbody.deleteRow(tbody.rows.length - 1);
            employeeCount = Math.max(0, employeeCount - 1);
            updateEmployeeSelectors();
            saveToLocalStorage();
            calculateAllHours();
            showNotification('Empleado eliminado', 'info');
        }
    } else {
        alert('❌ No hay empleados para eliminar');
    }
}

function clearAllData() {
    if (confirm('⚠️ ¿Estás seguro de que quieres limpiar todos los datos? Esta acción no se puede deshacer.')) {
        saveState();
        document.getElementById('employeeRows').innerHTML = '';
        employeeCount = 0;
        document.getElementById('results').classList.add('hidden');
        updateEmployeeSelectors();
        saveToLocalStorage();
        showNotification('Todos los datos han sido eliminados', 'warning');
    }
}

function updateDepartmentColor(selectElement) {
    const row = selectElement.closest('tr');
    const dept = selectElement.value;

    // Remove all department classes
    row.classList.remove('dept-plantacion', 'dept-puller', 'dept-growing', 'dept-mantenimiento');

    // Add new department class
    row.classList.add(`dept-${dept}`);
}

// ============================================
// CÁLCULO DE HORAS
// ============================================

function calculateAllHours() {
    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');
    const hourLimit = parseFloat(document.getElementById('hourLimit').value) || 45;
    const breakTime = parseFloat(document.getElementById('breakTime').value) || 30;

    if (rows.length === 0) {
        alert('❌ No hay empleados para calcular. Agrega empleados primero.');
        return;
    }

    let totalEmployees = rows.length;
    let exceedingCount = 0;
    let totalHoursSum = 0;
    let departmentStats = {};

    for (let row of rows) {
        const total = calculateRowTotal(row, breakTime);
        const totalCell = row.cells[row.cells.length - 3];
        const statusCell = row.cells[row.cells.length - 2];

        totalCell.textContent = total.toFixed(2);
        totalCell.className = 'total';

        // Actualizar estado
        if (total > hourLimit) {
            row.classList.add('warning');
            totalCell.classList.add('over-limit');
            statusCell.innerHTML = '<span class="badge badge-danger">Excede</span>';
            exceedingCount++;
        } else {
            row.classList.remove('warning');
            totalCell.classList.remove('over-limit');
            statusCell.innerHTML = '<span class="badge badge-success">OK</span>';
        }

        totalHoursSum += total;

        // Estadísticas por departamento
        const deptSelect = row.querySelector('.department-select');
        if (deptSelect) {
            const dept = deptSelect.value;
            if (!departmentStats[dept]) {
                departmentStats[dept] = { count: 0, hours: 0, exceeding: 0 };
            }
            departmentStats[dept].count++;
            departmentStats[dept].hours += total;
            if (total > hourLimit) {
                departmentStats[dept].exceeding++;
            }
        }
    }

    // Mostrar resumen
    displaySummary(totalEmployees, exceedingCount, totalHoursSum, departmentStats);
    renderCharts(departmentStats);
    saveToLocalStorage();
    showNotification('✅ Cálculo completado', 'success');
}

function calculateRowTotal(row, breakTime) {
    let total = 0;
    const timeInputs = row.querySelectorAll('.time-input');

    for (let i = 0; i < timeInputs.length; i += 2) {
        const inTime = timeInputs[i].value;
        const outTime = timeInputs[i + 1].value;

        if (inTime && outTime) {
            const hours = calculateHoursBetween(inTime, outTime);
            if (hours > 0) {
                total += Math.max(0, hours - (breakTime / 60));
            }
        }
    }

    return total;
}

function calculateHoursBetween(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    // Handle overnight shifts
    if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
    }

    return (endMinutes - startMinutes) / 60;
}

function displaySummary(totalEmployees, exceedingCount, totalHours, departmentStats) {
    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('exceedingEmployees').textContent = exceedingCount;
    document.getElementById('totalHours').textContent = totalHours.toFixed(2);
    document.getElementById('averageHours').textContent = totalEmployees > 0
        ? (totalHours / totalEmployees).toFixed(2)
        : '0.00';

    // Resumen por departamento
    const deptSummary = document.getElementById('departmentSummary');
    deptSummary.innerHTML = '';

    const deptNames = {
        plantacion: 'Plantación',
        puller: 'Puller',
        growing: 'Growing',
        mantenimiento: 'Mantenimiento'
    };

    const deptIcons = {
        plantacion: 'fa-seedling',
        puller: 'fa-hand-rock',
        growing: 'fa-leaf',
        mantenimiento: 'fa-tools'
    };

    for (let [dept, stats] of Object.entries(departmentStats)) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        const avgHours = stats.count > 0 ? (stats.hours / stats.count).toFixed(2) : '0.00';

        card.innerHTML = `
            <div class="card-icon" style="background: linear-gradient(135deg, #${getDepartmentColor(dept)});">
                <i class="fas ${deptIcons[dept] || 'fa-building'}"></i>
            </div>
            <div class="card-content">
                <h4>${deptNames[dept] || dept}</h4>
                <div class="summary-value">${stats.count} empleados</div>
                <small style="color: var(--text-secondary);">
                    Total: ${stats.hours.toFixed(2)}h | Promedio: ${avgHours}h<br>
                    Exceden límite: ${stats.exceeding}
                </small>
            </div>
        `;
        deptSummary.appendChild(card);
    }

    document.getElementById('results').classList.remove('hidden');
}

function getDepartmentColor(dept) {
    const colors = {
        plantacion: '27ae60, 1e8449',
        puller: 'f39c12, d68910',
        growing: '3498db, 2874a6',
        mantenimiento: 'e74c3c, c0392b'
    };
    return colors[dept] || '95a5a6, 7f8c8d';
}

// ============================================
// CHARTS
// ============================================

function renderCharts(departmentStats) {
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js no está disponible');
        return;
    }

    const deptNames = {
        plantacion: 'Plantación',
        puller: 'Puller',
        growing: 'Growing',
        mantenimiento: 'Mantenimiento'
    };

    const labels = Object.keys(departmentStats).map(d => deptNames[d] || d);
    const hours = Object.values(departmentStats).map(s => s.hours.toFixed(2));
    const counts = Object.values(departmentStats).map(s => s.count);

    const colors = ['#27ae60', '#f39c12', '#3498db', '#e74c3c'];

    // Department Hours Chart
    const deptCtx = document.getElementById('departmentChart');
    if (deptCtx) {
        if (charts.department) {
            charts.department.destroy();
        }

        charts.department = new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Horas Totales',
                    data: hours,
                    backgroundColor: colors,
                    borderColor: colors,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Employee Distribution Chart
    const empCtx = document.getElementById('employeeChart');
    if (empCtx) {
        if (charts.employee) {
            charts.employee.destroy();
        }

        charts.employee = new Chart(empCtx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Empleados',
                    data: counts,
                    backgroundColor: colors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// ============================================
// ALINEACIÓN Y COPIA DE HORARIOS
// ============================================

function showAlignmentToolbar() {
    const toolbar = document.getElementById('alignmentToolbar');
    toolbar.classList.add('active');
    updateEmployeeSelectors();
    showNotification('Toolbar de alineación activado', 'info');
}

function hideAlignmentToolbar() {
    const toolbar = document.getElementById('alignmentToolbar');
    toolbar.classList.remove('active');
}

function updateEmployeeSelectors() {
    const sourceSelect = document.getElementById('sourceEmployee');
    const targetSelect = document.getElementById('targetEmployees');

    if (!sourceSelect || !targetSelect) return;

    // Limpiar selectores
    sourceSelect.innerHTML = '<option value="">Seleccionar empleado...</option>';
    targetSelect.innerHTML = '<option value="all">📋 Todos los empleados</option>';

    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const nameInput = row.querySelector('.employee-name');
        const codeInput = row.querySelector('.employee-code');
        const employeeId = row.dataset.employeeId;

        const name = nameInput?.value || `Empleado ${i + 1}`;
        const code = codeInput?.value || '';
        const displayText = code ? `${code} - ${name}` : name;

        const sourceOption = document.createElement('option');
        sourceOption.value = employeeId;
        sourceOption.textContent = displayText;
        sourceSelect.appendChild(sourceOption);

        const targetOption = document.createElement('option');
        targetOption.value = employeeId;
        targetOption.textContent = displayText;
        targetSelect.appendChild(targetOption);
    }
}

function copyScheduleFrom(employeeId) {
    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        if (row.dataset.employeeId == employeeId) {
            copiedSchedule = extractScheduleFromRow(row);
            showNotification('✅ Horario copiado al portapapeles', 'success');
            return;
        }
    }
}

function pasteScheduleTo(employeeId) {
    if (!copiedSchedule) {
        alert('❌ No hay horario copiado. Primero copia un horario.');
        return;
    }

    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        if (row.dataset.employeeId == employeeId) {
            saveState();
            applyScheduleToRow(row, copiedSchedule);
            showNotification('✅ Horario pegado correctamente', 'success');
            calculateAllHours();
            return;
        }
    }
}

function copyScheduleToMultiple() {
    const sourceId = document.getElementById('sourceEmployee').value;
    const targetSelect = document.getElementById('targetEmployees');
    const selectedOptions = Array.from(targetSelect.selectedOptions);

    if (!sourceId) {
        alert('❌ Por favor selecciona un empleado de origen.');
        return;
    }

    if (selectedOptions.length === 0) {
        alert('❌ Por favor selecciona al menos un empleado de destino.');
        return;
    }

    saveState();
    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    // Encontrar fila de origen
    let sourceRow = null;
    for (let row of rows) {
        if (row.dataset.employeeId == sourceId) {
            sourceRow = row;
            break;
        }
    }

    if (!sourceRow) {
        alert('❌ No se encontró el empleado de origen.');
        return;
    }

    const schedule = extractScheduleFromRow(sourceRow);
    let copiedCount = 0;

    // Aplicar a empleados seleccionados
    for (let option of selectedOptions) {
        if (option.value === 'all') {
            // Copiar a todos excepto el origen
            for (let row of rows) {
                if (row.dataset.employeeId != sourceId) {
                    applyScheduleToRow(row, schedule);
                    copiedCount++;
                }
            }
        } else {
            // Copiar a empleado específico
            for (let row of rows) {
                if (row.dataset.employeeId == option.value) {
                    applyScheduleToRow(row, schedule);
                    copiedCount++;
                    break;
                }
            }
        }
    }

    showNotification(`✅ Horario copiado a ${copiedCount} empleado(s)`, 'success');
    calculateAllHours();
}

function extractScheduleFromRow(row) {
    const schedule = {};
    const timeInputs = row.querySelectorAll('.time-input');
    const dayCodes = row.querySelectorAll('.day-code');

    timeInputs.forEach(input => {
        const day = input.dataset.day;
        const type = input.dataset.type;
        if (!schedule[day]) schedule[day] = {};
        schedule[day][type] = input.value;
    });

    dayCodes.forEach(input => {
        const day = input.dataset.day;
        if (!schedule[day]) schedule[day] = {};
        schedule[day].code = input.value;
    });

    return schedule;
}

function applyScheduleToRow(row, schedule) {
    const timeInputs = row.querySelectorAll('.time-input');
    const dayCodes = row.querySelectorAll('.day-code');

    timeInputs.forEach(input => {
        const day = input.dataset.day;
        const type = input.dataset.type;
        if (schedule[day] && schedule[day][type] !== undefined) {
            input.value = schedule[day][type];
        }
    });

    dayCodes.forEach(input => {
        const day = input.dataset.day;
        if (schedule[day] && schedule[day].code !== undefined) {
            input.value = schedule[day].code;
        }
    });
}

function clearTargetSchedules() {
    const targetSelect = document.getElementById('targetEmployees');
    const selectedOptions = Array.from(targetSelect.selectedOptions);

    if (selectedOptions.length === 0) {
        alert('❌ Por favor selecciona al menos un empleado.');
        return;
    }

    if (!confirm('⚠️ ¿Estás seguro de que quieres limpiar los horarios seleccionados?')) {
        return;
    }

    saveState();
    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');
    let clearedCount = 0;

    for (let option of selectedOptions) {
        if (option.value === 'all') {
            // Limpiar todos
            for (let row of rows) {
                clearRowSchedule(row);
                clearedCount++;
            }
        } else {
            // Limpiar específico
            for (let row of rows) {
                if (row.dataset.employeeId == option.value) {
                    clearRowSchedule(row);
                    clearedCount++;
                    break;
                }
            }
        }
    }

    showNotification(`✅ Horarios limpiados: ${clearedCount} empleado(s)`, 'success');
    calculateAllHours();
}

function clearRowSchedule(row) {
    const timeInputs = row.querySelectorAll('.time-input');
    const dayCodes = row.querySelectorAll('.day-code');

    timeInputs.forEach(input => input.value = '');
    dayCodes.forEach(input => input.value = '');
}

// ============================================
// GESTIÓN DE EMPLEADOS COMUNES
// ============================================

function openEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'block';
    renderEmployeeList();
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

function addNewCommonEmployee() {
    const code = document.getElementById('newEmployeeCode').value.trim();
    const name = document.getElementById('newEmployeeName').value.trim();
    const dept = document.getElementById('newEmployeeDept').value;

    if (!name) {
        alert('❌ Por favor ingresa el nombre del empleado');
        return;
    }

    const employee = {
        id: Date.now(),
        code: code || `EMP-${(commonEmployees.length + 1).toString().padStart(3, '0')}`,
        name: name,
        department: dept
    };

    commonEmployees.push(employee);
    localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));

    document.getElementById('newEmployeeCode').value = '';
    document.getElementById('newEmployeeName').value = '';

    renderEmployeeList();
    showNotification(`✅ Empleado "${name}" agregado a la lista común`, 'success');
}

function renderEmployeeList() {
    const container = document.getElementById('employeeListContainer');
    const searchTerm = document.getElementById('searchEmployee').value.toLowerCase();

    container.innerHTML = '';

    const filteredEmployees = commonEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm) ||
        (emp.code && emp.code.toLowerCase().includes(searchTerm))
    );

    if (filteredEmployees.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-light); padding:20px;">No hay empleados en la lista</p>';
        return;
    }

    filteredEmployees.forEach(employee => {
        const div = document.createElement('div');
        div.className = 'employee-item';
        div.innerHTML = `
            <div class="employee-info">
                <input type="checkbox" class="employee-checkbox" data-id="${employee.id}">
                <input type="text" value="${employee.code || ''}"
                    onchange="updateCommonEmployee(${employee.id}, 'code', this.value)"
                    placeholder="Código"
                    style="width: 100px;">
                <input type="text" value="${employee.name}"
                    onchange="updateCommonEmployee(${employee.id}, 'name', this.value)"
                    placeholder="Nombre"
                    style="flex: 1; min-width: 150px;">
                <select onchange="updateCommonEmployee(${employee.id}, 'department', this.value)"
                    style="width: 130px;">
                    <option value="plantacion" ${employee.department === 'plantacion' ? 'selected' : ''}>Plantación</option>
                    <option value="puller" ${employee.department === 'puller' ? 'selected' : ''}>Puller</option>
                    <option value="growing" ${employee.department === 'growing' ? 'selected' : ''}>Growing</option>
                    <option value="mantenimiento" ${employee.department === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                </select>
            </div>
            <div class="employee-actions">
                <button class="btn-remove" onclick="deleteCommonEmployee(${employee.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(div);
    });
}

function updateCommonEmployee(id, field, value) {
    const employee = commonEmployees.find(e => e.id === id);
    if (employee) {
        employee[field] = value;
        localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));
        showNotification('Empleado actualizado', 'info');
    }
}

function deleteCommonEmployee(id) {
    if (confirm('¿Eliminar este empleado de la lista común?')) {
        commonEmployees = commonEmployees.filter(e => e.id !== id);
        localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));
        renderEmployeeList();
        showNotification('Empleado eliminado de la lista común', 'warning');
    }
}

function filterEmployeeList() {
    renderEmployeeList();
}

function selectAllEmployees() {
    document.querySelectorAll('.employee-checkbox').forEach(cb => cb.checked = true);
}

function deselectAllEmployees() {
    document.querySelectorAll('.employee-checkbox').forEach(cb => cb.checked = false);
}

function loadSelectedEmployees() {
    const checkboxes = document.querySelectorAll('.employee-checkbox:checked');

    if (checkboxes.length === 0) {
        alert('❌ Por favor selecciona al menos un empleado');
        return;
    }

    saveState();
    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    const selectedEmployees = commonEmployees.filter(e => selectedIds.includes(e.id));

    selectedEmployees.forEach(employee => {
        addEmployeeRow();
        const tbody = document.getElementById('employeeRows');
        const lastRow = tbody.rows[tbody.rows.length - 1];

        lastRow.querySelector('.employee-code').value = employee.code || '';
        lastRow.querySelector('.employee-name').value = employee.name;
        lastRow.querySelector('.department-select').value = employee.department;

        // Aplicar color de departamento
        lastRow.classList.add(`dept-${employee.department}`);
    });

    closeEmployeeModal();
    showNotification(`✅ ${selectedEmployees.length} empleado(s) cargado(s)`, 'success');
}

function deleteSelectedEmployees() {
    const checkboxes = document.querySelectorAll('.employee-checkbox:checked');

    if (checkboxes.length === 0) {
        alert('❌ Por favor selecciona al menos un empleado');
        return;
    }

    if (!confirm(`⚠️ ¿Eliminar ${checkboxes.length} empleado(s) de la lista común?`)) {
        return;
    }

    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    commonEmployees = commonEmployees.filter(e => !selectedIds.includes(e.id));
    localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));
    renderEmployeeList();
    showNotification(`${checkboxes.length} empleado(s) eliminado(s)`, 'warning');
}

// ============================================
// FILTROS DE TABLA
// ============================================

function filterTable() {
    const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
    const deptFilter = document.getElementById('departmentFilter').value;

    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    let visibleCount = 0;

    for (let row of rows) {
        const name = row.querySelector('.employee-name')?.value.toLowerCase() || '';
        const code = row.querySelector('.employee-code')?.value.toLowerCase() || '';
        const dept = row.querySelector('.department-select')?.value || '';

        const matchesSearch = name.includes(searchTerm) || code.includes(searchTerm);
        const matchesDept = !deptFilter || dept === deptFilter;

        if (matchesSearch && matchesDept) {
            row.classList.remove('hidden-row');
            visibleCount++;
        } else {
            row.classList.add('hidden-row');
        }
    }

    if (visibleCount === 0 && rows.length > 0) {
        showNotification('No se encontraron empleados con esos criterios', 'warning');
    }
}

// ============================================
// GUARDAR Y CARGAR DATOS
// ============================================

function saveToLocalStorage() {
    const data = {
        employeeCount: employeeCount,
        hourLimit: document.getElementById('hourLimit').value,
        breakTime: document.getElementById('breakTime').value,
        weekStartDate: document.getElementById('weekStartDate').value,
        employees: []
    };

    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const employeeData = {
            id: row.dataset.employeeId,
            code: row.querySelector('.employee-code')?.value || '',
            name: row.querySelector('.employee-name')?.value || '',
            department: row.querySelector('.department-select')?.value || 'plantacion',
            schedule: {}
        };

        const timeInputs = row.querySelectorAll('.time-input');
        const dayCodes = row.querySelectorAll('.day-code');

        timeInputs.forEach(input => {
            const day = input.dataset.day;
            const type = input.dataset.type;
            if (!employeeData.schedule[day]) employeeData.schedule[day] = {};
            employeeData.schedule[day][type] = input.value;
        });

        dayCodes.forEach(input => {
            const day = input.dataset.day;
            if (!employeeData.schedule[day]) employeeData.schedule[day] = {};
            employeeData.schedule[day].code = input.value;
        });

        data.employees.push(employeeData);
    }

    localStorage.setItem('oasisHoursData', JSON.stringify(data));
    showAutoSaveIndicator();
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('oasisHoursData');
    if (!savedData) return;

    try {
        const data = JSON.parse(savedData);

        document.getElementById('hourLimit').value = data.hourLimit || 45;
        document.getElementById('breakTime').value = data.breakTime || 30;
        document.getElementById('weekStartDate').value = data.weekStartDate || '';

        employeeCount = 0;
        document.getElementById('employeeRows').innerHTML = '';

        data.employees.forEach(empData => {
            addEmployeeRow();
            const tbody = document.getElementById('employeeRows');
            const row = tbody.rows[tbody.rows.length - 1];

            row.querySelector('.employee-code').value = empData.code || '';
            row.querySelector('.employee-name').value = empData.name || '';
            row.querySelector('.department-select').value = empData.department || 'plantacion';
            row.classList.add(`dept-${empData.department || 'plantacion'}`);

            if (empData.schedule) {
                for (let [day, times] of Object.entries(empData.schedule)) {
                    if (times.in) {
                        const inInput = row.querySelector(`.time-input[data-day="${day}"][data-type="in"]`);
                        if (inInput) inInput.value = times.in;
                    }
                    if (times.out) {
                        const outInput = row.querySelector(`.time-input[data-day="${day}"][data-type="out"]`);
                        if (outInput) outInput.value = times.out;
                    }
                    if (times.code) {
                        const codeInput = row.querySelector(`.day-code[data-day="${day}"]`);
                        if (codeInput) codeInput.value = times.code;
                    }
                }
            }
        });

        if (data.employees.length > 0) {
            calculateAllHours();
        }

        console.log('✅ Datos cargados desde localStorage');
    } catch (error) {
        console.error('❌ Error al cargar datos:', error);
    }
}

// ============================================
// TEMPLATES
// ============================================

function saveTemplate() {
    const templateName = prompt('📝 Nombre de la plantilla:');
    if (!templateName) return;

    const data = {
        name: templateName,
        date: new Date().toISOString(),
        hourLimit: document.getElementById('hourLimit').value,
        breakTime: document.getElementById('breakTime').value,
        employees: []
    };

    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    for (let row of rows) {
        const employeeData = {
            code: row.querySelector('.employee-code')?.value || '',
            name: row.querySelector('.employee-name')?.value || '',
            department: row.querySelector('.department-select')?.value || 'plantacion'
        };
        data.employees.push(employeeData);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_template_${templateName.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('✅ Plantilla guardada correctamente', 'success');
}

function loadTemplate() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = event => {
            try {
                const data = JSON.parse(event.target.result);

                if (confirm('📂 ¿Cargar esta plantilla? Se perderán los datos actuales.')) {
                    saveState();
                    document.getElementById('hourLimit').value = data.hourLimit || 45;
                    document.getElementById('breakTime').value = data.breakTime || 30;

                    employeeCount = 0;
                    document.getElementById('employeeRows').innerHTML = '';

                    data.employees.forEach(empData => {
                        addEmployeeRow();
                        const tbody = document.getElementById('employeeRows');
                        const row = tbody.rows[tbody.rows.length - 1];

                        row.querySelector('.employee-code').value = empData.code || '';
                        row.querySelector('.employee-name').value = empData.name || '';
                        row.querySelector('.department-select').value = empData.department || 'plantacion';
                        row.classList.add(`dept-${empData.department || 'plantacion'}`);
                    });

                    showNotification('✅ Plantilla cargada correctamente', 'success');
                    saveToLocalStorage();
                }
            } catch (error) {
                alert('❌ Error al cargar la plantilla: ' + error.message);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// ============================================
// EXPORTAR E IMPRIMIR
// ============================================

function printTable() {
    updatePrintInfo();
    window.print();
}

function updatePrintInfo() {
    const weekStart = document.getElementById('weekStartDate').value;
    if (weekStart) {
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);

        document.getElementById('printDateRange').textContent =
            `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }

    document.getElementById('printGeneratedDate').textContent = new Date().toLocaleString();
}

function exportToExcel() {
    const table = document.getElementById('employeeTable');
    let html = '<table border="1">';

    // Encabezados
    html += '<thead><tr>';
    const headers = table.querySelectorAll('thead th');
    headers.forEach((header, index) => {
        if (index < headers.length - 1) { // Excluir columna de acciones
            html += `<th>${header.textContent}</th>`;
        }
    });
    html += '</tr></thead>';

    // Filas
    html += '<tbody>';
    const rows = table.querySelectorAll('tbody tr:not(.hidden-row)');
    rows.forEach(row => {
        html += '<tr>';
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            if (index < cells.length - 1) { // Excluir columna de acciones
                const inputs = cell.querySelectorAll('input');
                let content = '';

                if (inputs.length > 0) {
                    if (cell.querySelector('.time-container')) {
                        const inTime = cell.querySelector('[data-type="in"]')?.value || '';
                        const outTime = cell.querySelector('[data-type="out"]')?.value || '';
                        const code = cell.querySelector('.day-code')?.value || '';
                        content = `${inTime}-${outTime} ${code}`;
                    } else {
                        content = inputs[0].value;
                    }
                } else if (cell.querySelector('select')) {
                    const select = cell.querySelector('select');
                    content = select.options[select.selectedIndex].text;
                } else {
                    content = cell.textContent.trim();
                }

                html += `<td>${content}</td>`;
            }
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_hours_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('✅ Exportado a Excel', 'success');
}

function exportToCSV() {
    const table = document.getElementById('employeeTable');
    let csv = [];

    // Headers
    const headers = Array.from(table.querySelectorAll('thead th'))
        .slice(0, -1) // Excluir columna de acciones
        .map(th => `"${th.textContent}"`);
    csv.push(headers.join(','));

    // Rows
    const rows = table.querySelectorAll('tbody tr:not(.hidden-row)');
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');

        cells.forEach((cell, index) => {
            if (index < cells.length - 1) {
                const inputs = cell.querySelectorAll('input');
                let content = '';

                if (inputs.length > 0) {
                    if (cell.querySelector('.time-container')) {
                        const inTime = cell.querySelector('[data-type="in"]')?.value || '';
                        const outTime = cell.querySelector('[data-type="out"]')?.value || '';
                        const code = cell.querySelector('.day-code')?.value || '';
                        content = `${inTime}-${outTime} ${code}`;
                    } else {
                        content = inputs[0].value;
                    }
                } else if (cell.querySelector('select')) {
                    const select = cell.querySelector('select');
                    content = select.options[select.selectedIndex].text;
                } else {
                    content = cell.textContent.trim();
                }

                rowData.push(`"${content}"`);
            }
        });

        csv.push(rowData.join(','));
    });

    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_hours_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification('✅ Exportado a CSV', 'success');
}

function generatePDF() {
    if (typeof jsPDF === 'undefined') {
        alert('❌ La librería jsPDF no está disponible');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // Título
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('OASIS CREW - Projected Hours Report', 14, 15);

    // Fecha
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    const weekStart = document.getElementById('weekStartDate').value;
    if (weekStart) {
        const startDate = new Date(weekStart);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 14, 27);
    }

    // Preparar datos para la tabla
    const headers = [['#', 'Código', 'Nombre', 'Dept', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Total']];
    const data = [];

    const tbody = document.getElementById('employeeRows');
    const rows = Array.from(tbody.getElementsByTagName('tr')).filter(row => !row.classList.contains('hidden-row'));

    rows.forEach((row, i) => {
        const rowData = [];

        // Número
        rowData.push(i + 1);

        // Código
        rowData.push(row.querySelector('.employee-code')?.value || '');

        // Nombre
        const name = row.querySelector('.employee-name')?.value || '';
        rowData.push(name.length > 20 ? name.substring(0, 20) + '...' : name);

        // Departamento
        const deptSelect = row.querySelector('.department-select');
        const deptText = deptSelect ? deptSelect.options[deptSelect.selectedIndex].text : '';
        rowData.push(deptText.substring(0, 4));

        // Días
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        days.forEach(day => {
            const inInput = row.querySelector(`.time-input[data-day="${day}"][data-type="in"]`);
            const outInput = row.querySelector(`.time-input[data-day="${day}"][data-type="out"]`);
            const inTime = inInput?.value || '';
            const outTime = outInput?.value || '';

            if (inTime && outTime) {
                rowData.push(`${inTime.substring(0, 5)}-${outTime.substring(0, 5)}`);
            } else {
                rowData.push('');
            }
        });

        // Total
        const totalCell = row.cells[row.cells.length - 3];
        rowData.push(totalCell.textContent);

        data.push(rowData);
    });

    // Generar tabla
    doc.autoTable({
        head: headers,
        body: data,
        startY: 32,
        theme: 'grid',
        styles: {
            fontSize: 7,
            cellPadding: 2
        },
        headStyles: {
            fillColor: [52, 152, 219],
            fontStyle: 'bold'
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 20 },
            2: { cellWidth: 35 },
            3: { cellWidth: 15 }
        }
    });

    // Guardar PDF
    doc.save(`oasis_hours_${new Date().toISOString().split('T')[0]}.pdf`);
    showNotification('✅ PDF generado correctamente', 'success');
}

// ============================================
// UNDO/REDO
// ============================================

function saveState() {
    const state = {
        html: document.getElementById('employeeRows').innerHTML,
        count: employeeCount
    };
    undoStack.push(state);
    redoStack = []; // Clear redo stack

    // Limit undo stack to 20 items
    if (undoStack.length > 20) {
        undoStack.shift();
    }

    updateUndoRedoButtons();
}

function undo() {
    if (undoStack.length === 0) return;

    const currentState = {
        html: document.getElementById('employeeRows').innerHTML,
        count: employeeCount
    };
    redoStack.push(currentState);

    const previousState = undoStack.pop();
    document.getElementById('employeeRows').innerHTML = previousState.html;
    employeeCount = previousState.count;

    updateUndoRedoButtons();
    updateEmployeeSelectors();
    showNotification('Deshecho', 'info');
}

function redo() {
    if (redoStack.length === 0) return;

    const currentState = {
        html: document.getElementById('employeeRows').innerHTML,
        count: employeeCount
    };
    undoStack.push(currentState);

    const nextState = redoStack.pop();
    document.getElementById('employeeRows').innerHTML = nextState.html;
    employeeCount = nextState.count;

    updateUndoRedoButtons();
    updateEmployeeSelectors();
    showNotification('Rehecho', 'info');
}

function updateUndoRedoButtons() {
    document.getElementById('undoAction').disabled = undoStack.length === 0;
    document.getElementById('redoAction').disabled = redoStack.length === 0;
}

// ============================================
// DARK MODE
// ============================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);

    const icon = document.querySelector('#darkModeToggle i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';

    showNotification(isDark ? '🌙 Modo oscuro activado' : '☀️ Modo claro activado', 'info');
}

function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('#darkModeToggle i');
        icon.className = 'fas fa-sun';
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

function showKeyboardShortcuts() {
    document.getElementById('shortcutsModal').style.display = 'block';
}

function closeKeyboardShortcuts() {
    document.getElementById('shortcutsModal').style.display = 'none';
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + S: Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToLocalStorage();
        showNotification('💾 Datos guardados', 'success');
    }

    // Ctrl/Cmd + Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
    }

    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
    }

    // Ctrl/Cmd + N: Add Employee
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        saveState();
        addEmployeeRow();
    }

    // Ctrl/Cmd + P: Print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        printTable();
    }

    // Ctrl/Cmd + E: Export to Excel
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportToExcel();
    }

    // Ctrl/Cmd + M: Manage Employees
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        openEmployeeModal();
    }

    // Ctrl/Cmd + D: Toggle Dark Mode
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        toggleDarkMode();
    }
}

// ============================================
// NOTIFICATIONS
// ============================================

function showNotification(message, type = 'info') {
    const notification = document.getElementById('autoSaveIndicator');
    notification.textContent = message;
    notification.className = 'auto-save-indicator show';

    // Change color based on type
    const colors = {
        success: '#2ecc71',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    notification.style.backgroundColor = colors[type] || colors.info;

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function showAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator');
    indicator.style.display = 'flex';
    indicator.classList.add('show');

    setTimeout(() => {
        indicator.classList.remove('show');
    }, 2000);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// AUTO-SAVE
// ============================================

// Auto-save every 30 seconds
setInterval(() => {
    if (document.getElementById('employeeRows').children.length > 0) {
        saveToLocalStorage();
    }
}, 30000);

// Save before closing window
window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

// ============================================
// CONSOLE INFO
// ============================================

console.log(`
%c╔═══════════════════════════════════════════╗
║                                           ║
║     🚀 OASIS CREW - Sistema Mejorado     ║
║                                           ║
║  ✅ Auto-guardado activado                ║
║  ✅ Modo oscuro disponible                ║
║  ✅ Atajos de teclado habilitados         ║
║  ✅ Undo/Redo implementado                ║
║  ✅ Exportación múltiple (XLS, CSV, PDF)  ║
║  ✅ Gráficos visuales activados           ║
║                                           ║
╚═══════════════════════════════════════════╝
`, 'color: #3498db; font-weight: bold;');

console.log('%c💡 Tip: Presiona Ctrl+S para guardar manualmente', 'color: #2ecc71;');
console.log('%c⌨️ Usa los atajos de teclado para mayor productividad', 'color: #f39c12;');
