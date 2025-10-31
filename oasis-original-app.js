// ============================================
// OASIS CREW - JavaScript Original
// Sistema de Gestión de Horas Proyectadas
// ============================================

let employeeCount = 0;
let commonEmployees = JSON.parse(localStorage.getItem('commonEmployees')) || [];

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    initializeDatePicker();
    setupEventListeners();
    loadFromLocalStorage();

    console.log('Sistema OASIS CREW inicializado');
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
    document.getElementById('addEmployee').addEventListener('click', addEmployeeRow);
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

    // Exportar e imprimir
    document.getElementById('printTable').addEventListener('click', printTable);
    document.getElementById('exportTable').addEventListener('click', exportToExcel);
    document.getElementById('generatePDF').addEventListener('click', generatePDF);

    // Templates
    document.getElementById('saveTemplate').addEventListener('click', saveTemplate);
    document.getElementById('loadTemplate').addEventListener('click', loadTemplate);

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('employeeModal');
        if (event.target === modal) {
            closeEmployeeModal();
        }
    });
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

    // Nombre del empleado
    const cellName = row.insertCell();
    cellName.innerHTML = `<input type="text" class="employee-name" placeholder="Nombre del empleado" data-field="name">`;

    // Departamento (oculto)
    const cellDept = row.insertCell();
    cellDept.style.display = 'none';
    cellDept.innerHTML = `
        <select class="department-select" data-field="department">
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
                <input type="text" class="day-code" placeholder="Código" data-day="${day}" data-type="code">
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

    saveToLocalStorage();
}

function removeLastEmployee() {
    const tbody = document.getElementById('employeeRows');
    if (tbody.rows.length > 0) {
        if (confirm('¿Eliminar el último empleado de la lista?')) {
            tbody.deleteRow(tbody.rows.length - 1);
            employeeCount = Math.max(0, employeeCount - 1);
            saveToLocalStorage();
            calculateAllHours();
        }
    } else {
        alert('No hay empleados para eliminar');
    }
}

function clearAllData() {
    if (confirm('¿Estás seguro de que quieres limpiar todos los datos? Esta acción no se puede deshacer.')) {
        document.getElementById('employeeRows').innerHTML = '';
        employeeCount = 0;
        document.getElementById('results').classList.add('hidden');
        saveToLocalStorage();
    }
}

// ============================================
// CÁLCULO DE HORAS
// ============================================

function calculateAllHours() {
    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');
    const hourLimit = parseFloat(document.getElementById('hourLimit').value) || 45;
    const breakTime = parseFloat(document.getElementById('breakTime').value) || 30;

    let totalEmployees = rows.length;
    let exceedingCount = 0;
    let totalHoursSum = 0;
    let departmentStats = {};

    for (let row of rows) {
        const total = calculateRowTotal(row, breakTime);
        const totalCell = row.cells[row.cells.length - 2];
        const statusCell = row.cells[row.cells.length - 1];

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
    saveToLocalStorage();
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

    for (let [dept, stats] of Object.entries(departmentStats)) {
        const card = document.createElement('div');
        card.className = 'summary-card';
        card.innerHTML = `
            <h4>${deptNames[dept] || dept}</h4>
            <div class="summary-value">
                👥 ${stats.count} empleados<br>
                ⏰ ${stats.hours.toFixed(2)} horas<br>
                ⚠️ ${stats.exceeding} exceden límite
            </div>
        `;
        deptSummary.appendChild(card);
    }

    document.getElementById('results').classList.remove('hidden');
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
    const name = document.getElementById('newEmployeeName').value.trim();
    const dept = document.getElementById('newEmployeeDept').value;

    if (!name) {
        alert('Por favor ingresa el nombre del empleado');
        return;
    }

    const employee = {
        id: Date.now(),
        name: name,
        department: dept
    };

    commonEmployees.push(employee);
    localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));

    document.getElementById('newEmployeeName').value = '';

    renderEmployeeList();
    alert(`Empleado "${name}" agregado correctamente`);
}

function renderEmployeeList() {
    const container = document.getElementById('employeeListContainer');
    const searchTerm = document.getElementById('searchEmployee').value.toLowerCase();

    container.innerHTML = '';

    const filteredEmployees = commonEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm)
    );

    if (filteredEmployees.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999;">No hay empleados en la lista</p>';
        return;
    }

    filteredEmployees.forEach(employee => {
        const div = document.createElement('div');
        div.className = 'employee-item';
        div.innerHTML = `
            <div class="employee-info">
                <input type="checkbox" class="employee-checkbox" data-id="${employee.id}">
                <input type="text" value="${employee.name}"
                    onchange="updateCommonEmployee(${employee.id}, 'name', this.value)"
                    placeholder="Nombre">
                <select onchange="updateCommonEmployee(${employee.id}, 'department', this.value)">
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
    }
}

