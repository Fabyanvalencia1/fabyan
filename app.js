// OASIS CREW - Projected Hours Calculator
// Sistema completo de gestión de horas proyectadas

// Variables globales
let employeeCounter = 0;
let commonEmployees = [];

// Cargar datos desde localStorage al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadCommonEmployees();
    setDefaultWeekDate();
    loadSavedState();
    initializeEventListeners();
});

// Inicializar todos los event listeners
function initializeEventListeners() {
    // Botones principales
    document.getElementById('addEmployee').addEventListener('click', addEmployeeRow);
    document.getElementById('removeEmployee').addEventListener('click', removeLastEmployee);
    document.getElementById('clearAll').addEventListener('click', clearAllEmployees);
    document.getElementById('calculateAll').addEventListener('click', calculateAll);
    document.getElementById('saveTemplate').addEventListener('click', saveTemplate);
    document.getElementById('loadTemplate').addEventListener('click', loadTemplate);
    document.getElementById('printTable').addEventListener('click', printTable);
    document.getElementById('exportTable').addEventListener('click', exportToExcel);
    document.getElementById('generatePDF').addEventListener('click', generatePDF);

    // Modal de empleados
    document.getElementById('manageEmployees').addEventListener('click', openEmployeeModal);
    document.querySelector('.close').addEventListener('click', closeEmployeeModal);
    document.getElementById('closeModal').addEventListener('click', closeEmployeeModal);
    document.getElementById('addNewEmployee').addEventListener('click', addToCommonEmployees);
    document.getElementById('selectAllEmployees').addEventListener('click', selectAllEmployees);
    document.getElementById('deselectAllEmployees').addEventListener('click', deselectAllEmployees);
    document.getElementById('loadSelectedEmployees').addEventListener('click', loadSelectedEmployees);
    document.getElementById('deleteSelectedEmployees').addEventListener('click', deleteSelectedEmployees);

    // Búsqueda de empleados
    document.getElementById('searchEmployee').addEventListener('input', filterEmployees);

    // Cerrar modal al hacer click fuera
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('employeeModal');
        if (event.target === modal) {
            closeEmployeeModal();
        }
    });
}

// Establecer fecha de inicio de semana por defecto (domingo actual o más reciente)
function setDefaultWeekDate() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);
    document.getElementById('weekStartDate').valueAsDate = sunday;
}

// Agregar una nueva fila de empleado
function addEmployeeRow(name = '', department = 'plantacion') {
    employeeCounter++;
    const tbody = document.getElementById('employeeRows');
    const row = document.createElement('tr');
    row.id = `employee-${employeeCounter}`;
    row.className = `dept-${department}`;

    row.innerHTML = `
        <td class="row-number">${employeeCounter}</td>
        <td>
            <input type="text" class="employee-name" value="${name}" placeholder="Nombre del empleado">
        </td>
        <td style="display:none;">
            <select class="department-select" onchange="updateRowDepartment(this)">
                <option value="plantacion" ${department === 'plantacion' ? 'selected' : ''}>Plantación</option>
                <option value="puller" ${department === 'puller' ? 'selected' : ''}>Puller</option>
                <option value="growing" ${department === 'growing' ? 'selected' : ''}>Growing</option>
                <option value="mantenimiento" ${department === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
            </select>
        </td>
        ${generateDayCells()}
        <td class="total">0.00</td>
        <td class="status"><span class="badge badge-success">OK</span></td>
    `;

    tbody.appendChild(row);
    updateRowNumbers();
    saveState();
}

// Generar celdas para cada día de la semana
function generateDayCells() {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    let cells = '';

    days.forEach((day, index) => {
        cells += `
            <td>
                <div class="time-container">
                    <div class="time-row">
                        <label>In:</label>
                        <input type="time" class="time-input time-in" data-day="${index}">
                    </div>
                    <div class="time-row">
                        <label>Out:</label>
                        <input type="time" class="time-input time-out" data-day="${index}">
                    </div>
                    <input type="text" class="day-code" placeholder="Código" maxlength="3">
                </div>
            </td>
        `;
    });

    return cells;
}

