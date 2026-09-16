// =========================================================
// LIENZO INTERACTIVO WYSIWYG PARA FLYER STUDIO
// Renderizado exacto, redimensionamiento interactivo de elementos,
// prevención de deformación, zoom con scroll y ajuste perfecto de espacio.
// =========================================================

import React, { useRef, useState, useEffect } from "react";

export default function FlyerCanvas({
  canvasConfig = {},
  elements = [],
  selectedElementId = null,
  onSelectElement = () => {},
  onUpdateElement = () => {},
  printRef = null,
  scale = 0.5,
  onZoom = () => {}
}) {
  const containerRef = useRef(null);
  
  // Estado para arrastrar (mover)
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Estado para redimensionar ancho de elementos
  const [resizing, setResizing] = useState(null); // { id, direction, startX, startWidth }

  const nominalWidth = canvasConfig.width || 1080;
  const nominalHeight = canvasConfig.height || 1920;

  // Iniciar Arrastre de Movimiento
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

  // Iniciar Redimensionamiento de Elemento
  const handleResizeStart = (e, el, direction, currentWidth) => {
    e.stopPropagation();
    setResizing({
      id: el.id,
      direction,
      startX: e.clientX,
      startWidth: currentWidth || (el.type === "container" ? 780 : 850)
    });
  };

  // Event Listeners globales para Arrastrar y Redimensionar
  useEffect(() => {
    const handleMouseMove = (e) => {
      // 1. Manejar Redimensionamiento
      if (resizing) {
        const deltaScreenX = e.clientX - resizing.startX;
        const deltaNominalX = Math.round(deltaScreenX / scale);
        // Como el elemento tiene transform translate(-50%, -50%), expandir hacia la derecha duplica delta
        const factor = resizing.direction === "left" ? -2 : 2;
        const newWidth = Math.max(160, Math.min(nominalWidth, resizing.startWidth + deltaNominalX * factor));

        const targetEl = elements.find((el) => el.id === resizing.id);
        if (targetEl) {
          onUpdateElement({
            ...targetEl,
            width: newWidth,
            style: {
              ...(targetEl.style || {}),
              width: newWidth
            }
          });
        }
        return;
      }

      // 2. Manejar Movimiento (Drag)
      if (draggingId) {
        const deltaScreenX = e.clientX - dragOffset.startX;
        const deltaScreenY = e.clientY - dragOffset.startY;

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
      }
    };

    const handleMouseUp = () => {
      setDraggingId(null);
      setResizing(null);
    };

    if (draggingId || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingId, dragOffset, resizing, elements, scale, nominalWidth, nominalHeight, onUpdateElement]);

  // Manejar Zoom mediante Rueda de Desplazamiento (Scroll Wheel)
  const handleWheel = (e) => {
    // Si la rueda gira sobre el lienzo, ajustar el zoom
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.04 : -0.04;
    onZoom(zoomDelta);
  };

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
            width: "100%",
            boxSizing: "border-box",
            textAlign: s.textAlign || "center",
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
            width: "100%",
            boxSizing: "border-box",
            fontSize: `${s.fontSize || 22}px`,
            color: s.color || "#d6c7b2",
            textAlign: s.textAlign || "center",
            lineHeight: 1.4,
            fontWeight: "600"
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
          width: "100%",
          boxSizing: "border-box",
          fontSize: `${s.fontSize || 28}px`,
          fontFamily: s.fontFamily || "'Space Grotesk', sans-serif",
          fontWeight: s.fontWeight || "normal",
          color: s.color || "#ffffff",
          textAlign: s.textAlign || "center",
          textTransform: s.textTransform || "none",
          letterSpacing: `${s.letterSpacing || 0}px`,
          lineHeight: s.lineHeight || 1.2,
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
      onWheel={handleWheel}
      className="w-full h-full flex-1 flex items-center justify-center p-6 overflow-auto select-none"
      style={{
        background: "radial-gradient(#d4d4d8 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px"
      }}
    >
      {/* Contenedor Sizer que ocupa EXACTAMENTE las dimensiones visuales escaladas (evita márgenes fantasma) */}
      <div
        style={{
          width: `${Math.round(nominalWidth * scale)}px`,
          height: `${Math.round(nominalHeight * scale)}px`,
          position: "relative",
          margin: "auto",
          flexShrink: 0
        }}
      >
        {/* Hoja de diseño exportable con transform-origin top-left */}
        <div
          ref={printRef}
          id="flyer-canvas-export-area"
          style={{
            width: `${nominalWidth}px`,
            height: `${nominalHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: canvasConfig.backgroundColor || "#1c140e",
            boxShadow: "0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(0,0,0,0.8)",
            overflow: "hidden"
          }}
          className="rounded-none transition-none select-none"
        >
          {/* Imagen de Fondo */}
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

          {/* Capa de Oscurecimiento (Overlay) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: canvasConfig.backgroundOverlay || "rgba(0,0,0,0.35)",
              zIndex: 1,
              pointerEvents: "none"
            }}
          />

          {/* Capa de Elementos del Flyer */}
          <div className="absolute inset-0 z-10">
            {elements.map((el) => {
              const isSelected = selectedElementId === el.id;

              // Ancho fijo e inmutable durante el movimiento para que NO se deforme ni encoja
              const isBadge = el.type === "badge" && !el.width;
              const currentWidth = el.width || el.style?.width || (
                el.type === "container" ? 780 :
                el.type === "text" ? (el.style?.maxWidth || 850) :
                el.type === "footer" ? 900 :
                undefined
              );

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el)}
                  style={{
                    position: "absolute",
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    transform: "translate(-50%, -50%)",
                    width: isBadge ? "max-content" : `${currentWidth}px`,
                    maxWidth: "none",
                    whiteSpace: isBadge ? "nowrap" : "normal",
                    boxSizing: "border-box",
                    zIndex: el.zIndex || 10,
                    cursor: draggingId === el.id ? "grabbing" : "grab"
                  }}
                  className={`group ${
                    isSelected ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-black rounded-lg" : ""
                  }`}
                >
                  {renderElementContent(el)}

                  {/* Manetas de Redimensionamiento Interactivas (Estilo Canva) */}
                  {isSelected && !isBadge && (
                    <>
                      {/* Maneta derecha */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "right", currentWidth)}
                        className="absolute top-1/2 -right-3 -translate-y-1/2 w-4 h-8 bg-yellow-400 border-2 border-black rounded-full cursor-ew-resize z-30 shadow-md hover:scale-110 active:bg-yellow-500"
                        title="Arrastra para cambiar ancho"
                      />

                      {/* Maneta izquierda */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "left", currentWidth)}
                        className="absolute top-1/2 -left-3 -translate-y-1/2 w-4 h-8 bg-yellow-400 border-2 border-black rounded-full cursor-ew-resize z-30 shadow-md hover:scale-110 active:bg-yellow-500"
                        title="Arrastra para cambiar ancho"
                      />

                      {/* Maneta esquina inferior derecha */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "corner", currentWidth)}
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-yellow-400 border-2 border-black rounded-full cursor-nwse-resize z-30 shadow-md hover:scale-110 active:bg-yellow-500"
                        title="Arrastra para redimensionar"
                      />
                    </>
                  )}

                  {/* Indicador de hover */}
                  {!isSelected && (
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-300/80 rounded-lg pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
