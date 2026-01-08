import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Se actualiza la importación para usar getAllFromTable
import { crearStaff, updateItem, deleteItem, getAllFromTable, } from "../../../redux/actions-Proveedores";
import { ROLES } from "../../../redux/actions-types";

// --- Funciones de Ayuda para Formateo y Parseo ---

// Convierte un array de objetos de propinas al formato de texto específico
const formatPropinasToString = (propinasArray) => {
  if (!propinasArray || propinasArray.length === 0) return "";
  const propinasStrings = propinasArray.map(p =>
    `  {\n    tipDia: "${p.tipDia || ''}",\n    tipHora: "${p.tipHora || ''}",\n    tipMonto: ${p.tipMonto || 0}\n  }`
  );
  return `[\n${propinasStrings.join(',\n')}\n]`;
};

// Convierte un array de objetos de turnos al formato de texto específico
const formatTurnosToString = (turnosArray) => {
  if (!turnosArray || turnosArray.length === 0) return "";
  const turnosStrings = turnosArray.map(t =>
    `  {\n    turnoDate: "${t.turnoDate || ''}",\n    horaInicio: "${t.horaInicio || ''}",\n    horaSalida: "${t.horaSalida || ''}"\n  }`
  );
  return `[\n${turnosStrings.join(',\n')}\n]`;
};

// Parsea el texto de propinas a un array de objetos
const parsePropinasFromString = (text) => {
  if (typeof text !== 'string' || !text.trim()) return [];
  try {
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      const sanitizedJson = text.replace(/'/g, '"');
      return JSON.parse(sanitizedJson);
    }
  } catch (e) {
    console.warn("El parseo JSON de Propinas falló, intentando con Regex. String original:", text);
  }
  try {
    const objects = [];
    const objectRegex = /{\s*tipDia:\s*"([^"]*)",\s*tipHora:\s*"([^"]*)",\s*tipMonto:\s*(\d+)\s*}/g;
    let match;
    while ((match = objectRegex.exec(text)) !== null) {
      objects.push({
        tipDia: match[1],
        tipHora: match[2],
        tipMonto: parseInt(match[3], 10),
      });
    }
    return objects;
  } catch (error) {
    console.error("Error al parsear propinas con Regex:", error);
    return [];
  }
};

// Parsea el texto de turnos a un array de objetos
const parseTurnosFromString = (text) => {
  if (typeof text !== 'string' || !text.trim()) return [];
  try {
    if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
      const sanitizedJson = text.replace(/'/g, '"');
      return JSON.parse(sanitizedJson);
    }
  } catch (e) {
    console.warn("El parseo JSON de Turnos falló, intentando con Regex. String original:", text);
  }
  try {
    const objects = [];
    const objectRegex = /{\s*turnoDate:\s*"([^"]*)",\s*horaInicio:\s*"([^"]*)",\s*horaSalida:\s*"([^"]*)"\s*}/g;
    let match;
    while ((match = objectRegex.exec(text)) !== null) {
      objects.push({
        turnoDate: match[1],
        horaInicio: match[2],
        horaSalida: match[3],
      });
    }
    return objects;
  } catch (error) {
    console.error("Error al parsear turnos con Regex:", error);
    return [];
  }
};

// Convierte un objeto a su formato de texto específico
const formatObjectToString = (obj) => {
  if (!obj || Object.values(obj).every(v => v === "")) return "";
  const content = Object.entries(obj)
    .map(([key, value]) => `    ${key}: "${value}"`)
    .join(',\n');
  return `{\n${content}\n  }`;
};

