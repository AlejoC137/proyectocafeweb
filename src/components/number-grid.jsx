"use client"

import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { updateSelectedValue } from "../redux/actions";

export function NumberGridComponent({ options }) {
  const [selectedValue, setSelectedValue] = useState(null);
  const dispatch = useDispatch();

  const handleButtonClick = useCallback((value) => {
    setSelectedValue(value.label);
    dispatch(updateSelectedValue(value.label)); // Suponiendo que quieres enviar solo el label
  }, [dispatch]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-screen">
      {options.map((option, index) => (
        <Button
          key={index}
          variant={selectedValue === option.label ? "default" : "outline"}
          className="h-16 text-lg font-semibold flex items-center justify-center"
          onClick={() => handleButtonClick(option)}
          aria-pressed={selectedValue === option.label}>
          {option.icon}
          <span className="ml-2">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
