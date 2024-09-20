import React from "react";
import "./PercheroComp.css"; // Importa el archivo CSS para el estilo

function PercheroComp({ src, alt, buttonText, onClick, vitrina }) {
    return (
        <div className="perchero-container">
            <button className="image-button" onClick={onClick}>
                <img className="image-perchero" src={src} alt={alt} />
                <span className="button-text">{buttonText}</span>
                {vitrina && ( // Muestra la vitrina solo si está definida
                    <div className="vitrina-overlay">
                        <div className="vitrina-container">
                            <img className="vitrina" src={vitrina} alt={alt} />
                        </div>
                    </div>
                )}
            </button>
        </div>
    );
}

export default PercheroComp;
