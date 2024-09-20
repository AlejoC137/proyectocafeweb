import React, { useState, useEffect } from "react";
import { useDispatch } from 'react-redux';
import { updateItem, delitem, getAllItems } from '../../../redux/actions.js';
import TagsInput from "./TagsInput.jsx";

// Option arrays for dropdowns
const proveedorOptions = ["Colanta", "ADHER", "Principe Conejo", "La Vaquita", "Mundo Huevo", "NaN", "Dulces Tonterias", "Frutos & Semillas", "Price Smart", "Fermentados", "Modou", "BRETAÑA 300ml", "Exito", "Frescampo", "TREE FRUTS", "Lina Gil", "Splenda", "JE", "Exitp", "Éxito", "INTERNO", "Mandalas", "Carreta", "D1", "McPollo", "PriceSmart", "JUAN VALDEZ", "la Vaquita"];
const areaOptions = ["CAFE_BEBIDAS", "COCINA"];
const categoriaOptions = ["produccion_interna", "compra_almacen"];
const unidadOptions = ["srv", "NaN", "ml", "un", "gr"];
const grupoOptions = ["FRUTAS_VERDURAS", "CONDIMENTO_ESPECIA", "CANAZTA_FAMILIAR", "PANADERIA"];
const marcaOpcions = ["FRUTAS_VERDURAS", "CONDIMENTO_ESPECIA", "CANAZTA_FAMILIAR", "PANADERIA"];

