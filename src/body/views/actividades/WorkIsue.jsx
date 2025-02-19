import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { crearWorkIsue, actualizarWorkIsue, eliminarWorkIsue } from "../../../redux/actions-WorkIsue";

const WorkIsue = ({ workIsue }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(workIsue);
  const [procedimientos, setProcedimientos] = useState([]);
  const [procedimientoInput, setProcedimientoInput] = useState("");
  const allStaff = useSelector((state) => state.allStaff || []);
  const allProcedimientos = useSelector((state) => state.allProcedimientos || []);

  useEffect(() => {
    setFormData(workIsue);
  }, [workIsue]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddProcedimiento = () => {
    if (procedimientoInput.trim() !== "") {
      setProcedimientos([...procedimientos, procedimientoInput]);
      setProcedimientoInput("");
    }
  };

  const handleRemoveProcedimiento = (index) => {
    const updatedProcedimientos = procedimientos.filter((_, i) => i !== index);
    setProcedimientos(updatedProcedimientos);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedWorkIsue = {
        ...formData,
        Procedimientos: procedimientos,
      };
      if (workIsue._id) {
        await dispatch(actualizarWorkIsue(workIsue._id, updatedWorkIsue));
      } else {
        await dispatch(crearWorkIsue(updatedWorkIsue));
      }
      alert("WorkIsue guardado correctamente");
    } catch (error) {
      console.error("Error al guardar el WorkIsue:", error);
      alert("Error al guardar el WorkIsue");
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md mb-6">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Fecha de Creación:</label>
            <Input
              type="text"
              name="Dates"
              value={formData.Dates.isued}
              onChange={handleChange}
              className="border rounded p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Fecha de Finalización:</label>
            <Input
              type="text"
              name="Dates"
              value={formData.Dates.finished}
              onChange={handleChange}
              className="border rounded p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Terminado:</label>
            <Input
              type="checkbox"
              name="Terminado"
              checked={formData.Terminado}
              onChange={(e) => setFormData({ ...formData, Terminado: e.target.checked })}
              className="border rounded p-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Pagado:</label>
            <Input
              type="text"
              name="Pagado"
              value={formData.Pagado.pagadoFull}
              onChange={handleChange}
              className="border rounded p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Adelanto:</label>
            <Input
              type="text"
              name="Pagado"
              value={formData.Pagado.adelanto}
              onChange={handleChange}
              className="border rounded p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Categoría:</label>
            <Input
              type="text"
              name="Categoria"
              value={formData.Categoria}
              onChange={handleChange}
              className="border rounded p-1 text-sm w-full"
            />
          </div>
          <div>
            <label className="text-sm bg-white font-medium">Ejecutor:</label>
            <select
              name="Ejecutor"
              value={formData.Ejecutor}
              onChange={handleChange}
              className="border rounded p-1 bg-white text-sm w-full"
            >
              <option value="">Seleccionar Ejecutor</option>
              {allStaff.map((staff) => (
                <option key={staff._id} value={staff._id}>
                  {staff.Nombre} {staff.Apellido}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium">Procedimientos:</label>
          <div className="flex gap-2 mb-2">
            <Input
              type="text"
              value={procedimientoInput}
              onChange={(e) => setProcedimientoInput(e.target.value)}
              className="border rounded p-1 text-sm flex-grow"
            />
            <Button onClick={handleAddProcedimiento} className="bg-green-500 text-white text-sm">
              ➕
            </Button>
          </div>
          <ul className="list-disc list-inside">
            {procedimientos.map((proc, index) => (
              <li key={index} className="flex justify-between items-center">
                {proc}
                <Button onClick={() => handleRemoveProcedimiento(index)} className="bg-red-500 text-white text-sm">
                  ❌
                </Button>
              </li>
            ))}
          </ul>
        </div>
        <Button type="submit" className="bg-blue-500 text-white text-sm mt-4">
          Guardar
        </Button>
      </form>
    </div>
  );
};

export default WorkIsue;

