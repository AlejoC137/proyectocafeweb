import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EditableText = ({ 
  value, 
  onSave, 
  isEditable = false, 
  placeholder = "Haga clic para editar...",
  multiline = false,
  disabled = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        inputRef.current.setSelectionRange(editValue.length, editValue.length);
      }
    }
  }, [isEditing, multiline, editValue.length]);

  const handleEdit = () => {
    if (!isEditable || disabled) return;
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue.trim() === '') return;
    
    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
    if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault();
      handleSave();
    }
  };

  if (!isEditable) {
    return (
      <span style={{ color: 'rgb(0, 0, 0)' }}>
        {value || placeholder}
      </span>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        {multiline ? (
          <textarea
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow min-h-[60px] p-2 border rounded text-sm resize-vertical"
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              borderColor: 'rgb(209, 213, 219)',
              color: 'rgb(0, 0, 0)'
            }}
            placeholder={placeholder}
            disabled={isSaving}
          />
        ) : (
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow text-sm"
            style={{
              backgroundColor: 'rgb(255, 255, 255)',
              borderColor: 'rgb(209, 213, 219)',
              color: 'rgb(0, 0, 0)'
            }}
            placeholder={placeholder}
            disabled={isSaving}
          />
        )}
        
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving || editValue.trim() === ''}
          style={{
            backgroundColor: 'rgb(34, 197, 94)',
            color: 'rgb(255, 255, 255)'
          }}
        >
          {isSaving ? "..." : "✓"}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          style={{
            backgroundColor: 'transparent',
            color: 'rgb(107, 114, 128)'
          }}
        >
          ✕
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`cursor-pointer p-1 rounded transition-colors hover:bg-gray-100 ${
        !value ? 'text-gray-400 italic' : ''
      }`}
      onClick={handleEdit}
      style={{
        color: !value ? 'rgb(156, 163, 175)' : 'rgb(0, 0, 0)',
        backgroundColor: 'transparent'
      }}
    >
      {value || placeholder}
      {isEditable && (
        <span className="ml-2 text-xs text-gray-400" style={{ color: 'rgb(156, 163, 175)' }}>
          ✏️
        </span>
      )}
    </div>
  );
};

export default EditableText;
