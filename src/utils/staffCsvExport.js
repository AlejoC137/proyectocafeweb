/**
 * Utilidades para exportar datos de empleados (Staff) a formato CSV.
 */

export const parseFlexibleObject = (value) => {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string') return {};

  const trimmed = value.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      let cleaned = trimmed;
      if (
        (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
        (cleaned.startsWith('"') && cleaned.endsWith('"'))
      ) {
        cleaned = cleaned.slice(1, -1);
      }
      const jsonString = cleaned
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  }
};

export const parseFlexibleArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
};

const escapeCsvCell = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const sanitizeFilenamePart = (text) => {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
};

const formatPropinasValue = (propinas) => {
  if (propinas === null || propinas === undefined || propinas === '') return 0;
  if (typeof propinas === 'number') return propinas;
  if (typeof propinas === 'string') {
    const num = Number(propinas);
    if (!Number.isNaN(num)) return num;
    const arr = parseFlexibleArray(propinas);
    if (arr.length > 0) {
      return arr.reduce((acc, item) => acc + (Number(item?.monto ?? item?.valor ?? item) || 0), 0);
    }
    return propinas;
  }
  if (Array.isArray(propinas)) {
    return propinas.reduce((acc, item) => acc + (Number(item?.monto ?? item?.valor ?? item) || 0), 0);
  }
  return 0;
};

const CSV_HEADERS = [
  'ID',
  'Nombre',
  'Apellido',
  'CC',
  'Cargo',
  'Estado',
  'Tarifa Hora (Rate)',
  'Celular',
  'Dirección',
  'Banco',
  'Tipo Cuenta',
  'Número Cuenta',
  'Contacto Emergencia',
  'Teléfono Emergencia',
  'Propinas',
  'Total Turnos Registrados',
  'Es Admin',
  'Mostrar en Nómina',
];

const employeeToRow = (emp) => {
  const cuenta = parseFlexibleObject(emp.Cuenta);
  const infoContacto = parseFlexibleObject(emp.infoContacto);
  const turnos = parseFlexibleArray(emp.Turnos);
  const isActivo = emp.Contratacion !== false && emp.Contratacion !== 'false';

  return [
    emp._id ?? '',
    emp.Nombre ?? '',
    emp.Apellido ?? '',
    emp.CC ?? '',
    emp.Cargo ?? '',
    isActivo ? 'Activo' : 'Inactivo',
    emp.Rate ?? 0,
    emp.Celular ?? '',
    emp.Direccion ?? '',
    cuenta.banco ?? '',
    cuenta.tipo ?? '',
    cuenta.numero ?? '',
    infoContacto.nombreDeContacto ?? '',
    infoContacto.numeroDeContacto ?? '',
    formatPropinasValue(emp.Propinas),
    turnos.length,
    emp.isAdmin ? 'Sí' : 'No',
    emp.Show === false ? 'No' : 'Sí',
  ];
};

const triggerCsvDownload = (csvContent, filename) => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportStaffToCSV = (employeesList, filenamePrefix = 'staff_todos') => {
  if (!Array.isArray(employeesList) || employeesList.length === 0) return false;

  const lines = [
    CSV_HEADERS.map(escapeCsvCell).join(','),
    ...employeesList.map((emp) => employeeToRow(emp).map(escapeCsvCell).join(',')),
  ];

  const today = new Date().toISOString().split('T')[0];
  const filename = `${sanitizeFilenamePart(filenamePrefix) || 'staff'}_${today}.csv`;
  triggerCsvDownload(lines.join('\r\n'), filename);
  return true;
};

export const exportSingleStaffToCSV = (employee) => {
  if (!employee) return false;
  const fullName = [employee.Nombre, employee.Apellido].filter(Boolean).join('_') || employee.CC || employee._id;
  return exportStaffToCSV([employee], `staff_${fullName}`);
};
