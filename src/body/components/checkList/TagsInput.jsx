import React, { useState } from "react";

// Render input de tags para Marcas o Proveedores
const TagsInput = ({ initialTags, onTagsChange }) => {
  const [tags, setTags] = useState(initialTags || []);
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      const newTags = [...tags, inputValue.trim()];
      setTags(newTags);
      setInputValue("");
      onTagsChange(newTags);  // Notificar los tags actualizados al componente padre
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    onTagsChange(newTags);  // Notificar los tags actualizados al componente padre
  };

  return (
    <div className="flex flex-wrap items-center border rounded px-2 py-1">
      {tags.map((tag, index) => (
        <span key={index} className="bg-blue-200 text-blue-700 px-2 py-1 rounded-full mr-2">
          {tag}
          <button
            className="ml-2 text-red-500"
            onClick={() => handleRemoveTag(tag)}
          >
            ✖
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="border-none outline-none px-2"
        placeholder="Añadir tag..."
      />
    </div>
  );
};

export default TagsInput;