// Actualizar la clase de departamento de la fila
function updateRowDepartment(select) {
    const row = select.closest('tr');
    const department = select.value;

    // Remover todas las clases de departamento
    row.classList.remove('dept-plantacion', 'dept-puller', 'dept-growing', 'dept-mantenimiento');

    // Agregar la nueva clase
    row.classList.add(`dept-${department}`);
    saveState();
}

// Eliminar el último empleado
function removeLastEmployee() {
    const tbody = document.getElementById('employeeRows');
    if (tbody.children.length > 0) {
        if (confirm('¿Estás seguro de que deseas eliminar el último empleado?')) {
            tbody.removeChild(tbody.lastElementChild);
            updateRowNumbers();
            saveState();
        }
    }
}

// Limpiar todos los empleados
function clearAllEmployees() {
    if (confirm('¿Estás seguro de que deseas eliminar todos los empleados? Esta acción no se puede deshacer.')) {
        document.getElementById('employeeRows').innerHTML = '';
        employeeCounter = 0;
        document.getElementById('results').classList.add('hidden');
        saveState();
    }
}

// Actualizar los números de fila
function updateRowNumbers() {
    const rows = document.querySelectorAll('#employeeRows tr');
    rows.forEach((row, index) => {
        const numberCell = row.querySelector('.row-number');
        if (numberCell) {
            numberCell.textContent = index + 1;
        }
    });
}

// Calcular horas de un empleado
function calculateEmployeeHours(row) {
    const timeInputs = row.querySelectorAll('.time-in, .time-out');
    let totalHours = 0;

    // Procesar cada día
    for (let i = 0; i < 7; i++) {
        const timeIn = row.querySelector(`.time-in[data-day="${i}"]`);
        const timeOut = row.querySelector(`.time-out[data-day="${i}"]`);

        if (timeIn && timeOut && timeIn.value && timeOut.value) {
            const hoursWorked = calculateHoursBetween(timeIn.value, timeOut.value);
            totalHours += hoursWorked;
        }
    }

    // Restar tiempo de descanso
    const breakTime = parseFloat(document.getElementById('breakTime').value) || 0;
    const breakHours = (breakTime / 60) * countWorkDays(row);
    totalHours -= breakHours;

    return Math.max(0, totalHours);
}

// Calcular horas entre dos tiempos
function calculateHoursBetween(timeIn, timeOut) {
    const [inHour, inMin] = timeIn.split(':').map(Number);
    const [outHour, outMin] = timeOut.split(':').map(Number);

    const inMinutes = inHour * 60 + inMin;
    let outMinutes = outHour * 60 + outMin;

    // Si la hora de salida es menor que la de entrada, asumimos que es al día siguiente
    if (outMinutes < inMinutes) {
        outMinutes += 24 * 60;
    }

    return (outMinutes - inMinutes) / 60;
}

// Contar días trabajados
function countWorkDays(row) {
    let days = 0;
    for (let i = 0; i < 7; i++) {
        const timeIn = row.querySelector(`.time-in[data-day="${i}"]`);
        const timeOut = row.querySelector(`.time-out[data-day="${i}"]`);
        if (timeIn && timeOut && timeIn.value && timeOut.value) {
            days++;
        }
    }
    return days;
}