function deleteCommonEmployee(id) {
    if (confirm('¿Eliminar este empleado de la lista común?')) {
        commonEmployees = commonEmployees.filter(e => e.id !== id);
        localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));
        renderEmployeeList();
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
        alert('Por favor selecciona al menos un empleado');
        return;
    }

    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    const selectedEmployees = commonEmployees.filter(e => selectedIds.includes(e.id));

    selectedEmployees.forEach(employee => {
        addEmployeeRow();
        const tbody = document.getElementById('employeeRows');
        const lastRow = tbody.rows[tbody.rows.length - 1];

        lastRow.querySelector('.employee-name').value = employee.name;
        lastRow.querySelector('.department-select').value = employee.department;

        // Aplicar color de departamento
        lastRow.classList.add(`dept-${employee.department}`);
    });

    closeEmployeeModal();
    alert(`${selectedEmployees.length} empleado(s) cargado(s)`);
}

function deleteSelectedEmployees() {
    const checkboxes = document.querySelectorAll('.employee-checkbox:checked');

    if (checkboxes.length === 0) {
        alert('Por favor selecciona al menos un empleado');
        return;
    }

    if (!confirm(`¿Eliminar ${checkboxes.length} empleado(s) de la lista común?`)) {
        return;
    }

    const selectedIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
    commonEmployees = commonEmployees.filter(e => !selectedIds.includes(e.id));
    localStorage.setItem('commonEmployees', JSON.stringify(commonEmployees));
    renderEmployeeList();
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

            row.querySelector('.employee-name').value = empData.name || '';
            row.querySelector('.department-select').value = empData.department || 'plantacion';

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

        console.log('Datos cargados desde localStorage');
    } catch (error) {
        console.error('Error al cargar datos:', error);
    }
}

// ============================================
// TEMPLATES
// ============================================

function saveTemplate() {
    const templateName = prompt('Nombre de la plantilla:');
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
            name: row.querySelector('.employee-name')?.value || '',
            department: row.querySelector('.department-select')?.value || 'plantacion'
        };
        data.employees.push(employeeData);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_template_${templateName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Plantilla guardada correctamente');
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

                if (confirm('¿Cargar esta plantilla? Se perderán los datos actuales.')) {
                    document.getElementById('hourLimit').value = data.hourLimit || 45;
                    document.getElementById('breakTime').value = data.breakTime || 30;

                    employeeCount = 0;
                    document.getElementById('employeeRows').innerHTML = '';

                    data.employees.forEach(empData => {
                        addEmployeeRow();
                        const tbody = document.getElementById('employeeRows');
                        const row = tbody.rows[tbody.rows.length - 1];

                        row.querySelector('.employee-name').value = empData.name || '';
                        row.querySelector('.department-select').value = empData.department || 'plantacion';
                    });

                    alert('Plantilla cargada correctamente');
                    saveToLocalStorage();
                }
            } catch (error) {
                alert('Error al cargar la plantilla: ' + error.message);
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
    headers.forEach(header => {
        if (header.style.display !== 'none') {
            html += `<th>${header.textContent}</th>`;
        }
    });
    html += '</tr></thead>';

    // Filas
    html += '<tbody>';
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        html += '<tr>';
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
            if (cell.style.display !== 'none') {
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
                    content = cell.querySelector('select').value;
                } else {
                    content = cell.textContent;
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
}

function generatePDF() {
    if (typeof jsPDF === 'undefined') {
        alert('La librería jsPDF no está disponible');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // Título
    doc.setFontSize(16);
    doc.text('OASIS CREW - Projected Hours Report', 14, 15);

    // Fecha
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    // Preparar datos para la tabla
    const headers = [['#', 'Nombre', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Total', 'Estado']];
    const data = [];

    const tbody = document.getElementById('employeeRows');
    const rows = tbody.getElementsByTagName('tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowData = [];

        // Número
        rowData.push(i + 1);

        // Nombre
        rowData.push(row.querySelector('.employee-name')?.value || '');

        // Días
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        days.forEach(day => {
            const inInput = row.querySelector(`.time-input[data-day="${day}"][data-type="in"]`);
            const outInput = row.querySelector(`.time-input[data-day="${day}"][data-type="out"]`);
            const inTime = inInput?.value || '';
            const outTime = outInput?.value || '';
            rowData.push(inTime && outTime ? `${inTime}-${outTime}` : '');
        });

        // Total
        const totalCell = row.cells[row.cells.length - 2];
        rowData.push(totalCell.textContent);

        // Estado
        const statusCell = row.cells[row.cells.length - 1];
        rowData.push(statusCell.textContent);

        data.push(rowData);
    }

    // Generar tabla
    doc.autoTable({
        head: headers,
        body: data,
        startY: 28,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [52, 152, 219] }
    });

    // Guardar PDF
    doc.save(`oasis_hours_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============================================
// AUTO-GUARDADO
// ============================================

// Auto-guardar cada 30 segundos
setInterval(() => {
    saveToLocalStorage();
}, 30000);

// Guardar antes de cerrar la ventana
window.addEventListener('beforeunload', () => {
    saveToLocalStorage();
});

console.log('Sistema OASIS CREW listo para usar');
