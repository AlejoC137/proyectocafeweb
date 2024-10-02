"'use client'"

import { useState, useCallback } from "react"
import { useDispatch } from "react-redux"
import { Button } from "@/components/ui/button"
// import { updateSelectedValue } from "../redux/actions"




export function NumberGridComponent() {
  const [selectedValue, setSelectedValue] = useState(null)
  const dispatch = useDispatch()

  const handleButtonClick = useCallback((value) => {
    setSelectedValue(value)
    dispatch(updateSelectedValue(value))
  }, [dispatch])

  const buttonValues = [10, 12, 14, 16, 18, 20]

  return (
    <div className="p-4">
      <h1>Cuantos almuerzos deseas?</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {buttonValues.map((value) => (
          <Button
            key={value}
            variant={selectedValue === value ? "default" : "outline"}
            className="h-16 text-lg font-semibold"
            onClick={() => handleButtonClick(value)}
            aria-pressed={selectedValue === value}>
            {value}
          </Button>
        ))}
      </div>
    </div>
  );
}