// Calcular todos los empleados
function calculateAll() {
    const rows = document.querySelectorAll('#employeeRows tr');
    const hourLimit = parseFloat(document.getElementById('hourLimit').value) || 45;

    let totalEmployees = 0;
    let exceedingEmployees = 0;
    let totalHoursAll = 0;
    let departmentStats = {
        plantacion: { total: 0, count: 0, exceeding: 0 },
        puller: { total: 0, count: 0, exceeding: 0 },
        growing: { total: 0, count: 0, exceeding: 0 },
        mantenimiento: { total: 0, count: 0, exceeding: 0 }
    };

    rows.forEach(row => {
        const totalCell = row.querySelector('.total');
        const statusCell = row.querySelector('.status');
        const nameInput = row.querySelector('.employee-name');
        const deptSelect = row.querySelector('.department-select');

        if (nameInput.value.trim() === '') {
            return; // Saltar filas sin nombre
        }

        const totalHours = calculateEmployeeHours(row);
        totalCell.textContent = totalHours.toFixed(2);

        const department = deptSelect ? deptSelect.value : 'plantacion';

        // Actualizar estadísticas
        totalEmployees++;
        totalHoursAll += totalHours;
        departmentStats[department].total += totalHours;
        departmentStats[department].count++;

        // Verificar si excede el límite
        if (totalHours > hourLimit) {
            exceedingEmployees++;
            departmentStats[department].exceeding++;
            statusCell.innerHTML = `<span class="badge badge-danger">EXCEDE (${(totalHours - hourLimit).toFixed(2)}h)</span>`;
            row.classList.add('warning');
        } else {
            statusCell.innerHTML = `<span class="badge badge-success">OK</span>`;
            row.classList.remove('warning');
        }
    });

    // Mostrar resumen
    displaySummary(totalEmployees, exceedingEmployees, totalHoursAll, departmentStats);
    saveState();
}

// Mostrar resumen de resultados
function displaySummary(totalEmployees, exceedingEmployees, totalHours, departmentStats) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');

    document.getElementById('totalEmployees').textContent = totalEmployees;
    document.getElementById('exceedingEmployees').textContent = exceedingEmployees;
    document.getElementById('totalHours').textContent = totalHours.toFixed(2);
    document.getElementById('averageHours').textContent = totalEmployees > 0
        ? (totalHours / totalEmployees).toFixed(2)
        : '0.00';

    // Resumen por departamento
    const deptSummaryDiv = document.getElementById('departmentSummary');
    deptSummaryDiv.innerHTML = '';

    const deptNames = {
        plantacion: 'Plantación',
        puller: 'Puller',
        growing: 'Growing',
        mantenimiento: 'Mantenimiento'
    };

    Object.keys(departmentStats).forEach(dept => {
        const stats = departmentStats[dept];
        if (stats.count > 0) {
            const card = document.createElement('div');
            card.className = 'summary-card';
            card.innerHTML = `
                <h4>${deptNames[dept]}</h4>
                <p><strong>Empleados:</strong> ${stats.count}</p>
                <p><strong>Total horas:</strong> ${stats.total.toFixed(2)}</p>
                <p><strong>Promedio:</strong> ${(stats.total / stats.count).toFixed(2)}</p>
                <p><strong>Exceden límite:</strong> ${stats.exceeding}</p>
            `;
            deptSummaryDiv.appendChild(card);
        }
    });
}

