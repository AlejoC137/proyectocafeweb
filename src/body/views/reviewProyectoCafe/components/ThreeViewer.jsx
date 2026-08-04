import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Componente Visor 3D Interactivo y Liviano
 * Construido con Three.js puro para máximo rendimiento y bajo peso.
 */
const ThreeViewer = ({
  colors = { base: '#d97706', secondary: '#451a03', accent: '#f59e0b', roughness: 0.4, metalness: 0.1 },
  textureSettings = { rawStyle: 'flat', wireframe: false, roughness: 0.4 },
  onPartSelect,
  activePart = 'base'
}) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const modelGroupRef = useRef(null);
  const materialsRef = useRef({});
  const isDraggingRef = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });

  const [autoRotate, setAutoRotate] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(1);

  // Inicializar Escena 3D
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    // 1. Escena & Cánvas
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0f172a'); // Dark slate background
    sceneRef.current = scene;

    // 2. Cámara
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(3, 2.5, 4);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // 3. Renderizador WebGL
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Limpiar contenedor e insertar canvas
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Luces Estilizadas
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffeedd, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0xf59e0b, 0.8, 10);
    pointLight.position.set(-3, 2, -2);
    scene.add(pointLight);

    // 5. Malla de Suelo con Sombra
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.01;
    floor.receiveShadow = true;
    scene.add(floor);

    // Grid Helper de Fondo Estilizado
    const gridHelper = new THREE.GridHelper(10, 20, 0xf59e0b, 0x334155);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Grupo del Modelo (Cafetera / Máquina Estilizada Low-Poly)
    const modelGroup = new THREE.Group();
    modelGroupRef.current = modelGroup;
    scene.add(modelGroup);

    // Materiales Dinámicos
    const baseMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.base),
      roughness: colors.roughness || 0.4,
      metalness: colors.metalness || 0.1,
      flatShading: textureSettings.rawStyle === 'flat',
      wireframe: textureSettings.wireframe
    });

    const secondaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.secondary),
      roughness: 0.3,
      metalness: 0.8,
      flatShading: textureSettings.rawStyle === 'flat',
      wireframe: textureSettings.wireframe
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.accent),
      roughness: 0.2,
      metalness: 0.5,
      flatShading: textureSettings.rawStyle === 'flat',
      wireframe: textureSettings.wireframe
    });

    materialsRef.current = { base: baseMat, secondary: secondaryMat, accent: accentMat };

    // --- Construir Estructura 3D Estilizada de Bajo Peso (Cafetera Express / Molino) ---
    // A. Base Principal
    const baseGeo = new THREE.BoxGeometry(1.6, 0.3, 1.4);
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.set(0, 0.15, 0);
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    baseMesh.userData = { partName: 'base' };
    modelGroup.add(baseMesh);

    // B. Cuerpo Trasero (Cuerpo Máquina)
    const bodyGeo = new THREE.BoxGeometry(1.4, 1.8, 0.7);
    const bodyMesh = new THREE.Mesh(bodyGeo, secondaryMat);
    bodyMesh.position.set(0, 1.2, -0.3);
    bodyMesh.castShadow = true;
    bodyMesh.userData = { partName: 'secondary' };
    modelGroup.add(bodyMesh);

    // C. Cabeza de Grupo / Salida Café (Portafiltro)
    const headGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 16);
    const headMesh = new THREE.Mesh(headGeo, accentMat);
    headMesh.position.set(0, 1.4, 0.15);
    headMesh.castShadow = true;
    headMesh.userData = { partName: 'accent' };
    modelGroup.add(headMesh);

    // D. Mango Portafiltro
    const handleGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12);
    const handleMesh = new THREE.Mesh(handleGeo, secondaryMat);
    handleMesh.rotation.z = Math.PI / 2;
    handleMesh.rotation.y = Math.PI / 6;
    handleMesh.position.set(0.45, 1.35, 0.3);
    handleMesh.castShadow = true;
    modelGroup.add(handleMesh);

    // E. Taza de Café Estilizada
    const cupGeo = new THREE.CylinderGeometry(0.25, 0.18, 0.4, 16);
    const cupMesh = new THREE.Mesh(cupGeo, baseMat);
    cupMesh.position.set(0, 0.5, 0.15);
    cupMesh.castShadow = true;
    cupMesh.userData = { partName: 'base' };
    modelGroup.add(cupMesh);

    // F. Botones e Indicadores (Accent)
    const btnGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12);
    const btn1 = new THREE.Mesh(btnGeo, accentMat);
    btn1.rotation.x = Math.PI / 2;
    btn1.position.set(-0.35, 1.8, 0.06);
    btn1.userData = { partName: 'accent' };
    modelGroup.add(btn1);

    const btn2 = btn1.clone();
    btn2.position.set(0, 1.8, 0.06);
    modelGroup.add(btn2);

    const btn3 = btn1.clone();
    btn3.position.set(0.35, 1.8, 0.06);
    modelGroup.add(btn3);

    // 7. Bucle de Animación / Render
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate && modelGroupRef.current) {
        modelGroupRef.current.rotation.y += 0.01;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Manejar Redimensionamiento
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
      scene.clear();
    };
  }, []);

  // Actualizar Materiales en Tiempo Real al Cambiar Props de Color / Textura
  useEffect(() => {
    if (!materialsRef.current.base) return;

    // Actualizar Base
    materialsRef.current.base.color.set(colors.base || '#d97706');
    materialsRef.current.base.roughness = colors.roughness ?? 0.4;
    materialsRef.current.base.metalness = colors.metalness ?? 0.1;
    materialsRef.current.base.flatShading = textureSettings.rawStyle === 'flat';
    materialsRef.current.base.wireframe = !!textureSettings.wireframe;
    materialsRef.current.base.needsUpdate = true;

    // Actualizar Secondary
    materialsRef.current.secondary.color.set(colors.secondary || '#451a03');
    materialsRef.current.secondary.flatShading = textureSettings.rawStyle === 'flat';
    materialsRef.current.secondary.wireframe = !!textureSettings.wireframe;
    materialsRef.current.secondary.needsUpdate = true;

    // Actualizar Accent
    materialsRef.current.accent.color.set(colors.accent || '#f59e0b');
    materialsRef.current.accent.flatShading = textureSettings.rawStyle === 'flat';
    materialsRef.current.accent.wireframe = !!textureSettings.wireframe;
    materialsRef.current.accent.needsUpdate = true;

  }, [colors, textureSettings]);

  // Controles de Rotación Manual por Mouse / Touch
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !modelGroupRef.current) return;

    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    modelGroupRef.current.rotation.y += deltaX * 0.01;
    modelGroupRef.current.rotation.x += deltaY * 0.01;

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Raycaster para Selección de Partes del Modelo al Hacer Click
  const handleCanvasClick = (e) => {
    if (!containerRef.current || !cameraRef.current || !modelGroupRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);

    const intersects = raycaster.intersectObjects(modelGroupRef.current.children, true);
    if (intersects.length > 0) {
      const clickedMesh = intersects[0].object;
      const partName = clickedMesh.userData?.partName || 'base';
      if (onPartSelect) {
        onPartSelect(partName);
      }
    }
  };

  // Zoom Control
  const handleZoom = (delta) => {
    if (!cameraRef.current) return;
    const newZ = Math.max(2, Math.min(8, cameraRef.current.position.z + delta));
    cameraRef.current.position.z = newZ;
    setCurrentZoom(Number((8 / newZ).toFixed(1)));
  };

  // Reset View
  const handleResetView = () => {
    if (!cameraRef.current || !modelGroupRef.current) return;
    cameraRef.current.position.set(3, 2.5, 4);
    cameraRef.current.lookAt(0, 0.5, 0);
    modelGroupRef.current.rotation.set(0, 0, 0);
  };

  return (
    <div className="relative w-full h-[450px] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
      {/* Contenedor del Cánvas WebGL */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      />

      {/* Overlay con Barra de Herramientas Flotante */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 text-white z-20 shadow-lg">
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            autoRotate
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
          title="Activar/Desactivar Rotación Automática"
        >
          {autoRotate ? '🔄 Rotando' : '⏸️ Estático'}
        </button>

        <button
          type="button"
          onClick={() => handleZoom(-0.5)}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all"
          title="Acercar (Zoom In)"
        >
          🔍 +
        </button>

        <button
          type="button"
          onClick={() => handleZoom(0.5)}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all"
          title="Alejar (Zoom Out)"
        >
          🔍 -
        </button>

        <button
          type="button"
          onClick={handleResetView}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-all"
          title="Reiniciar Posición de Cámara"
        >
          🎯 Reset
        </button>
      </div>

      {/* Leyenda Inferior de Controles */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-800/80 pointer-events-none">
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          Haz clic y arrastra para rotar en 3D | Haz clic en la malla para seleccionar pieza
        </span>
        <span className="font-mono text-slate-500">Zoom: {currentZoom}x</span>
      </div>
    </div>
  );
};

export default ThreeViewer;
