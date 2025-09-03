import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PinCodeModal = ({ isOpen, onClose, onSuccess, title = "Código de Autorización" }) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const inputRefs = useRef([]);

  // Código PIN predeterminado (puedes cambiarlo por uno más seguro)
  const ADMIN_PIN = "1234";
  const MAX_ATTEMPTS = 3;

  useEffect(() => {
    if (isOpen && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleInputChange = (index, value) => {
    if (value.length > 1) return; // Solo permitir un dígito
    if (!/^\d*$/.test(value)) return; // Solo números

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError('');

    // Mover al siguiente input si hay un dígito
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const enteredPin = pin.join('');
    
    if (enteredPin.length !== 4) {
      setError('Por favor ingrese los 4 dígitos');
      return;
    }

    if (enteredPin === ADMIN_PIN) {
      setError('');
      setPin(['', '', '', '']);
      setAttempts(0);
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError(`Código incorrecto. Máximo de intentos alcanzado.`);
        setTimeout(() => {
          onClose();
          setAttempts(0);
          setPin(['', '', '', '']);
          setError('');
        }, 2000);
      } else {
        setError(`Código incorrecto. ${MAX_ATTEMPTS - newAttempts} intentos restantes.`);
        setPin(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    }
  };

  const handleClose = () => {
    setPin(['', '', '', '']);
    setError('');
    setAttempts(0);
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 w-96"
        style={{
          backgroundColor: 'rgb(255, 255, 255)',
          color: 'rgb(0, 0, 0)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 
            className="text-xl font-bold"
            style={{ color: 'rgb(31, 41, 55)' }}
          >
            {title}
          </h2>
          <Button 
            onClick={handleClose} 
            variant="ghost" 
            className="h-8 w-8 p-0"
            style={{
              backgroundColor: 'transparent',
              color: 'rgb(107, 114, 128)'
            }}
          >
            ❌
          </Button>
        </div>

        {/* Descripción */}
        <p 
          className="text-sm text-gray-600 mb-6 text-center"
          style={{ color: 'rgb(75, 85, 99)' }}
        >
          Ingrese el código de 4 dígitos para habilitar la modificación permanente de la receta
        </p>

        {/* Inputs del PIN */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, index) => (
            <Input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              value={digit}
              onChange={(e) => handleInputChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold"
              style={{
                backgroundColor: 'rgb(255, 255, 255)',
                borderColor: error ? 'rgb(239, 68, 68)' : 'rgb(209, 213, 219)',
                color: 'rgb(0, 0, 0)'
              }}
              maxLength={1}
            />
          ))}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div 
            className="text-sm text-center mb-4 p-2 rounded"
            style={{ 
              color: 'rgb(239, 68, 68)',
              backgroundColor: 'rgb(254, 242, 242)',
              border: '1px solid rgb(252, 165, 165)'
            }}
          >
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 justify-end">
          <Button 
            variant="outline" 
            onClick={handleClose}
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              borderColor: 'rgb(209, 213, 219)',
              color: 'rgb(107, 114, 128)'
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={attempts >= MAX_ATTEMPTS}
            style={{
              backgroundColor: attempts >= MAX_ATTEMPTS ? 'rgb(156, 163, 175)' : 'rgb(34, 197, 94)',
              color: 'rgb(255, 255, 255)'
            }}
          >
            Verificar
          </Button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PinCodeModal;