// Guardar plantilla
function saveTemplate() {
    const data = {
        config: {
            hourLimit: document.getElementById('hourLimit').value,
            breakTime: document.getElementById('breakTime').value,
            weekStartDate: document.getElementById('weekStartDate').value
        },
        employees: getEmployeesData()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_template_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Plantilla guardada exitosamente');
}

// Cargar plantilla
function loadTemplate() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);

                // Cargar configuración
                if (data.config) {
                    document.getElementById('hourLimit').value = data.config.hourLimit || 45;
                    document.getElementById('breakTime').value = data.config.breakTime || 30;
                    if (data.config.weekStartDate) {
                        document.getElementById('weekStartDate').value = data.config.weekStartDate;
                    }
                }

                // Limpiar empleados existentes
                document.getElementById('employeeRows').innerHTML = '';
                employeeCounter = 0;

                // Cargar empleados
                if (data.employees && Array.isArray(data.employees)) {
                    data.employees.forEach(emp => {
                        addEmployeeRow(emp.name, emp.department);
                        const lastRow = document.querySelector('#employeeRows tr:last-child');

                        // Cargar horarios
                        emp.schedule.forEach((day, index) => {
                            const timeIn = lastRow.querySelector(`.time-in[data-day="${index}"]`);
                            const timeOut = lastRow.querySelector(`.time-out[data-day="${index}"]`);
                            const code = lastRow.querySelectorAll('.day-code')[index];

                            if (timeIn) timeIn.value = day.timeIn || '';
                            if (timeOut) timeOut.value = day.timeOut || '';
                            if (code) code.value = day.code || '';
                        });
                    });
                }

                alert('Plantilla cargada exitosamente');
                calculateAll();
            } catch (error) {
                alert('Error al cargar la plantilla: ' + error.message);
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

// Obtener datos de todos los empleados
function getEmployeesData() {
    const rows = document.querySelectorAll('#employeeRows tr');
    const employees = [];

    rows.forEach(row => {
        const name = row.querySelector('.employee-name').value;
        const department = row.querySelector('.department-select').value;
        const schedule = [];

        for (let i = 0; i < 7; i++) {
            const timeIn = row.querySelector(`.time-in[data-day="${i}"]`).value;
            const timeOut = row.querySelector(`.time-out[data-day="${i}"]`).value;
            const codes = row.querySelectorAll('.day-code');
            const code = codes[i] ? codes[i].value : '';

            schedule.push({ timeIn, timeOut, code });
        }

        employees.push({ name, department, schedule });
    });

    return employees;
}

// Imprimir tabla
function printTable() {
    // Preparar datos para impresión
    const dateRange = getWeekDateRange();
    document.getElementById('printDateRange').textContent = dateRange;
    document.getElementById('printGeneratedDate').textContent = new Date().toLocaleString('es-ES');

    window.print();
}

// Obtener rango de fechas de la semana
function getWeekDateRange() {
    const startDate = document.getElementById('weekStartDate').value;
    if (!startDate) return 'No especificado';

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return `${start.toLocaleDateString('es-ES', options)} - ${end.toLocaleDateString('es-ES', options)}`;
}

// Exportar a Excel (CSV)
function exportToExcel() {
    let csv = 'Nombre,Departamento,Domingo,Lunes,Martes,Miércoles,Jueves,Viernes,Sábado,Total,Estado\n';

    const rows = document.querySelectorAll('#employeeRows tr');
    rows.forEach(row => {
        const name = row.querySelector('.employee-name').value;
        const department = row.querySelector('.department-select').value;
        const total = row.querySelector('.total').textContent;
        const status = row.querySelector('.status').textContent;

        let rowData = [name, department];

        // Agregar horas de cada día
        for (let i = 0; i < 7; i++) {
            const timeIn = row.querySelector(`.time-in[data-day="${i}"]`).value;
            const timeOut = row.querySelector(`.time-out[data-day="${i}"]`).value;
            const hours = timeIn && timeOut ? calculateHoursBetween(timeIn, timeOut).toFixed(2) : '0';
            rowData.push(hours);
        }

        rowData.push(total, status);
        csv += rowData.map(field => `"${field}"`).join(',') + '\n';
    });

    // Crear y descargar el archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oasis_hours_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Generar PDF
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4');

    // Título
    doc.setFontSize(18);
    doc.text('OASIS CREW - Projected Hours Report', 14, 20);

    // Fecha
    doc.setFontSize(10);
    doc.text(`Período: ${getWeekDateRange()}`, 14, 28);
    doc.text(`Generado: ${new Date().toLocaleString('es-ES')}`, 14, 33);

    // Preparar datos para la tabla
    const rows = document.querySelectorAll('#employeeRows tr');
    const tableData = [];

    rows.forEach(row => {
        const name = row.querySelector('.employee-name').value;
        const dept = row.querySelector('.department-select').value;
        const total = row.querySelector('.total').textContent;
        const status = row.querySelector('.status').textContent;

        const rowData = [name, dept];

        // Agregar horas de cada día
        for (let i = 0; i < 7; i++) {
            const timeIn = row.querySelector(`.time-in[data-day="${i}"]`).value;
            const timeOut = row.querySelector(`.time-out[data-day="${i}"]`).value;
            const hours = timeIn && timeOut ? calculateHoursBetween(timeIn, timeOut).toFixed(2) : '-';
            rowData.push(hours);
        }

        rowData.push(total, status);
        tableData.push(rowData);
    });

    // Crear tabla
    doc.autoTable({
        startY: 38,
        head: [['Nombre', 'Depto', 'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Total', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 25 }
        }
    });

    // Guardar PDF
    doc.save(`oasis_hours_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ============= GESTIÓN DE EMPLEADOS COMUNES =============

// Abrir modal de empleados
function openEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'block';
    renderEmployeeList();
}

// Cerrar modal de empleados
function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

// Cargar empleados comunes desde localStorage
function loadCommonEmployees() {
    const stored = localStorage.getItem('oasisCommonEmployees');
    if (stored) {
        try {
            commonEmployees = JSON.parse(stored);
        } catch (e) {
            commonEmployees = [];
        }
    }
}

// Guardar empleados comunes en localStorage
function saveCommonEmployees() {
    localStorage.setItem('oasisCommonEmployees', JSON.stringify(commonEmployees));
}

// Agregar empleado a la lista común
function addToCommonEmployees() {
    const nameInput = document.getElementById('newEmployeeName');
    const deptSelect = document.getElementById('newEmployeeDept');

    const name = nameInput.value.trim();
    const department = deptSelect.value;

    if (!name) {
        alert('Por favor ingresa el nombre del empleado');
        return;
    }

    // Verificar si ya existe
    const exists = commonEmployees.some(emp =>
        emp.name.toLowerCase() === name.toLowerCase()
    );

    if (exists) {
        alert('Este empleado ya existe en la lista');
        return;
    }

    commonEmployees.push({
        id: Date.now(),
        name: name,
        department: department,
        selected: false
    });

    saveCommonEmployees();
    renderEmployeeList();

    // Limpiar campos
    nameInput.value = '';
    deptSelect.value = 'plantacion';

    alert('Empleado agregado exitosamente');
}

// Renderizar lista de empleados
function renderEmployeeList() {
    const container = document.getElementById('employeeListContainer');
    container.innerHTML = '';

    if (commonEmployees.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#999;padding:20px;">No hay empleados en la lista común. Agrega el primero usando el formulario arriba.</p>';
        return;
    }

    commonEmployees.forEach((emp, index) => {
        const item = document.createElement('div');
        item.className = 'employee-item';
        item.dataset.employeeId = emp.id;

        item.innerHTML = `
            <div class="employee-info">
                <input type="checkbox" class="employee-checkbox" data-index="${index}" ${emp.selected ? 'checked' : ''}>
                <input type="text" value="${emp.name}" onchange="updateEmployeeName(${index}, this.value)">
                <select onchange="updateEmployeeDept(${index}, this.value)">
                    <option value="plantacion" ${emp.department === 'plantacion' ? 'selected' : ''}>Plantación</option>
                    <option value="puller" ${emp.department === 'puller' ? 'selected' : ''}>Puller</option>
                    <option value="growing" ${emp.department === 'growing' ? 'selected' : ''}>Growing</option>
                    <option value="mantenimiento" ${emp.department === 'mantenimiento' ? 'selected' : ''}>Mantenimiento</option>
                </select>
            </div>
            <div class="employee-actions">
                <button class="btn-remove" onclick="removeCommonEmployee(${index})">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;

        container.appendChild(item);
    });

    // Agregar event listeners a los checkboxes
    document.querySelectorAll('.employee-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            commonEmployees[index].selected = this.checked;
            saveCommonEmployees();
        });
    });
}

