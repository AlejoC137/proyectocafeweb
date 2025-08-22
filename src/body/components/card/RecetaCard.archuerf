import React, { useState } from "react";
import { useSelector } from 'react-redux';

function RecetaCard() {
  const lareceta = useSelector(state => state.receta);
  const [editableField, setEditableField] = useState(null);
  const [editedData, setEditedData] = useState(lareceta);
  const [changes, setChanges] = useState({});

  const handleEdit = (field) => {
    setEditableField(field);
  };

  const handleChange = (field, value, index = null) => {
    if (index !== null) {
      // Si estamos editando un campo dentro de un array (preparación, emplatado, etc.)
      const updatedArray = [...editedData[field]];
      updatedArray[index] = { ...updatedArray[index], proceso: value };
      setEditedData({
        ...editedData,
        [field]: updatedArray,
      });
      setChanges({
        ...changes,
        [field]: updatedArray,
      });
    } else {
      // Si estamos editando un campo directo
      setEditedData({
        ...editedData,
        [field]: value,
      });
      setChanges({
        ...changes,
        [field]: value,
      });
    }
  };

  const addItem = (field) => {
    const updatedArray = [...editedData[field], { proceso: "Nuevo paso" }];
    setEditedData({
      ...editedData,
      [field]: updatedArray,
    });
    setChanges({
      ...changes,
      [field]: updatedArray,
    });
  };

  const removeItem = (field, index) => {
    const updatedArray = editedData[field].filter((_, i) => i !== index);
    setEditedData({
      ...editedData,
      [field]: updatedArray,
    });
    setChanges({
      ...changes,
      [field]: updatedArray,
    });
  };

  const handleConfirm = () => {
    console.log("Datos a actualizar en la API:", changes);

    // Aquí iría la lógica para el llamado a la API para actualizar los datos
    setChanges({});
    setEditableField(null);
  };

  return (
    <div className="bg-white h-auto w-full p-6 rounded-xl shadow-md border border-gray-300">
      {/* Recipe Name */}
      <div className="font-semibold text-gray-800 text-xl text-center mb-6">
        {editableField === "nombre" ? (
          <input
            type="text"
            value={editedData.nombre}
            onChange={(e) => handleChange("nombre", e.target.value)}
            className="border border-gray-300 rounded p-2 w-full text-center"
          />
        ) : (
          <span onClick={() => handleEdit("nombre")} className="cursor-pointer">
            {editedData?.nombre || "No data"}
            <i className="ml-2 text-blue-500">✎</i>
          </span>
        )}
      </div>

      {/* Yield Information */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-gray-700">Rendimiento</h3>
        <div className="text-gray-600">
          {editedData?.rendimiento_cantidad && editedData?.rendimiento_unidades && editedData?.rendimiento_porcion ? (
            <span>
              {editedData.rendimiento_cantidad} {editedData.rendimiento_unidades} por {editedData.rendimiento_porcion} porción(es)
              <i className="ml-2 text-blue-500 cursor-pointer" onClick={() => handleEdit("rendimiento")}>✎</i>
            </span>
          ) : (
            "No data"
          )}
        </div>
      </div>

      {/* Ingredients List */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Ingredientes</h3>
        <ul className="list-disc list-inside text-gray-600">
          {editedData?.ingredientes?.map((ingrediente, index) => (
            <li key={index} className="mb-2">
              {editableField === `ingrediente-${index}` ? (
                <input
                  type="text"
                  value={`${ingrediente.nombre}: ${ingrediente.cantidad} ${ingrediente.unidades}`}
                  onChange={(e) => handleChange("ingredientes", e.target.value, index)} // Aquí corregimos el paso de argumentos
                  className="border border-gray-300 rounded p-2 w-full"
                />
              ) : (
                <span onClick={() => handleEdit(`ingrediente-${index}`)} className="cursor-pointer">
                  {ingrediente.nombre || "No data"}: {ingrediente.cantidad || "No data"} {ingrediente.unidades || "No data"}
                  <i className="ml-2 text-blue-500">✎</i>
                </span>
              )}
              <button onClick={() => removeItem('ingredientes', index)} className="ml-2 text-red-500">Eliminar</button>
            </li>
          ))}
        </ul>
        <button onClick={() => addItem('ingredientes')} className="text-blue-500 mt-4">Agregar ingrediente</button>
      </div>

      {/* Preparation Steps */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Preparación</h3>
        <ol className="list-decimal list-inside text-gray-600">
          {editedData?.preparacion?.map((paso, index) => (
            <li key={index} className="mb-2">
              {editableField === `paso-${index}` ? (
                <input
                  type="text"
                  value={paso.proceso}  // Aquí accedemos al campo "proceso" del objeto
                  onChange={(e) => handleChange("preparacion", e.target.value, index)} // Corregido para paso de argumentos
                  className="border border-gray-300 rounded p-2 w-full"
                />
              ) : (
                <span onClick={() => handleEdit(`paso-${index}`)} className="cursor-pointer">
                  {paso.proceso || "No data"}  {/* Renderizamos el campo "proceso" */}
                  <i className="ml-2 text-blue-500">✎</i>
                </span>
              )}
              <button onClick={() => removeItem('preparacion', index)} className="ml-2 text-red-500">Eliminar</button>
            </li>
          ))}
        </ol>
        <button onClick={() => addItem('preparacion')} className="text-blue-500 mt-4">Agregar paso</button>
      </div>

      {/* Plating (Emplatado) */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Emplatado</h3>
        {Array.isArray(editedData?.emplatado) ? (
          <ol className="list-decimal list-inside text-gray-600">
            {editedData?.emplatado?.map((paso, index) => (
              <li key={index} className="mb-2">
                {editableField === `emplatado-${index}` ? (
                  <input
                    type="text"
                    value={paso.proceso}  // Aquí accedemos al campo "proceso"
                    onChange={(e) => handleChange("emplatado", e.target.value, index)}  // Corregido para paso de argumentos
                    className="border border-gray-300 rounded p-2 w-full"
                  />
                ) : (
                  <span onClick={() => handleEdit(`emplatado-${index}`)} className="cursor-pointer">
                    {paso.proceso || "No data"}  {/* Renderizamos el campo "proceso" */}
                    <i className="ml-2 text-blue-500">✎</i>
                  </span>
                )}
                <button onClick={() => removeItem('emplatado', index)} className="ml-2 text-red-500">Eliminar</button>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-gray-600">
            {editableField === "emplatado" ? (
              <input
                type="text"
                value={editedData.emplatado}
                onChange={(e) => handleChange("emplatado", e.target.value)} // Cambiado el nombre del campo a un string
                className="border border-gray-300 rounded p-2 w-full"
              />
            ) : (
              <span onClick={() => handleEdit("emplatado")} className="cursor-pointer">
                {editedData?.emplatado || "No data"}
                <i className="ml-2 text-blue-500">✎</i>
              </span>
            )}
          </p>
        )}
        <button onClick={() => addItem('emplatado')} className="text-blue-500 mt-4">Agregar emplatado</button>
      </div>

      {/* Notes */}
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-bold text-gray-700 mb-4">Notas</h3>
        <ul className="list-disc list-inside text-gray-600">
          {editedData?.notas?.map((nota, index) => (
            <li key={index} className="mb-2">
              {editableField === `nota-${index}` ? (
                <input
                  type="text"
                  value={nota}
                  onChange={(e) => handleChange("notas", e.target.value, index)} // Corregido el paso de argumentos
                  className="border border-gray-300 rounded p-2 w-full"
                />
              ) : (
                <span onClick={() => handleEdit(`nota-${index}`)} className="cursor-pointer">
                  {nota || "No data"}
                  <i className="ml-2 text-blue-500">✎</i>
                </span>
              )}
              <button onClick={() => removeItem('notas', index)} className="ml-2 text-red-500">Eliminar</button>
            </li>
          ))}
        </ul>
        <button onClick={() => addItem('notas')} className="text-blue-500 mt-4">Agregar nota</button>
      </div>

      {/* Confirm Button */}
      <div className="flex justify-center">
        <button
          onClick={handleConfirm}
          disabled={Object.keys(changes).length === 0}
          className={`py-2 px-6 rounded-lg shadow transition duration-200 ${
            Object.keys(changes).length > 0
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Confirmar cambios
        </button>
      </div>

      {/* Additional Information */}
      <div className="text-gray-500 text-sm text-center mt-6">
        <p>Escrito por: {editedData?.escrito || "No data"}</p>
        <p>Revisado por: {editedData?.revisado || "No data"}</p>
        <p>Última actualización: {editedData?.actualizacion || "No data"}</p>
      </div>
    </div>
  );
}

export default RecetaCard;
