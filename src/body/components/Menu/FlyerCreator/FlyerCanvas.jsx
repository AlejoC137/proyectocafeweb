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
  onZoom = () => {},
  pan = { x: 0, y: 0 },
  onPanChange = () => {},
  onOpenEmojiModal = () => {}
}) {
  const containerRef = useRef(null);
  
  // Estado para Pan (desplazamiento del lienzo)
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ startX: 0, startY: 0, origPanX: 0, origPanY: 0 });
  const [isSpaceDown, setIsSpaceDown] = useState(false);

  // Modo edición directa de texto (inline Photoshop style)
  const [editingTextId, setEditingTextId] = useState(null);
  const activeEditableRef = useRef(null);

  // Auto-enfocar el bloque de texto editable cuando se activa la edición directa
  useEffect(() => {
    if (editingTextId && activeEditableRef.current) {
      activeEditableRef.current.focus();
    }
  }, [editingTextId]);

  // Estado para arrastrar (mover elemento)
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Estado para redimensionar con nodos (8 manetas: ancho, alto y esquinas)
  const [resizing, setResizing] = useState(null); // { id, direction, startX, startY, startWidth, startHeight, startFontSize, isPointText }

  const nominalWidth = canvasConfig.width || 1080;
  const nominalHeight = canvasConfig.height || 1920;

  // Detección de tecla Espacio para modo Pan (estilo Canva / Figma)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.code === "Space" &&
        !e.repeat &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA" &&
        !document.activeElement?.isContentEditable
      ) {
        setIsSpaceDown(true);
      }
      if (e.key === "Escape") {
        setEditingTextId(null);
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsSpaceDown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Zoom con Rueda de Ratón No-Pasiva (previene TOTALMENTE el scroll de la ventana)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const zoomDelta = e.deltaY < 0 ? 0.04 : -0.04;
      onZoom(zoomDelta);
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, [onZoom]);

  // Iniciar Pan al hacer clic en el espacio vacío o con botón central / espacio presionado
  const handleContainerMouseDown = (e) => {
    if (e.button === 0 || e.button === 1) {
      onSelectElement(null);
      setEditingTextId(null);
      setIsPanning(true);
      setPanStart({
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y
      });
    }
  };

  // Iniciar Arrastre de Movimiento de Elemento
  const handleMouseDown = (e, el) => {
    // Si estamos editando el texto del bloque, permitir interacción nativa de selección de texto
    if (editingTextId === el.id) {
      return;
    }

    if (isSpaceDown || e.button === 1) {
      handleContainerMouseDown(e);
      return;
    }

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

  // Doble clic para activar edición de texto directa en el lienzo (como en Photoshop)
  const handleElementDoubleClick = (e, el) => {
    e.stopPropagation();
    if (el.type === "text" || el.type === "badge") {
      setEditingTextId(el.id);
      setDraggingId(null);
    }
  };

  // Iniciar Redimensionamiento de Elemento desde cualquier nodo (8 direcciones)
  const handleResizeStart = (e, el, direction, currentWidth, currentHeight) => {
    e.stopPropagation();
    const parentEl = e.currentTarget.parentElement;
    const computedW = currentWidth || parentEl?.offsetWidth || (el.textType === "point" ? 400 : 700);
    const computedH = currentHeight || parentEl?.offsetHeight || el.height || 160;

    setResizing({
      id: el.id,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: computedW,
      startHeight: computedH,
      startFontSize: el.style?.fontSize || 28,
      isPointText: el.textType === "point"
    });
  };

  // Event Listeners globales para Pan, Arrastrar y Redimensionar
  useEffect(() => {
    const handleMouseMove = (e) => {
      // 1. Manejar Pan del Lienzo
      if (isPanning) {
        const deltaX = e.clientX - panStart.startX;
        const deltaY = e.clientY - panStart.startY;
        onPanChange({
          x: Math.round(panStart.origPanX + deltaX),
          y: Math.round(panStart.origPanY + deltaY)
        });
        return;
      }

      // 2. Manejar Redimensionamiento desde Nodos (Ancho y Alto)
      if (resizing) {
        const deltaScreenX = e.clientX - resizing.startX;
        const deltaScreenY = e.clientY - resizing.startY;
        const deltaNominalX = Math.round(deltaScreenX / scale);
        const deltaNominalY = Math.round(deltaScreenY / scale);

        let newWidth = resizing.startWidth;
        let newHeight = resizing.startHeight;
        let newFontSize = resizing.startFontSize;

        // Modificar Ancho según dirección horizontal
        if (resizing.direction.includes("e")) {
          newWidth = Math.max(100, Math.min(nominalWidth, resizing.startWidth + deltaNominalX * 2));
        } else if (resizing.direction.includes("w")) {
          newWidth = Math.max(100, Math.min(nominalWidth, resizing.startWidth - deltaNominalX * 2));
        }

        // Modificar Alto según dirección vertical
        if (resizing.direction.includes("s")) {
          newHeight = Math.max(40, Math.min(nominalHeight, resizing.startHeight + deltaNominalY * 2));
        } else if (resizing.direction.includes("n")) {
          newHeight = Math.max(40, Math.min(nominalHeight, resizing.startHeight - deltaNominalY * 2));
        }

        // Si es Texto Suelto (point text) y se redimensiona desde una esquina, escalar fontSize
        if (resizing.isPointText && resizing.direction.length === 2) {
          const ratio = newWidth / resizing.startWidth;
          newFontSize = Math.max(14, Math.min(220, Math.round(resizing.startFontSize * ratio)));
        }

        const targetEl = elements.find((el) => el.id === resizing.id);
        if (targetEl) {
          onUpdateElement({
            ...targetEl,
            width: newWidth,
            height: newHeight,
            style: {
              ...(targetEl.style || {}),
              width: newWidth,
              height: newHeight,
              fontSize: newFontSize
            }
          });
        }
        return;
      }

      // 3. Manejar Movimiento (Drag de elemento)
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
      setIsPanning(false);
      setDraggingId(null);
      setResizing(null);
    };

    if (isPanning || draggingId || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isPanning,
    panStart,
    draggingId,
    dragOffset,
    resizing,
    elements,
    scale,
    nominalWidth,
    nominalHeight,
    onUpdateElement,
    onPanChange
  ]);

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

    // Default text element (Point Text o Area Text)
    const isEditing = editingTextId === el.id;
    const isPoint = el.textType === "point";
    const isArea = el.textType === "area";

    const textStyles = {
      fontSize: `${s.fontSize || 28}px`,
      fontFamily: s.fontFamily || "'Space Grotesk', sans-serif",
      fontWeight: s.fontWeight || "normal",
      fontStyle: s.fontStyle || "normal",
      color: s.color || "#ffffff",
      textAlign: s.textAlign || (isArea ? "justify" : "center"),
      textJustify: "inter-word",
      textTransform: s.textTransform || "none",
      letterSpacing: `${s.letterSpacing || 0}px`,
      lineHeight: s.lineHeight || 1.25,
      backgroundColor: s.backgroundColor && s.backgroundColor !== "transparent" ? s.backgroundColor : undefined,
      border: s.borderWidth ? `${s.borderWidth}px solid ${s.borderColor || "#c59b27"}` : undefined,
      borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
      padding: s.paddingY ? `${s.paddingY}px ${s.paddingX || 0}px` : (isArea ? "12px 16px" : undefined),
      whiteSpace: isPoint ? "pre" : "pre-wrap",
      wordBreak: "break-word",
      boxSizing: "border-box",
      width: "100%",
      height: isArea ? "100%" : "auto",
      display: isArea ? "flex" : "block",
      flexDirection: "column",
      justifyContent: s.verticalAlign === "center" ? "center" : s.verticalAlign === "bottom" ? "flex-end" : "flex-start"
    };

    if (isEditing) {
      return (
        <div className="relative w-full h-full select-text">
          {/* Barra flotante estilo Photoshop de edición de texto */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute -top-14 left-1/2 -translate-x-1/2 bg-black/95 text-white border-2 border-yellow-400 rounded-lg px-2 py-1 flex items-center gap-1.5 shadow-2xl z-50 whitespace-nowrap select-none"
          >
            {/* Toggle Tipo: Suelto vs Caja */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                const nextType = isArea ? "point" : "area";
                onUpdateElement({
                  ...el,
                  textType: nextType,
                  width: nextType === "area" ? (el.width || 720) : undefined,
                  height: nextType === "area" ? (el.height || 180) : undefined,
                  style: {
                    ...s,
                    textAlign: nextType === "area" ? "justify" : (s.textAlign === "justify" ? "center" : s.textAlign)
                  }
                });
              }}
              className="px-2 h-6 bg-zinc-800 hover:bg-zinc-700 text-yellow-300 rounded text-[10px] font-black uppercase flex items-center gap-1 border border-zinc-600"
              title={isArea ? "Convertir a Texto Suelto" : "Convertir a Caja Justificada"}
            >
              {isArea ? "⬛ Caja" : "📌 Suelto"}
            </button>

            <div className="h-4 w-[1px] bg-zinc-700" />

            {/* Negrita: aplica a texto seleccionado o bloque completo */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                  document.execCommand("bold", false, null);
                  if (activeEditableRef.current) {
                    onUpdateElement({
                      ...el,
                      text: activeEditableRef.current.innerText,
                      html: activeEditableRef.current.innerHTML
                    });
                  }
                } else {
                  const isBold = s.fontWeight === "bold" || s.fontWeight === "800" || s.fontWeight === "900";
                  onUpdateElement({ ...el, style: { ...s, fontWeight: isBold ? "normal" : "800" } });
                }
              }}
              className={`w-6 h-6 rounded text-xs font-black flex items-center justify-center ${
                s.fontWeight === "bold" || s.fontWeight === "800" || s.fontWeight === "900" ? "bg-yellow-400 text-black" : "hover:bg-zinc-800 text-white"
              }`}
              title="Negrita (B)"
            >
              B
            </button>

            {/* Cursiva */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => {
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                  document.execCommand("italic", false, null);
                  if (activeEditableRef.current) {
                    onUpdateElement({
                      ...el,
                      text: activeEditableRef.current.innerText,
                      html: activeEditableRef.current.innerHTML
                    });
                  }
                } else {
                  const isItalic = s.fontStyle === "italic";
                  onUpdateElement({ ...el, style: { ...s, fontStyle: isItalic ? "normal" : "italic" } });
                }
              }}
              className={`w-6 h-6 rounded text-xs font-serif italic flex items-center justify-center ${
                s.fontStyle === "italic" ? "bg-yellow-400 text-black" : "hover:bg-zinc-800 text-white"
              }`}
              title="Cursiva (I)"
            >
              I
            </button>

            <div className="h-4 w-[1px] bg-zinc-700" />

            {/* Tamaño Fuente */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onUpdateElement({ ...el, style: { ...s, fontSize: Math.max(12, (s.fontSize || 28) - 4) } })}
              className="px-1.5 h-6 hover:bg-zinc-800 rounded text-xs font-bold text-white"
              title="Reducir tamaño fuente"
            >
              A-
            </button>
            <span className="text-[10px] font-mono font-bold w-6 text-center text-white">{s.fontSize || 28}</span>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onUpdateElement({ ...el, style: { ...s, fontSize: Math.min(220, (s.fontSize || 28) + 4) } })}
              className="px-1.5 h-6 hover:bg-zinc-800 rounded text-xs font-bold text-white"
              title="Aumentar tamaño fuente"
            >
              A+
            </button>

            <div className="h-4 w-[1px] bg-zinc-700" />

            {/* Selector de Color (aplica a selección o bloque) */}
            <input
              type="color"
              value={s.color || "#ffffff"}
              onChange={(e) => {
                const newCol = e.target.value;
                const sel = window.getSelection();
                if (sel && !sel.isCollapsed) {
                  document.execCommand("foreColor", false, newCol);
                  if (activeEditableRef.current) {
                    onUpdateElement({
                      ...el,
                      text: activeEditableRef.current.innerText,
                      html: activeEditableRef.current.innerHTML
                    });
                  }
                } else {
                  onUpdateElement({ ...el, style: { ...s, color: newCol } });
                }
              }}
              className="w-5 h-5 border border-white rounded cursor-pointer p-0 bg-transparent"
              title="Color de texto (o de la palabra seleccionada)"
            />

            <div className="h-4 w-[1px] bg-zinc-700" />

            {/* Alineación */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onUpdateElement({ ...el, style: { ...s, textAlign: "left" } })}
              className={`px-1.5 h-6 rounded text-[10px] font-bold ${s.textAlign === "left" ? "bg-yellow-400 text-black" : "hover:bg-zinc-800 text-white"}`}
              title="Alinear Izquierda"
            >
              Izq
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onUpdateElement({ ...el, style: { ...s, textAlign: "center" } })}
              className={`px-1.5 h-6 rounded text-[10px] font-bold ${(!s.textAlign || s.textAlign === "center") ? "bg-yellow-400 text-black" : "hover:bg-zinc-800 text-white"}`}
              title="Alinear Centro"
            >
              Cen
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onUpdateElement({ ...el, style: { ...s, textAlign: "right" } })}
              className={`px-1.5 h-6 rounded text-[10px] font-bold ${s.textAlign === "right" ? "bg-yellow-400 text-black" : "hover:bg-zinc-800 text-white"}`}
              title="Alinear Derecha"
            >
              Der
            </button>
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onUpdateElement({ ...el, style: { ...s, textAlign: "justify" } })}
              className={`px-1.5 h-6 rounded text-[10px] font-bold ${s.textAlign === "justify" ? "bg-yellow-400 text-black" : "hover:bg-zinc-800 text-white"}`}
              title="Justificar Texto (Bloque Rectangular)"
            >
              Just
            </button>

            <div className="h-4 w-[1px] bg-zinc-700" />

            {/* Emojis y Sellos */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => onOpenEmojiModal()}
              className="px-1.5 h-6 hover:bg-zinc-800 rounded text-xs"
              title="Insertar Emoji o Sello"
            >
              😀
            </button>

            {/* Listo */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={() => setEditingTextId(null)}
              className="bg-yellow-400 text-black px-2 h-6 rounded text-xs font-black hover:bg-yellow-300"
              title="Listo (Esc)"
            >
              ✓ Listo
            </button>
          </div>

          {/* Bloque editable interactivo directo en el lienzo */}
          <div
            ref={activeEditableRef}
            contentEditable={true}
            suppressContentEditableWarning={true}
            spellCheck={false}
            onMouseDown={(e) => e.stopPropagation()}
            onInput={(e) => {
              onUpdateElement({
                ...el,
                text: e.currentTarget.innerText,
                html: e.currentTarget.innerHTML
              });
            }}
            onBlur={(e) => {
              onUpdateElement({
                ...el,
                text: e.currentTarget.innerText,
                html: e.currentTarget.innerHTML
              });
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditingTextId(null);
              }
            }}
            dangerouslySetInnerHTML={el.html ? { __html: el.html } : undefined}
            style={{
              ...textStyles,
              outline: "2px dashed #facc15",
              outlineOffset: "3px",
              cursor: "text"
            }}
          >
            {!el.html && el.text}
          </div>
        </div>
      );
    }

    if (el.html) {
      return (
        <div
          style={textStyles}
          dangerouslySetInnerHTML={{ __html: el.html }}
        />
      );
    }

    return (
      <div style={textStyles}>
        {el.text}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleContainerMouseDown}
      onDoubleClick={(e) => {
        if (e.target === containerRef.current || e.target.id === "flyer-canvas-export-area") {
          onPanChange({ x: 0, y: 0 });
        }
      }}
      className={`w-full h-full flex-1 relative flex items-center justify-center p-4 overflow-hidden select-none ${
        isPanning ? "cursor-grabbing" : isSpaceDown ? "cursor-grab" : "cursor-grab"
      }`}
      style={{
        background: "radial-gradient(#c5c2ba 1.5px, transparent 1.5px)",
        backgroundSize: "24px 24px",
        backgroundColor: "#dedad3"
      }}
    >
      {/* Contenedor Sizer con soporte de Pan (translate) */}
      <div
        style={{
          width: `${Math.round(nominalWidth * scale)}px`,
          height: `${Math.round(nominalHeight * scale)}px`,
          position: "relative",
          margin: "auto",
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transition: isPanning ? "none" : "transform 0.08s ease-out",
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
              const isEditing = editingTextId === el.id;

              const isBadge = el.type === "badge" && !el.width;
              const isPoint = el.textType === "point";
              const isArea = el.textType === "area";

              const currentWidth = el.width || el.style?.width || (
                el.type === "container" ? 780 :
                isArea ? 750 :
                isPoint ? undefined :
                el.type === "text" ? (el.style?.maxWidth || 850) :
                el.type === "footer" ? 900 :
                undefined
              );

              const currentHeight = el.height || el.style?.height || (
                el.type === "container" ? 220 :
                isArea ? 180 :
                undefined
              );

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el)}
                  onDoubleClick={(e) => handleElementDoubleClick(e, el)}
                  style={{
                    position: "absolute",
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    transform: "translate(-50%, -50%)",
                    width: isBadge || isPoint ? "max-content" : `${currentWidth}px`,
                    height: isArea && currentHeight ? `${currentHeight}px` : "auto",
                    maxWidth: "none",
                    whiteSpace: isBadge || isPoint ? "nowrap" : "normal",
                    boxSizing: "border-box",
                    zIndex: isEditing ? 50 : el.zIndex || 10,
                    cursor: isEditing ? "text" : draggingId === el.id ? "grabbing" : "grab"
                  }}
                  className={`group ${
                    isSelected && !isEditing ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-black rounded-lg" : ""
                  }`}
                >
                  {renderElementContent(el)}

                  {/* Manetas de Redimensionamiento Interactivas (8 Nodos Estilo Photoshop) */}
                  {isSelected && !isBadge && !isEditing && (
                    <>
                      {/* Borde guía */}
                      <div className="absolute inset-0 border border-yellow-400/70 pointer-events-none rounded" />

                      {/* 1. Maneta Este (Derecha) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "e", currentWidth, currentHeight)}
                        className="absolute top-1/2 -right-2.5 -translate-y-1/2 w-3.5 h-7 bg-yellow-400 border-2 border-black rounded-full cursor-ew-resize z-30 shadow hover:scale-110 active:bg-yellow-500"
                        title="Cambiar Ancho"
                      />

                      {/* 2. Maneta Oeste (Izquierda) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "w", currentWidth, currentHeight)}
                        className="absolute top-1/2 -left-2.5 -translate-y-1/2 w-3.5 h-7 bg-yellow-400 border-2 border-black rounded-full cursor-ew-resize z-30 shadow hover:scale-110 active:bg-yellow-500"
                        title="Cambiar Ancho"
                      />

                      {/* 3. Maneta Sur (Abajo) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "s", currentWidth, currentHeight)}
                        className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-7 h-3.5 bg-yellow-400 border-2 border-black rounded-full cursor-ns-resize z-30 shadow hover:scale-110 active:bg-yellow-500"
                        title="Cambiar Alto"
                      />

                      {/* 4. Maneta Norte (Arriba) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "n", currentWidth, currentHeight)}
                        className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-7 h-3.5 bg-yellow-400 border-2 border-black rounded-full cursor-ns-resize z-30 shadow hover:scale-110 active:bg-yellow-500"
                        title="Cambiar Alto"
                      />

                      {/* 5. Esquina Inferior Derecha (SE) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "se", currentWidth, currentHeight)}
                        className="absolute -bottom-2.5 -right-2.5 w-4 h-4 bg-yellow-400 border-2 border-black rounded-sm cursor-nwse-resize z-30 shadow hover:scale-125 active:bg-yellow-500"
                        title="Redimensionar Proporcional"
                      />

                      {/* 6. Esquina Inferior Izquierda (SW) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "sw", currentWidth, currentHeight)}
                        className="absolute -bottom-2.5 -left-2.5 w-4 h-4 bg-yellow-400 border-2 border-black rounded-sm cursor-nesw-resize z-30 shadow hover:scale-125 active:bg-yellow-500"
                        title="Redimensionar Proporcional"
                      />

                      {/* 7. Esquina Superior Derecha (NE) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "ne", currentWidth, currentHeight)}
                        className="absolute -top-2.5 -right-2.5 w-4 h-4 bg-yellow-400 border-2 border-black rounded-sm cursor-nesw-resize z-30 shadow hover:scale-125 active:bg-yellow-500"
                        title="Redimensionar Proporcional"
                      />

                      {/* 8. Esquina Superior Izquierda (NW) */}
                      <div
                        onMouseDown={(e) => handleResizeStart(e, el, "nw", currentWidth, currentHeight)}
                        className="absolute -top-2.5 -left-2.5 w-4 h-4 bg-yellow-400 border-2 border-black rounded-sm cursor-nwse-resize z-30 shadow hover:scale-125 active:bg-yellow-500"
                        title="Redimensionar Proporcional"
                      />
                    </>
                  )}

                  {/* Indicador de hover */}
                  {!isSelected && !isEditing && (
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-300/80 rounded-lg pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Píldora de atajos e indicador de Pan / Zoom */}
      <div className="absolute bottom-3 left-4 z-20 pointer-events-none bg-black/85 backdrop-blur-sm text-yellow-300 text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg border border-black flex items-center gap-2">
        <span>🖐️ Clic y arrastra para Pan (o barra espaciadora)</span>
        <span className="text-zinc-500">•</span>
        <span>🔍 Rueda para Zoom</span>
        <span className="text-zinc-500">•</span>
        <span>🎯 Doble clic para Centrar</span>
      </div>
    </div>
  );
}