// Actualizar nombre de empleado
function updateEmployeeName(index, newName) {
    commonEmployees[index].name = newName;
    saveCommonEmployees();
}

// Actualizar departamento de empleado
function updateEmployeeDept(index, newDept) {
    commonEmployees[index].department = newDept;
    saveCommonEmployees();
}

// Eliminar empleado de la lista común
function removeCommonEmployee(index) {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${commonEmployees[index].name}?`)) {
        commonEmployees.splice(index, 1);
        saveCommonEmployees();
        renderEmployeeList();
    }
}

// Seleccionar todos los empleados
function selectAllEmployees() {
    commonEmployees.forEach(emp => emp.selected = true);
    saveCommonEmployees();
    renderEmployeeList();
}

// Deseleccionar todos los empleados
function deselectAllEmployees() {
    commonEmployees.forEach(emp => emp.selected = false);
    saveCommonEmployees();
    renderEmployeeList();
}

// Cargar empleados seleccionados a la tabla
function loadSelectedEmployees() {
    const selected = commonEmployees.filter(emp => emp.selected);

    if (selected.length === 0) {
        alert('No hay empleados seleccionados');
        return;
    }

    selected.forEach(emp => {
        addEmployeeRow(emp.name, emp.department);
    });

    closeEmployeeModal();
    alert(`${selected.length} empleado(s) agregado(s) exitosamente`);
}

// Eliminar empleados seleccionados
function deleteSelectedEmployees() {
    const selected = commonEmployees.filter(emp => emp.selected);

    if (selected.length === 0) {
        alert('No hay empleados seleccionados');
        return;
    }

    if (confirm(`¿Estás seguro de que deseas eliminar ${selected.length} empleado(s)?`)) {
        commonEmployees = commonEmployees.filter(emp => !emp.selected);
        saveCommonEmployees();
        renderEmployeeList();
        alert('Empleados eliminados exitosamente');
    }
}

// Filtrar empleados por búsqueda
function filterEmployees() {
    const searchTerm = document.getElementById('searchEmployee').value.toLowerCase();
    const items = document.querySelectorAll('.employee-item');

    items.forEach(item => {
        const name = item.querySelector('input[type="text"]').value.toLowerCase();
        if (name.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// ============= PERSISTENCIA DE DATOS =============

// Guardar estado actual
function saveState() {
    const state = {
        config: {
            hourLimit: document.getElementById('hourLimit').value,
            breakTime: document.getElementById('breakTime').value,
            weekStartDate: document.getElementById('weekStartDate').value
        },
        employees: getEmployeesData(),
        counter: employeeCounter
    };

    localStorage.setItem('oasisCurrentState', JSON.stringify(state));
}

// Cargar estado guardado
function loadSavedState() {
    const stored = localStorage.getItem('oasisCurrentState');
    if (!stored) return;

    try {
        const state = JSON.parse(stored);

        // Cargar configuración
        if (state.config) {
            document.getElementById('hourLimit').value = state.config.hourLimit || 45;
            document.getElementById('breakTime').value = state.config.breakTime || 30;
            if (state.config.weekStartDate) {
                document.getElementById('weekStartDate').value = state.config.weekStartDate;
            }
        }

        // Cargar empleados
        if (state.employees && Array.isArray(state.employees)) {
            state.employees.forEach(emp => {
                addEmployeeRow(emp.name, emp.department);
                const lastRow = document.querySelector('#employeeRows tr:last-child');

                // Cargar horarios
                emp.schedule.forEach((day, index) => {
                    const timeIn = lastRow.querySelector(`.time-in[data-day="${index}"]`);
                    const timeOut = lastRow.querySelector(`.time-out[data-day="${index}"]`);
                    const codes = lastRow.querySelectorAll('.day-code');

                    if (timeIn) timeIn.value = day.timeIn || '';
                    if (timeOut) timeOut.value = day.timeOut || '';
                    if (codes[index]) codes[index].value = day.code || '';
                });
            });
        }

        if (state.counter) {
            employeeCounter = state.counter;
        }

    } catch (error) {
        console.error('Error al cargar estado guardado:', error);
    }
}

// Auto-guardar cada vez que se modifica un campo
document.addEventListener('input', function(e) {
    if (e.target.matches('.employee-name, .time-input, .day-code, .department-select, #hourLimit, #breakTime, #weekStartDate')) {
        saveState();
    }
});

// Exponer funciones globales necesarias
window.updateRowDepartment = updateRowDepartment;
window.updateEmployeeName = updateEmployeeName;
window.updateEmployeeDept = updateEmployeeDept;
window.removeCommonEmployee = removeCommonEmployee;
