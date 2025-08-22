import React, { useState } from "react";
import "./ProjectForm.css"; // Import CSS file for styling
import AddField from "./AddField"
function ProjectForm() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    general_properties: {
      active: "",
      client: {name:"", contact:''},
      team: [{ 
        name: "", 
        role: "", 
        contact: "" }]
    },
    particular_properties: [{}],
    media: {
      img: [{ 
        name: "" ,
        reference: "", 
        description: "", 
      }],
      video: [{ 
        name: "", 
        reference: "", 
        description: "", 
      }]
    },
    descriptions: [{ 
      name: "", 
      description: "", 
    }],
    projectsDates: [{ 
      landMark: "", 
      date: "" ,
    }],

    roles: [{ 
      description: "", 
      dates: { 
        name: "", 
        start: "", 
        end: "" }, 
      }],

    xrefs: [{ 
      name:"",
      content:"", 
    }],
    entryAuthor: { name: "ass" }
  });
  
  const [errors, setErrors] = useState({
    name: "",
    category: "",
    // Add other error fields as needed
  });

  const updateNestedProperty = (object, keys, value, index = 0) => {
    if (index === keys.length - 1) {
      // If the property is an array, append the value to the array
      if (Array.isArray(object[keys[index]])) {
        return {
          ...object,
          [keys[index]]: [...object[keys[index]], value]
        };
      } else {
        return {
          ...object,
          [keys[index]]: value
        };
      }
    }
  
    const key = keys[index];
    const updatedNested = {
      ...object[key],
      [keys[index + 1]]: value
    };
  
    return {
      ...object,
      [key]: updateNestedProperty(object[key], keys, value, index + 1)
    };
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Split the name into nested properties
    const keys = name.split('.');
    const updatedFormData = updateNestedProperty(formData, keys, value);
  
    setFormData(updatedFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validation logic before submitting can be added here
    console.log("Form submitted:", formData);
    // history.push(""); // --> redirect to link the wifi link
  };

  function findArraysOfObjects(obj, prefix = '') {
    let results = {};
  
    for (let key in obj) {
      let currentPrefix = prefix ? `${prefix}.${key}` : key;
  
      if (Array.isArray(obj[key]) && obj[key].length > 0 && typeof obj[key][0] === 'object') {
        // Array of objects found
        results[currentPrefix] = Object.keys(obj[key][0]);
        // Check for nested objects within the array
        obj[key].forEach((item, index) => {
          let nestedResults = findArraysOfObjects(item, `${currentPrefix}[${index}]`);
          results = { ...results, ...nestedResults };
        });
      } else if (typeof obj[key] === 'object') {
        // Nested object, continue recursion
        let nestedResults = findArraysOfObjects(obj[key], currentPrefix);
        results = { ...results, ...nestedResults };
      }
    }
  
    return results;
  }

  const keyOfArrayOfObjects = findArraysOfObjects(formData)

  const handleChangeArrayField = (fieldName, index, fieldValue) => {
    // Create a copy of formData
    const updatedFormData = { ...formData };
  
    // Update the value of the field at the specified index
    updatedFormData[fieldName][index] = fieldValue;
  
    // Update the formData state
    setFormData(updatedFormData);
  };


  const composeFields = []
  for (let key in keyOfArrayOfObjects) {
   composeFields.push(
    <AddField 
    key={key}
    name={key}
    valueref={keyOfArrayOfObjects[key]}
    onchangefield={(fieldName, index, fieldValue) => handleChangeArrayField(fieldName, index, fieldValue)}

    />
   )
   




  }



  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>

{/* NAME FIELD */}
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            onChange={handleChange}
          />
          {/* Add validation error display if needed */}
        </div>

{/* AUTOR ENTRY FIELD */}
        <div className="form-group">
          <label>Entry Author Name:</label>
          <input
            type="text"
            name="entryAuthor.name"
            onChange={handleChange}
          />
          {/* Add validation error display if needed */}
        </div>


        <label>Properties:</label>
{/* CLIENT ENTRY FIELDS */}

        <div className="form-group">
          <label>Client Name:</label>
          <input
            type="text"
            name="general_properties.client"
            onChange={handleChange}
          />
          {/* Add validation error display if needed */}
        </div>



        <div className="form-group">
          <label>Client Contact:</label>
          <input
            type="text"
            name="general_properties.client"
            onChange={handleChange}
          />
          {/* Add validation error display if needed */}
        </div>

        <div className="form-group">
          <label>Description type:</label>
          <input
            type="text"
            name="descriptions"
            fieldtarget="description"
            // onChange={handleChangeObjectForArray}
          />
          {/* Add validation error display if needed */}
        </div>


        <div className="form-group">
          <label>Descripcion:</label>
          <textarea
            type="text"
            name="descriptions"
            fieldtarget="description"
            index= {0}
            // onChange={handleChangeObjectForArray}
            // onBlur={handleChangeObjectForArray}
          />
          {/* Add validation error display if needed */}
        </div>


        
        <div className="form-group">
          <label>Category:</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
          >

            <option value="">Select a category</option>
            <option value="arch">Architecture</option>
            <option value="code">Coding</option>
            <option value="soci">Social</option>
          </select>
          {/* Add validation error display if needed */}
        </div>
        {/* Add other form fields */}
      </form>
      <div >
      {composeFields}
      </div>
        <button 
        onClick={handleSubmit}
        type="submit">Submit</button>

        {/* <button onClick={()=>{console.log(formData.descriptions);}}>Test formData</button> */}
    </div>
  );
  
  
}

export default ProjectForm;