function CardCheckList({ datos, largeEditSet, category }) {
  const dispatch = useDispatch();
  const [selectedStatus, setSelectedStatus] = useState(datos["Estado"]);
  const [editableField, setEditableField] = useState(null);
  const [editedValue, setEditedValue] = useState(null);
  const [precioPorUnidad, setPrecioPorUnidad] = useState(0);

  useEffect(() => {
    calcularPrecioPorUnidad();
  }, [datos["CANTIDAD"], datos["COSTO"], datos["COOR"]]);

  const handleCheck = (status) => {
    setSelectedStatus(status);


    // dispatch(updateItem({
    //   id: datos._id,
    //   Field: "Estado",
    //   category: "STOCK",
    //   Value: status,
    // }
    updateItem({
      id: datos._id,
      Field: "Estado",
      category: "STOCK",
      Value: status,
    }
  
  
  ).then(() => {
     // Re-fetch the updated list after a change
    });
  };

  const handleDelete = async () => {
    await dispatch(delitem({ id: datos._id, category }));
    dispatch(getAllItems()); // Refresh the list after deletion
  };

  const handleEditClick = (field) => {
    setEditableField(field);
    setEditedValue(datos[field]);
  };

  const handleBlur = (field) => {
    const currentDate = new Date().toISOString().split('T')[0]; // Obtener la fecha actual en formato YYYY-MM-DD
  
    dispatch(updateItem({
      id: datos._id,
      Field: field,
      category: 'STOCK',
      Value: editedValue,
    })).then(() => {
      // Actualizar la fecha de actualización junto con el campo modificado
      dispatch(updateItem({
        id: datos._id,
        Field: "FECHA_ACT",
        category: 'STOCK',
        Value: currentDate,
      }));
      dispatch(getAllItems());  // Re-fetch the updated list after a change
    });
  
    setEditableField(null);
  };
  

  const handleChange = (e) => {
    setEditedValue(e.target.value);
  };

  

  const calcularPrecioPorUnidad = () => {
    const cantidad = isNaN(parseFloat(datos["CANTIDAD"])) ? 0 : parseFloat(datos["CANTIDAD"]);
    const costo = isNaN(parseFloat(datos["COSTO"])) ? 0 : parseFloat(datos["COSTO"]);
    const coor = isNaN(parseFloat(datos["COOR"])) ? 0 : parseFloat(datos["COOR"]);

    if (cantidad === 0 || coor === 0) {
      setPrecioPorUnidad(0);
    } else {
      const precio = (costo / cantidad) * coor;
      setPrecioPorUnidad(precio.toFixed(2));
    }
  };

  const renderField = (fieldName, displayName, options = null) => {
    return (
      <div className="flex items-center mb-2">
        <span className="mr-2 text-lg font-semibold">{displayName}:</span>
        {editableField === fieldName ? (
          options ? (
            // Render select dropdown when options are provided
            <select
              value={editedValue}
              onChange={handleChange}
              onBlur={() => handleBlur(fieldName)}
              className="border rounded px-2 py-1"
              autoFocus
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            // Render input field for non-dropdown editable fields
            <input
              type="text"
              value={editedValue}
              onChange={handleChange}
              onBlur={() => handleBlur(fieldName)}
              className="border rounded px-2 py-1"
              placeholder={datos[fieldName]}
              autoFocus
            />
          )
        ) : (
          <span className="text-lg font-semibold">{datos[fieldName]}</span>
        )}
        <button 
          className="ml-2 text-gray-600 hover:text-gray-800"
          onClick={() => handleEditClick(fieldName)}
        >
          ✏️
        </button>
      </div>
    );
  };

  const getButtonClass = (status) => {
    const classes = {
      '100%': 'bg-green-500 hover:bg-green-700',
      '75%': 'bg-blue-500 hover:bg-blue-700',
      '50%': 'bg-yellow-500 hover:bg-yellow-700',
      '25%': 'bg-orange-500 hover:bg-orange-700',
      '0%': 'bg-red-500 hover:bg-red-700',
      'NA': 'bg-gray-800 hover:bg-gray-700',
    };
    return selectedStatus === status ? classes[status] : 'bg-gray-500 hover:bg-gray-700';
  };
  const handleTagsChange = (newTags) => {
    dispatch(updateItem({
      id: datos._id,
      Field: "MARCA", // O "Proveedor" dependiendo de la lógica
      category: 'STOCK',
      Value: newTags.join(','),  // Guardar los tags como una cadena separada por comas
    }));
  };
  return (
    <div className="bg-ladrillo overflow-hidden rounded-2xl border border-lilaDark relative p-4">
      <h2 className="text-lg font-semibold mb-2">{datos["Nombre del producto"]}</h2>

      {largeEditSet && renderField("Nombre del producto", "Nombre del producto")}
      {largeEditSet && renderField("Proveedor", "Proveedor", proveedorOptions)}
      {largeEditSet && renderField("Estado", "Estado")}
      {largeEditSet && renderField("Area", "Área", areaOptions)}
      {largeEditSet && renderField("category", "Categoría", categoriaOptions)}
      {largeEditSet && renderField("CANTIDAD", "Cantidad")}
      {largeEditSet && renderField("UNIDADES", "Unidades", unidadOptions)}
      {largeEditSet && renderField("COSTO", "Costo")}
      {largeEditSet && renderField("COOR", "Coordinador")}
      {largeEditSet && renderField("FECHA_ACT", "Fecha Actualización")}
      {largeEditSet && renderField("GRUPO", "Grupo", grupoOptions)}
      {largeEditSet && renderField("MARCA", "Marca", marcaOpcions)}

      <div className="flex items-center mb-2">
      {largeEditSet && (
      <div className="mb-4">
        <span className="mr-2 text-lg font-semibold">Marcas:</span>
        <TagsInput initialTags={datos["MARCA"] ? datos["MARCA"].split(',') : []} onTagsChange={handleTagsChange} />
      </div>
    )}
      </div>
      <div className="flex items-center mb-2">
        <span className="mr-2 text-lg font-semibold">Precio por unidad:</span>
        <span className="text-lg font-semibold">{precioPorUnidad}</span>
      </div>

      <div className="flex">
        {['100%', '75%', '50%', '25%', '0%', 'NA'].map(status => (
          <button
            key={status}
            className={`${getButtonClass(status)} text-white font-bold py-2 px-2 `}
            onClick={() => handleCheck(status)}
          >
            {status}
          </button>
        ))}

        {largeEditSet && (
          <button
            className="text-white font-bold py-2 px-2 bg-red-500 hover:bg-red-700"
            onClick={handleDelete}
          >
            💥
          </button>
        )}
      </div>
    </div>
  );
}

export default CardCheckList;
