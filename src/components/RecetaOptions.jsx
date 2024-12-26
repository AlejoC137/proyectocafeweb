import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const RecetaOptions = () => {
  const [recetaItems, setRecetaItems] = useState([]);
  const Items = useSelector((state) => state.allItems || []);
  const Produccion = useSelector((state) => state.allProduccion || []);

  const allOptions = useMemo(() => [...Items, ...Produccion], [Items, Produccion]);

  const addItem = () => {
    setRecetaItems([...recetaItems, { name: "''", type: "''", quantity: "''" }]);
  };

  const updateItem = (index, field, value) => {
    const updatedItems = recetaItems.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setRecetaItems(updatedItems);
  };

  return (
    (<div
      className="flex flex-col gap-4 bg-gray-50 p-4 rounded-md border border-slate-200 dark:border-slate-800">
      <Button onClick={addItem} className="self-start">Añadir Item</Button>
      {recetaItems.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Input
            placeholder="Nombre"
            value={item.name}
            onChange={(e) => updateItem(index, "'name'", e.target.value)}
            className="flex-grow" />
          <Select
            value={item.type}
            onValueChange={(value) => updateItem(index, "'type'", value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {allOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Cantidad"
            value={item.quantity}
            onChange={(e) => updateItem(index, "'quantity'", e.target.value)}
            className="w-24" />
        </div>
      ))}
    </div>)
  );
};

export default RecetaOptions;

