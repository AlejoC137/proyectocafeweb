// =========================================================
// LIENZO INTERACTIVO WYSIWYG PARA FLYER STUDIO
// Renderizado exacto con escalado vectorial, drag & drop
// y soporte de exportación a alta resolución (html2canvas)
// =========================================================

import React, { useRef, useState, useEffect } from "react";
import { FLYER_FORMATS } from "./flyerAiPromptEngine";

export default function FlyerCanvas({
  canvasConfig = {},
  elements = [],
  selectedElementId = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  printRef = null,
  scale = 0.5
}) {
  const containerRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const nominalWidth = canvasConfig.width || 1080;
  const nominalHeight = canvasConfig.height || 1920;

  // Manejo de Drag & Drop de elementos en el lienzo
  const handleMouseDown = (e, el) => {
    e.stopPropagation();
    onSelectElement(el.id);

    setDraggingId(el.id);
    setDragOffset({
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingId) return;

      const deltaScreenX = e.clientX - dragOffset.startX;
      const deltaScreenY = e.clientY - dragOffset.startY;

      // Convertir el desplazamiento en pantalla al espacio nominal del canvas
      const deltaNominalX = Math.round(deltaScreenX / scale);
      const deltaNominalY = Math.round(deltaScreenY / scale);

      const targetEl = elements.find((el) => el.id === draggingId);
      if (targetEl) {
        onUpdateElement({
          ...targetEl,
          x: Math.max(0, Math.min(nominalWidth, dragOffset.origX + deltaNominalX)),
          y: Math.max(0, Math.min(nominalHeight, dragOffset.origY + deltaNominalY))
        });
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
    };

    if (draggingId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, dragOffset, elements, scale, nominalWidth, nominalHeight, onUpdateElement]);

  const renderElementContent = (el) => {
    const s = el.style || {};

    if (el.type === "badge") {
      return (
        <div
          style={{
            backgroundColor: s.backgroundColor || "#c59b27",
            color: s.color || "#1c140e",
            fontSize: `${s.fontSize || 22}px`,
            fontWeight: s.fontWeight || "800",
            borderRadius: `${s.borderRadius || 24}px`,
            padding: `${s.paddingY || 10}px ${s.paddingX || 28}px`,
            letterSpacing: `${s.letterSpacing || 2}px`,
            textTransform: s.textTransform || "uppercase",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
            whiteSpace: "nowrap",
            userSelect: "none"
          }}
        >
          {el.text}
        </div>
      );
    }

    if (el.type === "container") {
      return (
        <div
          style={{
            backgroundColor: s.backgroundColor || "rgba(35,25,18,0.85)",
            border: `${s.borderWidth || 2}px solid ${s.borderColor || "#c59b27"}`,
            borderRadius: `${s.borderRadius || 16}px`,
            padding: `${s.paddingY || 20}px ${s.paddingX || 40}px`,
            maxWidth: `${s.maxWidth || Math.round(nominalWidth * 0.85)}px`,
            textAlign: "center",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)"
          }}
        >
          {el.badgeText && (
            <span
              style={{
                display: "inline-block",
                fontSize: "18px",
                fontWeight: "800",
                color: s.borderColor || "#c59b27",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginBottom: "8px"
              }}
            >
              {el.badgeText}
            </span>
          )}
          {el.primaryText && (
            <div
              style={{
                fontSize: `${s.fontSize || 32}px`,
                fontWeight: "900",
                color: "#ffffff",
                lineHeight: 1.2,
                textTransform: "uppercase"
              }}
            >
              {el.primaryText}
            </div>
          )}
          {el.secondaryText && (
            <div
              style={{
                fontSize: "24px",
                fontWeight: "600",
                color: "#d6c7b2",
                marginTop: "6px"
              }}
            >
              {el.secondaryText}
            </div>
          )}
        </div>
      );
    }

    if (el.type === "footer") {
      return (
        <div
          style={{
            fontSize: `${s.fontSize || 22}px`,
            color: s.color || "#d6c7b2",
            textAlign: "center",
            lineHeight: 1.4,
            fontWeight: "600",
            maxWidth: `${s.maxWidth || Math.round(nominalWidth * 0.9)}px`
          }}
        >
          {el.allies && <div style={{ marginBottom: "6px", textTransform: "uppercase", letterSpacing: "1px" }}>{el.allies}</div>}
          {el.socials && <div style={{ color: "#ffffff", fontWeight: "700" }}>{el.socials}</div>}
        </div>
      );
    }

    // Default text element
    return (
      <div
        style={{
          fontSize: `${s.fontSize || 28}px`,
          fontFamily: s.fontFamily || "'Space Grotesk', sans-serif",
          fontWeight: s.fontWeight || "normal",
          color: s.color || "#ffffff",
          textAlign: s.textAlign || "center",
          textTransform: s.textTransform || "none",
          letterSpacing: `${s.letterSpacing || 0}px`,
          lineHeight: s.lineHeight || 1.2,
          maxWidth: s.maxWidth ? `${s.maxWidth}px` : `${Math.round(nominalWidth * 0.9)}px`,
          backgroundColor: s.backgroundColor !== "transparent" ? s.backgroundColor : undefined,
          borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
          padding: s.paddingY ? `${s.paddingY}px ${s.paddingX}px` : undefined,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word"
        }}
      >
        {el.text}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onClick={() => onSelectElement(null)}
      className="relative flex items-center justify-center p-8 overflow-auto select-none min-h-[500px]"
      style={{
        background: "radial-gradient(#d4d4d8 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px"
      }}
    >
      {/* Visual Canvas Paper */}
      <div
        ref={printRef}
        id="flyer-canvas-export-area"
        style={{
          width: `${nominalWidth}px`,
          height: `${nominalHeight}px`,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          backgroundColor: canvasConfig.backgroundColor || "#1c140e",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(0,0,0,0.8)",
          position: "relative",
          overflow: "hidden"
        }}
        className="rounded-none transition-transform duration-75 shrink-0"
      >
        {/* Background Image & Overlay */}
        {canvasConfig.backgroundImageUrl && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${canvasConfig.backgroundImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: canvasConfig.backgroundBlur ? `blur(${canvasConfig.backgroundBlur}px)` : undefined,
              zIndex: 0
            }}
          />
        )}

        {/* Darkness / Color Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: canvasConfig.backgroundOverlay || "rgba(0,0,0,0.35)",
            zIndex: 1,
            pointerEvents: "none"
          }}
        />

        {/* Flyer Elements Layer */}
        <div className="absolute inset-0 z-10">
          {elements.map((el) => {
            const isSelected = selectedElementId === el.id;

            return (
              <div
                key={el.id}
                onMouseDown={(e) => handleMouseDown(e, el)}
                style={{
                  position: "absolute",
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  transform: "translate(-50%, -50%)",
                  zIndex: el.zIndex || 10,
                  cursor: draggingId === el.id ? "grabbing" : "grab"
                }}
                className={`group transition-shadow ${
                  isSelected ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-black rounded-lg" : ""
                }`}
              >
                {renderElementContent(el)}

                {/* Hover indicator */}
                {!isSelected && (
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-300/80 rounded-lg pointer-events-none" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
