import React from 'react';
import './Switch.css'
function SwitchToggle(props) {
  return (
    <label className="switch">
      <input type="checkbox" checked={props.isToggled} onChange={props.onToggle} />
      
      <span className="slider"></span>
    </label>
  );
}

export default SwitchToggle;
