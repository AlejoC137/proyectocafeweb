/**
 * @typedef {Object} Shift
 * @property {string} fecha
 * @property {string} horaInicio
 * @property {string} horaCierre
 */

/**
 * @typedef {Object} BankAccount
 * @property {string} banco
 * @property {string} numero
 * @property {string} tipo
 */

/**
 * @typedef {Object} Employee
 * @property {string} _id
 * @property {string} Nombre
 * @property {string} Apellido
 * @property {string} Cargo
 * @property {string} Celular
 * @property {Shift[]} Turnos - Parsed from JSON string
 * @property {BankAccount} Cuenta - Parsed from JSON string
 * @property {Object} infoContacto - Parsed from JSON string area
 * @property {number} Rate
 * @property {number|string} Propinas
 * @property {boolean} isAdmin
 * @property {boolean} Turno_State
 * @property {boolean} Show
 */

export { };