// Parsea un texto de objeto a un objeto
const parseObjectFromString = (text) => {
  if (typeof text !== 'string' || !text.trim().startsWith('{')) {
    return {};
  }
  try {
    // Intenta un parseo JSON directo por si el formato es válido
    return JSON.parse(text);
  } catch (e) {
    // Si falla, usa un método de Regex como fallback
    try {
      const obj = {};
      const propertyRegex = /(\w+):\s*"([^"]*)"/g;
      let match;
      while ((match = propertyRegex.exec(text)) !== null) {
        obj[match[1]] = match[2];
      }
      return obj;
    } catch (error) {
      console.error("Error al parsear objeto con Regex:", error);
      return {};
    }
  }
};

// --- Estado Inicial basado en la estructura anidada del JSON ---
const initialState = {
  Nombre: "",
  Apellido: "",
  Cargo: "",
  Cuenta: {
    banco: "",
    tipo: "",
    numero: "",
  },
  CC: 0,
  Celular: "",
  Direccion: "",
  infoContacto: {
    nombreDeContacto: "",
    numeroDeContacto: "",
  },
  Propinas: [],
  Turnos: [],
  Turno_State: false,
  Rate: 0,
  Show: false,
  Contratacion: false,
  isAdmin: false,
};

function StaffCreator() {
  const dispatch = useDispatch();
  const allStaff = useSelector((state) => state.allStaff || []);
  const [formData, setFormData] = useState(initialState);
  const [editing, setEditing] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasOpenedTerms, setHasOpenedTerms] = useState(false);

  useEffect(() => {
    dispatch(getAllFromTable("Staff"));
  }, [dispatch]);

  const handleAdminChange = (e) => {
    const { checked } = e.target;
    if (checked) {
      const password = window.prompt("Ingrese la contraseña de administrador:");
      if (password === import.meta.env.VITE_ADMIN_PIN) {
        setFormData(prev => ({ ...prev, isAdmin: true }));
      } else {
        alert("Contraseña incorrecta");
      }
    } else {
      setFormData(prev => ({ ...prev, isAdmin: false }));
    }
  };

  const handleSimpleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : (type === "number" ? (value === "" ? "" : parseFloat(value)) : value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleNestedChange = (objectName, e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [objectName]: {
        ...prev[objectName],
        [name]: value
      }
    }));
  };

  const handleArrayItemChange = (arrayName, index, e) => {
    const { name, value } = e.target;
    const newArray = [...formData[arrayName]];
    newArray[index] = { ...newArray[index], [name]: value };
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const addArrayItem = (arrayName, newItem) => {
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], newItem] }));
  };

  const removeArrayItem = (arrayName, index) => {
    const newArray = formData[arrayName].filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, [arrayName]: newArray }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      Propinas: formatPropinasToString(formData.Propinas),
      Turnos: formatTurnosToString(formData.Turnos),
      Cuenta: formatObjectToString(formData.Cuenta),
      infoContacto: formatObjectToString(formData.infoContacto),
    };

    try {
      if (editing) {
        await dispatch(updateItem(editing, payload, "Staff"));
        alert("Staff actualizado correctamente");
      } else {
        await dispatch(crearStaff(payload, "Staff"));
        alert("Staff creado correctamente");
      }
      setFormData(initialState);
      setEditing(null);
    } catch (error) {
      console.error("Error al guardar el staff:", error);
      alert("Error al guardar el staff.");
    }
  };

  const handleEdit = (staff) => {
    setFormData({
      ...initialState,
      ...staff,
      Propinas: parsePropinasFromString(staff.Propinas),
      Turnos: parseTurnosFromString(staff.Turnos),
      Cuenta: typeof staff.Cuenta === "string"
        ? { ...initialState.Cuenta, ...parseObjectFromString(staff.Cuenta) }
        : { ...initialState.Cuenta, ...staff.Cuenta },
      infoContacto: typeof staff.infoContacto === "string"
        ? { ...initialState.infoContacto, ...parseObjectFromString(staff.infoContacto) }
        : { ...initialState.infoContacto, ...staff.infoContacto },
    });
    setEditing(staff._id);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar a este miembro del personal?")) {
      await dispatch(deleteItem(id, "Staff"));
    }
  };

  return (
    <div className="p-4 md:p-6 w-screen justify-center  align-center bg-gray-50 rounded-lg shadow-md mb-6">

      <div className="ml-32  mr-32">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{editing ? "Editando Staff" : "Crear Nuevo Staff"}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Sección de Datos Personales --- */}
          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Nombre:</label><Input required name="Nombre" value={formData.Nombre} onChange={handleSimpleChange} /></div>
              <div><label className="text-sm font-medium">Apellido:</label><Input required name="Apellido" value={formData.Apellido} onChange={handleSimpleChange} /></div>
              <div><label className="text-sm font-medium" style={{ color: '#374151', fontFamily: 'Arial, sans-serif' }}>Cargo:</label>
                <select
                  name="Cargo"
                  value={formData.Cargo}
                  onChange={handleSimpleChange}
                  style={{
                    width: '100%',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    padding: '8px',
                    backgroundColor: '#FFFFFF',
                    color: '#000000',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px'
                  }}
                  required
                >
                  <option value="" style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>Seleccione un cargo</option>
                  {Array.isArray(ROLES)
                    ? ROLES.map((rol) => (
                      <option key={rol} value={rol} style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>{rol}</option>
                    ))
                    : Object.values(ROLES).map((rol) => (
                      <option key={rol} value={rol} style={{ backgroundColor: '#FFFFFF', color: '#000000' }}>{rol}</option>
                    ))
                  }
                </select>
              </div>
              <div><label className="text-sm font-medium">CC:</label><Input type="number" name="CC" value={formData.CC} onChange={handleSimpleChange} /></div>
              <div><label className="text-sm font-medium">Celular:</label><Input name="Celular" value={formData.Celular} onChange={handleSimpleChange} /></div>
              <div><label className="text-sm font-medium">Dirección:</label><Input name="Direccion" value={formData.Direccion} onChange={handleSimpleChange} /></div>
              <div><label className="text-sm font-medium">Rate:</label><Input type="number" name="Rate" value={formData.Rate} onChange={handleSimpleChange} /></div>
            </div>
          </div>

          {/* --- Sección de Cuenta Bancaria --- */}
          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Información Bancaria</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-sm font-medium">Banco:</label><Input name="banco" value={formData.Cuenta.banco} onChange={(e) => handleNestedChange('Cuenta', e)} /></div>
              <div><label className="text-sm font-medium">Tipo de Cuenta:</label><Input name="tipo" value={formData.Cuenta.tipo} onChange={(e) => handleNestedChange('Cuenta', e)} /></div>
              <div><label className="text-sm font-medium">Número de Cuenta:</label><Input name="numero" value={formData.Cuenta.numero} onChange={(e) => handleNestedChange('Cuenta', e)} /></div>
            </div>
          </div>

          {/* --- Sección de Contacto de Emergencia --- */}
          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Información de Contacto de Emergencia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-sm font-medium">Nombre de Contacto:</label><Input name="nombreDeContacto" value={formData.infoContacto.nombreDeContacto} onChange={(e) => handleNestedChange('infoContacto', e)} /></div>
              <div><label className="text-sm font-medium">Número de Contacto:</label><Input name="numeroDeContacto" value={formData.infoContacto.numeroDeContacto} onChange={(e) => handleNestedChange('infoContacto', e)} /></div>
            </div>
          </div>

          {/* --- Sección de Propinas --- */}
          {/* <div className="p-4 border rounded-lg bg-white"> */}
          {/* <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Propinas</h3>
                <Button type="button" onClick={() => addArrayItem('Propinas', { tipDia: '', tipHora: '', tipMonto: 0 })}>+ Agregar Propina</Button>
            </div> */}
          {/* <div className="space-y-3">
                {formData.Propinas.map((propina, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-2 border rounded items-center">
                        <Input name="tipDia" type="date" value={propina.tipDia} placeholder="Fecha" onChange={(e) => handleArrayItemChange('Propinas', index, e)} />
                        <Input name="tipHora" type="time" value={propina.tipHora} placeholder="Hora" onChange={(e) => handleArrayItemChange('Propinas', index, e)} />
                        <Input name="tipMonto" type="number" value={propina.tipMonto} placeholder="Monto" onChange={(e) => handleArrayItemChange('Propinas', index, e)} />
                        <Button type="button" onClick={() => removeArrayItem('Propinas', index)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
                    </div>
                ))}
            </div> */}
          {/* </div> */}

          {/* --- Sección de Turnos --- */}
          {/* <div className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Turnos</h3>
                <Button type="button" onClick={() => addArrayItem('Turnos', { turnoDate: '', horaInicio: '', horaSalida: '' })}>+ Agregar Turno</Button>
            </div>
            <div className="space-y-3">
                {formData.Turnos.map((turno, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-2 border rounded items-center">
                        <Input name="turnoDate" type="date" value={turno.turnoDate} placeholder="Fecha" onChange={(e) => handleArrayItemChange('Turnos', index, e)} />
                        <Input name="horaInicio" type="time" value={turno.horaInicio} placeholder="Hora Inicio" onChange={(e) => handleArrayItemChange('Turnos', index, e)} />
                        <Input name="horaSalida" type="time" value={turno.horaSalida} placeholder="Hora Salida" onChange={(e) => handleArrayItemChange('Turnos', index, e)} />
                        <Button type="button" onClick={() => removeArrayItem('Turnos', index)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
                    </div>
                ))}
            </div>
        </div>
         */}
          {/* --- Sección de Configuración --- */}
          <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Configuración</h3>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-2"><Input type="checkbox" name="Show" checked={formData.Show} onChange={handleSimpleChange} className="h-4 w-4" /><label>Show</label></div>
              <div className="flex items-center gap-2"><Input type="checkbox" name="Contratacion" checked={formData.Contratacion} onChange={handleSimpleChange} className="h-4 w-4" /><label>Contratación Activa</label></div>
              <div className="flex items-center gap-2"><Input type="checkbox" name="isAdmin" checked={formData.isAdmin} onChange={handleAdminChange} className="h-4 w-4" /><label>Es Administrador</label></div>
              <div className="flex items-center gap-2">
                {/* <Input type="checkbox" name="Turno_State" checked={formData.Turno_State} onChange={handleSimpleChange} className="h-4 w-4"/> */}
                {/* <label>Turno Activo</label> */}
              </div>
            </div>
          </div>

          {/* --- Sección de Términos y Condiciones --- */}
          <div className="p-4 border rounded-lg bg-white mt-4">
            <h3 className="text-lg font-semibold mb-2">Términos y Condiciones</h3>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                onClick={() => setShowTerms(true)}
                className="bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Leer Términos y Condiciones
              </Button>

              <div className="flex items-center gap-2">
                <Input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={!hasOpenedTerms} // Obliga a abrir los términos al menos una vez
                  className="h-4 w-4"
                />
                <label htmlFor="terms" className={`text-sm ${!hasOpenedTerms ? 'text-gray-400' : 'text-gray-700'}`}>
                  Acepto los términos y condiciones
                </label>
              </div>
            </div>
            {!hasOpenedTerms && (
              <p className="text-xs text-red-500 mt-1">Debe leer los términos y condiciones para aceptar.</p>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              type="submit"
              disabled={!termsAccepted}
              className={`font-bold py-2 px-4 rounded text-white ${termsAccepted ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {editing ? "Actualizar Staff" : "Guardar Staff"}
            </Button>
            {editing && <Button type="button" onClick={() => { setEditing(null); setFormData(initialState); }} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancelar Edición</Button>}
          </div>
        </form>

        {/* --- Modal de Términos y Condiciones --- */}
        {showTerms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
              <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h3 className="text-xl font-bold">Documentación de Términos y Condiciones</h3>
                <button
                  onClick={() => { setShowTerms(false); setHasOpenedTerms(true); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-grow text-gray-700 text-sm leading-relaxed space-y-4">
                <h2 className="text-xl font-bold text-center mb-4">ACUERDO DE VINCULACIÓN DE CONTRATISTA INDEPENDIENTE Y TÉRMINOS DEL SERVICIO</h2>

                <p className="text-xs text-gray-500 mb-4">
                  <strong>REFERENCIA LEGAL:</strong> Código Civil Colombiano (Arts. 1495, 2063), Código de Comercio (Art. 968), Ley 1562 de 2012 (Sistema General de Riesgos Laborales) y Decreto 1072 de 2015.
                </p>

                <p>
                  Este documento actúa como un contrato de adhesión simplificado para la prestación de servicios independientes. Al marcar las casillas y firmar (digital o físicamente), EL CONTRATISTA acepta que su relación con EL CONTRATANTE (quien requiere el servicio) se rige estrictamente por las siguientes cláusulas:
                </p>

                <div className="space-y-4">
                  <section>
                    <h3 className="font-bold text-lg mb-2">1. NATURALEZA CIVIL Y AUTONOMÍA TÉCNICA</h3>
                    <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-2">
                      <p className="text-blue-800 font-medium">Importante: Las partes declaran expresamente que este acuerdo es de naturaleza CIVIL/COMERCIAL y NO genera vínculo laboral, ni subordinación jurídica, ni prestaciones sociales a cargo directo del contratante, salvo lo pactado en la tarifa.</p>
                    </div>
                    <ul className="list-none space-y-2 pl-2">
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>ACEPTO LA INDEPENDENCIA:</strong> Reconozco que prestaré mis servicios (ya sean de consultoría, preparación de alimentos, servicio a la mesa, limpieza o diseño gráfico) con total autonomía técnica y administrativa. Entiendo que <strong>EL CONTRATANTE no es mi empleador</strong>, sino mi cliente/aliado comercial.</span>
                      </li>
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>ACEPTO EL MODELO POR RESULTADOS:</strong> Entiendo que mi contratación no es por tiempo (cumplimiento de horario), sino por <strong>producto, entregable u obra terminada</strong>. EL CONTRATANTE tiene la facultad de exigir la entrega en fechas y calidades específicas, pero no de imponer un horario de entrada y salida fijo, salvo la coordinación necesaria para eventos o entregas puntuales.</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-2">2. LUGAR DE EJECUCIÓN Y DELIMITACIÓN DE RIESGOS</h3>
                    <ul className="list-none space-y-2 pl-2">
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>ACEPTO LAS CONDICIONES DEL LUGAR:</strong> Reconozco que las actividades se desarrollarán principalmente en las instalaciones del proyecto (ej. "Proyecto Café"). Entiendo que este es un <strong>espacio común de desarrollo de actividades</strong> y no una sede patronal bajo custodia estricta.</span>
                      </li>
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>CLÁUSULA DE INDEMNIDAD Y AUTOCUIDADO:</strong> Exonero a EL CONTRATANTE de responsabilidad por accidentes ocurridos dentro de las instalaciones que sean derivados de mi propia actividad o descuido. Declaro que no poseo restricciones médicas preexistentes que me impidan ejecutar la labor y asumo la responsabilidad total de mi estado de salud físico y psicológico.</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-2">3. VALOR, AUMENTO LEGAL Y SEGURIDAD SOCIAL</h3>
                    <p className="mb-2">El pago se realizará bajo la modalidad de <strong>HONORARIOS</strong> o <strong>CUENTA DE COBRO</strong>, calculados sobre la labor realizada.</p>
                    <ul className="list-none space-y-2 pl-2">
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>ACEPTO EL ESQUEMA DE PAGO:</strong> Los honorarios incluyen un <strong>valor base pactado + un aumento (entre el 16% y 20%)</strong> destinado exclusivamente a subsidiar mi carga prestacional.</span>
                      </li>
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>RESPONSABILIDAD DE SEGURIDAD SOCIAL:</strong> Declaro que, al recibir este aumento porcentual en mi tarifa, <strong>soy el único responsable de afiliarme y cotizar</strong> a Salud (EPS), Pensión y Riesgos Laborales (ARL) como independiente, según la Ley 1122 de 2007 y normas concordantes.</span>
                      </li>
                      <li className="ml-6 text-xs text-gray-500 italic">
                        Nota: Entiendo que si incumplo con mi pago de seguridad social, EL CONTRATANTE queda eximido de cualquier responsabilidad solidaria ante accidentes o enfermedades.
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-2">4. REGISTRO DE ACTIVIDADES Y PERIODICIDAD DE PAGO</h3>
                    <ul className="list-none space-y-2 pl-2">
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>ACEPTO EL SISTEMA DE REGISTRO:</strong> Los pagos se harán <strong>QUINCENALMENTE</strong>. Acepto que el pago depende exclusivamente de las horas/obras registradas en el sistema designado. <strong>"Hora no registrada, es hora no pagada"</strong>.</span>
                      </li>
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>COMPROMISO DE ACTUALIZACIÓN:</strong> Me comprometo a conciliar semanalmente mis actividades con EL CONTRATANTE para evitar discrepancias en el cobro quincenal.</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="font-bold text-lg mb-2">5. NOVEDADES Y TIEMPOS DE ENTREGA</h3>
                    <ul className="list-none space-y-2 pl-2">
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>ACEPTO LOS TIEMPOS DE PREAVISO:</strong> Si debo ausentarme o reprogramar una entrega o servicio pactado, me comprometo a avisar con una antelación razonable (idealmente <strong>2 días</strong>). Entiendo que solo se aceptarán excepciones por fuerza mayor o caso fortuito demostrable (según Art. 64 Código Civil).</span>
                      </li>
                      <li className="flex gap-2">
                        <input type="checkbox" disabled checked className="mt-1" />
                        <span><strong>CUMPLIMIENTO DE ENTREGABLES:</strong> Reconozco que EL CONTRATANTE tiene la facultad de exigir el cumplimiento estricto de los "Deadlines" (fechas límite) pactados al inicio de cada encargo.</span>
                      </li>
                    </ul>
                  </section>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <strong className="block mb-2">DECLARACIÓN FINAL:</strong>
                  <p className="mb-4">Al enviar este formulario, certifico que he leído y comprendido todas las condiciones anteriores, actuando libre de apremio y reconociendo la validez legal de este acuerdo digital.</p>
                  <p className="font-bold">HE LEÍDO Y ACEPTO TODOS LOS TÉRMINOS Y CONDICIONES</p>
                </div>
              </div>
              <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end">
                <Button
                  onClick={() => { setShowTerms(false); setHasOpenedTerms(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Entendido y Cerrar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* --- Lista del Personal Registrado --- */}
        {/*       <div className="mt-10">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Registrado</h3>
        <div className="space-y-4">
          {allStaff.map((staff) => (
            <div key={staff._id} className="p-4 bg-white rounded-lg shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-grow">
                <h4 className="text-lg font-semibold text-gray-900">{staff.Nombre} {staff.Apellido}</h4>
                <p className="text-sm text-gray-600">Cargo: {staff.Cargo || "N/A"}</p>
                <p className="text-sm text-gray-600">Celular: {staff.Celular || "N/A"}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                  <Button onClick={() => handleEdit(staff)} className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-bold py-1 px-2 rounded">✏️ Editar</Button>
                  <Button onClick={() => handleDelete(staff._id)} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-2 rounded">❌ Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
      </div> */}
      </div>
    </div>
  );
}

export default StaffCreator;