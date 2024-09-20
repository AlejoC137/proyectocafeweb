import React, { useState } from "react";
import "./FormWifi.css"; // Import CSS file for styling

function FormWifi() {

  

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    email: "",
    optForNewsLetters: false,
    acceptDataUsagePolicy: false
  });

  const [errors, setErrors] = useState({
    name: "",
    number: "",
    email: ""
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle different input types
    const fieldValue = type === "checkbox" ? checked : value;

    setFormData({
      ...formData,
      [name]: fieldValue
    });

    // Perform validation
    if (name === "email") {
      // Simple email validation
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setErrors({
        ...errors,
        email: isValidEmail ? "" : "Invalid email format"
      });
    } else if (name === "number") {
      // Simple number validation
      const isValidNumber = /^\d+$/.test(value);
      setErrors({
        ...errors,
        number: isValidNumber ? "" : "Invalid number format"
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Submit logic here
    console.log("Form submitted:", formData);


    history.push(""); // --> redirect to link the wifi link 


  };

  return (
<div className="form-container">
  <form onSubmit={handleSubmit}>
    <label>Noticias, Promos y Más!<br />News, Promos and More!</label>
    <div className="form-group">
      <label>Name:<br />Nombre:</label>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
      />
    </div>

    <div className="form-group">
      <label>Number:<br />Numero:</label>
      <input
        type="text"
        name="number"
        value={formData.number}
        onChange={handleChange}
      />
      {errors.number && <span className="error-msg">{errors.number}</span>}
    </div>

    <div className="form-group">
      <label>E-mail:<br />Correo:</label>
      <input
        type="text"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      {errors.email && <span className="error-msg">{errors.email}</span>}
    </div>

    <div className="form-group checks">
      <label>QUIERO MANTENERME INFORMADO DE PROMOS Y EVENTOS</label>
      <input
        className="button"
        type="checkbox"
        name="optForNewsLetters"
        checked={formData.optForNewsLetters}
        onChange={handleChange}
      />
    </div>

    <div className="form-group checks">
      <label>Accept data usage policy</label>
      <input
        type="checkbox"
        className="button"
        name="acceptDataUsagePolicy"
        checked={formData.acceptDataUsagePolicy}
        onChange={handleChange}
      />
    </div>

    <button type="submit">Café!</button>
  </form>
</div>

  );
}

export default FormWifi;
