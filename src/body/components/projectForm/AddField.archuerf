import React, { useState, useEffect } from "react";
import "./ProjectForm.css"; // Import CSS file for styling

function AddField({ name, valueref, onchangefield }) {

  const [amount, setAmount] = useState(1);
  const [errors, setErrors] = useState({});
  const [AddFiledResult, setAddFiledResult] = useState([{}]); // Initialize with one empty object

  useEffect(() => {
    // Update AddFiledResult whenever amount changes
    setAddFiledResult(new Array(amount).fill({}));
  }, [amount]);

  const handleAdd = () => {
    setAmount(amount + 1);
  };

  const inputSets = [];
  const inputs = [];

  const handleCreateProperty = (index, fieldValue, valueref) => {
    // console.log(index);
    console.log(fieldValue);
    console.log(valueref);
    console.log(AddFiledResult);
    // AddFiledResult[index] = 
    
  }

  for (let i = 0; i < valueref.length; i++) {
    inputs.push(
      <div key={i}>
        <label>{`${valueref[i]}`} :</label>
        <input
          type="text"
          name={`${valueref[i]}${i}`}
          onBlur={(e) => handleCreateProperty(i, e.target.value, valueref[i])}
        />
      </div>
    );
  }

  for (let j = 0; j < amount; j++) {
    inputSets.push(
      <div
        className="form-line"
        key={j}
      >
        {inputs}
      </div>
    );
  }

  return (
    <div className="form-container">
      <label>{name}:</label>
      {inputSets}
      <button onClick={handleAdd}>Add</button>
    </div>
  );
}

export default AddField;
