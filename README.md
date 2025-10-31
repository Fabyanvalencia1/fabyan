# OASIS CREW - Projected Hours Calculator

Sistema completo y mejorado para la gestión y cálculo de horas proyectadas del personal de OASIS CREW.

## 🌟 Características Principales

### 📊 Gestión de Empleados
- **Agregar/Eliminar empleados** individualmente o en lote
- **Base de datos de empleados comunes** con persistencia en localStorage
- **Búsqueda y filtrado** de empleados
- **Selección múltiple** para carga rápida
- **Departamentos**: Plantación, Puller, Growing, Mantenimiento

### ⏰ Cálculo de Horas
- **Entrada/Salida por día** (Domingo a Sábado)
- **Cálculo automático** de horas trabajadas
- **Tiempo de descanso configurable**
- **Límite de horas configurable**
- **Códigos de día** personalizables
- **Alertas** para empleados que exceden el límite

### 📈 Reportes y Análisis
- **Resumen general**: Total empleados, horas proyectadas, promedios
- **Resumen por departamento**: Estadísticas individuales
- **Identificación visual** de empleados que exceden límites
- **Colores por departamento** para fácil identificación

### 💾 Guardado y Exportación
- **Auto-guardado** en localStorage
- **Guardar/Cargar plantillas** en formato JSON
- **Exportar a Excel** (CSV)
- **Generar PDF** con tabla completa
- **Imprimir** con formato optimizado

### 🎨 Interfaz Moderna
- Diseño responsive y profesional
- Gradientes y sombras modernas
- Efectos hover y transiciones suaves
- Modal interactivo para gestión de empleados
- Badges de estado coloridos
- Cards de resumen con grid responsive

## 🚀 Cómo Usar

1. **Abrir el archivo `index.html`** en un navegador web moderno
2. **Configurar parámetros**:
   - Límite de horas (default: 45)
   - Tiempo de descanso (default: 30 min)
   - Fecha de inicio de semana

3. **Agregar empleados**:
   - Usar el botón "Agregar Empleado" para uno individual
   - Usar "Administrar Empleados" para gestionar lista común y cargar múltiples

4. **Ingresar horarios**:
   - Para cada día, ingresar hora de entrada y salida
   - Opcionalmente agregar código de día

5. **Calcular**:
   - Hacer clic en "Calcular Todos"
   - Ver resumen general y por departamento

6. **Exportar**:
   - Guardar plantilla para uso futuro
   - Exportar a Excel o PDF
   - Imprimir directamente

## 📋 Tecnologías

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos con Flexbox y Grid
- **JavaScript (Vanilla)** - Lógica completa sin dependencias
- **jsPDF** - Generación de PDFs
- **html2canvas** - Captura de elementos HTML
- **Font Awesome** - Iconos modernos
- **localStorage API** - Persistencia de datos

## 💡 Funcionalidades Avanzadas

### Sistema de Persistencia
- Todos los datos se guardan automáticamente en localStorage
- Al recargar la página, se restaura el estado anterior
- Gestión separada de empleados comunes y estado actual

### Modal de Empleados
- CRUD completo de empleados comunes
- Búsqueda en tiempo real
- Edición inline de nombres y departamentos
- Selección múltiple con checkboxes
- Carga masiva a la tabla principal

### Cálculos Inteligentes
- Detección automática de turnos nocturnos (cuando salida < entrada)
- Descuento automático de tiempo de descanso proporcional
- Validación de límites configurables
- Conteo de días trabajados

## 🎯 Casos de Uso

1. **Planificación semanal**: Proyectar horas antes de asignar turnos
2. **Control de overtime**: Identificar empleados cerca del límite
3. **Reportes gerenciales**: Exportar datos para análisis
4. **Auditoría**: Mantener registro de proyecciones
5. **Optimización de recursos**: Balancear carga entre departamentos

## 📝 Notas

- Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge)
- No requiere instalación ni servidor
- Todos los datos se almacenan localmente en el navegador
- Diseño optimizado para impresión

## 🔒 Privacidad

- Todos los datos se guardan localmente en tu navegador
- No se envía información a servidores externos
- Control total sobre tus datos

---

**Desarrollado para OASIS CREW** 🌴
Versión Mejorada - 2024
