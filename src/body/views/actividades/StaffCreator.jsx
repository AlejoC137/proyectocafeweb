import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Se actualiza la importación para usar getAllFromTable
import { crearStaff, updateItem, deleteItem, getAllFromTable ,  } from "../../../redux/actions-Proveedores";

// --- Funciones de Ayuda para Formateo y Parseo ---

// Convierte un array de objetos de propinas al formato de texto específico
const formatPropinasToString = (propinasArray) => {
  if (!propinasArray || propinasArray.length === 0) return "";
  const propinasStrings = propinasArray.map(p =>
    `  {\n    tipDia: "${p.tipDia || ''}",\n    tipHora: "${p.tipHora || ''}",\n    tipMonto: ${p.tipMonto || 0}\n  }`
  );
  return `[\n${propinasStrings.join(',\n')}\n]`;
};

// Convierte un array de objetos de turnos al formato de texto específico
const formatTurnosToString = (turnosArray) => {
  if (!turnosArray || turnosArray.length === 0) return "";
  const turnosStrings = turnosArray.map(t =>
    `  {\n    turnoDate: "${t.turnoDate || ''}",\n    horaInicio: "${t.horaInicio || ''}",\n    horaSalida: "${t.horaSalida || ''}"\n  }`
  );
  return `[\n${turnosStrings.join(',\n')}\n]`;
};

// Parsea el texto de propinas a un array de objetos
const parsePropinasFromString = (text) => {
    if (typeof text !== 'string' || !text.trim()) return [];
    try {
        // Intenta parsear como JSON si es un string JSON válido
        if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
             // Reemplaza comillas simples por dobles para un JSON más estándar si es necesario
            const sanitizedJson = text.replace(/'/g, '"');
            return JSON.parse(sanitizedJson);
        }
    } catch (e) {
        // Si falla el parseo JSON, intenta con el método de regex como fallback
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
        // Intenta parsear como JSON si es un string JSON válido
        if (text.trim().startsWith('[') && text.trim().endsWith(']')) {
            // Reemplaza comillas simples por dobles para un JSON más estándar si es necesario
            const sanitizedJson = text.replace(/'/g, '"');
            return JSON.parse(sanitizedJson);
        }
    } catch(e) {
        // Si falla el parseo JSON, intenta con el método de regex como fallback
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


// --- Estado Inicial basado en Staff_rows.csv (Sin Estado) ---
const initialState = {
  Nombre: "",
  Apellido: "",
  Cargo: "",
  Cuenta: "",
  CC: 0,
  Celular: "",
  Direccion: "",
  infoContacto: "",
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

  useEffect(() => {
    // Se actualiza la llamada a la acción para obtener los datos
    dispatch(getAllFromTable("Staff"));
  }, [dispatch]);

  const handleSimpleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === "checkbox" ? checked : (type === "number" ? (value === "" ? "" : parseFloat(value)) : value);
    setFormData(prev => ({ ...prev, [name]: finalValue }));
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
    // Prepara el payload para enviar, convirtiendo los arrays a string
    const payload = {
      ...formData,
      Propinas: formatPropinasToString(formData.Propinas),
      Turnos: formatTurnosToString(formData.Turnos),
    };

    try {
      if (editing) {
        await dispatch(updateItem(editing, payload, "Staff"));
        alert("Staff actualizado correctamente");
      } else {
        // La llamada a crearStaff ya era correcta
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
        ...initialState, // Asegura que todos los campos estén presentes
        ...staff,
        // Usa las funciones de parseo para convertir el texto a un array para el formulario
        Propinas: parsePropinasFromString(staff.Propinas),
        Turnos: parseTurnosFromString(staff.Turnos),
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
    <div className="p-4 md:p-6 bg-gray-50 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{editing ? "Editando Staff" : "Crear Nuevo Staff"}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- Sección de Datos Personales --- */}
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Información Personal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><label className="text-sm font-medium">Nombre:</label><Input required name="Nombre" value={formData.Nombre} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Apellido:</label><Input required name="Apellido" value={formData.Apellido} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Cargo:</label><Input name="Cargo" value={formData.Cargo} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Cuenta:</label><Input name="Cuenta" value={formData.Cuenta} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">CC:</label><Input type="number" name="CC" value={formData.CC} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Celular:</label><Input name="Celular" value={formData.Celular} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Dirección:</label><Input name="Direccion" value={formData.Direccion} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Info Contacto:</label><Input name="infoContacto" value={formData.infoContacto} onChange={handleSimpleChange} /></div>
                <div><label className="text-sm font-medium">Rate:</label><Input type="number" name="Rate" value={formData.Rate} onChange={handleSimpleChange} /></div>
            </div>
        </div>

        {/* --- Sección de Propinas --- */}
        <div className="p-4 border rounded-lg bg-white">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Propinas</h3>
                <Button type="button" onClick={() => addArrayItem('Propinas', { tipDia: '', tipHora: '', tipMonto: 0 })}>+ Agregar Propina</Button>
            </div>
            <div className="space-y-3">
                {formData.Propinas.map((propina, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-2 border rounded items-center">
                        <Input name="tipDia" type="date" value={propina.tipDia} placeholder="Fecha" onChange={(e) => handleArrayItemChange('Propinas', index, e)} />
                        <Input name="tipHora" type="time" value={propina.tipHora} placeholder="Hora" onChange={(e) => handleArrayItemChange('Propinas', index, e)} />
                        <Input name="tipMonto" type="number" value={propina.tipMonto} placeholder="Monto" onChange={(e) => handleArrayItemChange('Propinas', index, e)} />
                        <Button type="button" onClick={() => removeArrayItem('Propinas', index)} className="bg-red-500 hover:bg-red-600 text-white">Eliminar</Button>
                    </div>
                ))}
            </div>
        </div>

        {/* --- Sección de Turnos --- */}
        <div className="p-4 border rounded-lg bg-white">
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
        
        {/* --- Sección de Configuración --- */}
        <div className="p-4 border rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Configuración</h3>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2"><Input type="checkbox" name="Show" checked={formData.Show} onChange={handleSimpleChange} className="h-4 w-4"/><label>Show</label></div>
                <div className="flex items-center gap-2"><Input type="checkbox" name="Contratacion" checked={formData.Contratacion} onChange={handleSimpleChange} className="h-4 w-4"/><label>Contratación Activa</label></div>
                <div className="flex items-center gap-2"><Input type="checkbox" name="isAdmin" checked={formData.isAdmin} onChange={handleSimpleChange} className="h-4 w-4"/><label>Es Administrador</label></div>
                <div className="flex items-center gap-2"><Input type="checkbox" name="Turno_State" checked={formData.Turno_State} onChange={handleSimpleChange} className="h-4 w-4"/><label>Turno Activo</label></div>
            </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">{editing ? "Actualizar Staff" : "Guardar Staff"}</Button>
          {editing && <Button type="button" onClick={() => { setEditing(null); setFormData(initialState); }} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">Cancelar Edición</Button>}
        </div>
      </form>

      {/* --- Lista del Personal Registrado --- */}
      <div className="mt-10">
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
      </div>
    </div>
  );
}

export default StaffCreator;
