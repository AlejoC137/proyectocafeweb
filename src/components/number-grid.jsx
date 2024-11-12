import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { updateSelectedValue } from "../redux/actions";

export function NumberGridComponent({ options, multiSelect = false }) {
  const [selectedValues, setSelectedValues] = useState([]);
  const dispatch = useDispatch();

  const handleButtonClick = useCallback((value) => {
    let updatedValues;
    
    if (multiSelect) {
      if (selectedValues.includes(value.label)) {
        updatedValues = selectedValues.filter(val => val !== value.label);
      } else {
        updatedValues = [...selectedValues, value.label];
      }
    } else {
      updatedValues = [value.label];
    }
    
    setSelectedValues(updatedValues);
    dispatch(updateSelectedValue(updatedValues));
  }, [multiSelect, selectedValues, dispatch]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-screen">
      {options.map((option, index) => (
        <Button
          key={index}
          variant={selectedValues.includes(option.label) ? "default" : "outline"}
          className="h-16 text-lg font-semibold flex items-center justify-center whitespace-normal break-words text-center"
          onClick={() => handleButtonClick(option)}
          aria-pressed={selectedValues.includes(option.label)}
        >
          {option.icon}
          <span className="ml-2">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
