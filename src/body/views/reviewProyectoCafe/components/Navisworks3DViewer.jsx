import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Edges } from '@react-three/drei';
import * as THREE from 'three';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActivePart,
  setSelectedElementInfo
} from '../../../../redux/slices/modelSlice';

/**
 * Geometría de Malla Triangulada Real (Revit Solid Mesh)
 */
const MeshGeometry = ({ meshData }) => {
  const geomRef = useRef();

  useEffect(() => {
    if (!geomRef.current || !meshData) return;
    const { vertices, indices, normals } = meshData;
    if (!vertices || vertices.length === 0) return;

    geomRef.current.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    if (normals && normals.length > 0) {
      geomRef.current.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    } else {
      geomRef.current.computeVertexNormals();
    }

    if (indices && indices.length > 0) {
      geomRef.current.setIndex(indices);
    }
  }, [meshData]);

  return <bufferGeometry ref={geomRef} />;
};

/**
 * Elemento BIM Dinámico (Soporta Malla Real y Cajas Suaves con Bordes estilo Revit)
 */
const DynamicBimElement = ({ element, visualStyle, activePart, onSelectPart, clippingPlane, centerOffset }) => {
  const isTechnical = visualStyle === 'revitTechnical';
  const isSelected = activePart === element.id || activePart === element.element_id || activePart === element.category || activePart === element.layer;

  const rawColor = element.color_hex || element.color;
  const itemColor = isSelected ? '#3b82f6' : rawColor || (isTechnical ? '#ffffff' : '#cbd5e1');
  const edgeColor = isSelected ? '#60a5fa' : (isTechnical ? '#0f172a' : '#475569');

  const rawPos = element.position || [0, 0, 0];
  const pos = [
    rawPos[0] - (centerOffset[0] || 0),
    rawPos[1] - (centerOffset[1] || 0),
    rawPos[2] - (centerOffset[2] || 0)
  ];

  const rot = element.rotation || [0, 0, 0];
  const dims = element.dimensions || [1, 1, 1];
  const geometryType = element.geometry_type || element.type || 'box';

  const handleClick = (e) => {
    e.stopPropagation();
    onSelectPart(element.element_id || element.id, {
      id: element.element_id || element.id,
      name: element.name || 'Elemento BIM',
      detail: element.quick_params ? `${element.quick_params.Family || ''} - ${element.quick_params.Type || ''}` : (element.detail || ''),
      price: element.price || '',
      category: element.category || 'BIM-GENERIC',
      quick_params: element.quick_params || {},
      level: element.level || ''
    });
  };

  return (
    <group position={pos} rotation={rot} onClick={handleClick}>
      <mesh castShadow receiveShadow>
        {element.mesh_data ? (
          <MeshGeometry meshData={element.mesh_data} />
        ) : geometryType === 'cylinder' ? (
          <cylinderGeometry args={[dims[0], dims[1], dims[2] || 1, 24]} />
        ) : geometryType === 'sphere' ? (
          <sphereGeometry args={[dims[0] || 0.5, 24, 24]} />
        ) : (
          <boxGeometry args={dims} />
        )}

        <meshStandardMaterial
          color={itemColor}
          metalness={0.1}
          roughness={0.4}
          clippingPlanes={clippingPlane ? [clippingPlane] : []}
        />

        <Edges color={edgeColor} threshold={30} />
      </mesh>

      {element.hasCallout && (
        <Html position={[0, dims[1] / 2 + 0.5, 0]} center distanceFactor={10}>
          <div className="bg-white/95 text-slate-900 border-2 border-slate-900 px-3 py-1.5 rounded-lg shadow-xl text-center min-w-[130px] pointer-events-auto transform transition-transform hover:scale-105">
            <div className="font-black text-xs uppercase tracking-tight">
              {element.calloutLabel || element.name}
            </div>
            <div className="text-[10px] text-slate-600 font-medium">
              {element.calloutSub || element.detail || element.quick_params?.Type}
            </div>
            {element.price && (
              <div className="text-xs font-black text-blue-600 mt-0.5">
                {element.price}
              </div>
            )}
            <div className="w-0.5 h-4 bg-slate-900 mx-auto mt-1" />
          </div>
        </Html>
      )}
    </group>
  );
};

/**
 * Escena Modelo BIM
 */
const CafeBimModel = ({ bimData, sectionCut, showSectionBox, layers, visualStyle, activePart, onSelectPart }) => {
  const clippingPlane = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), sectionCut * 3));

  useEffect(() => {
    clippingPlane.current.constant = sectionCut * 3;
  }, [sectionCut]);

  const nodesList = bimData?.nodes || bimData?.elements || [];
  const centerOffset = bimData?.section_box?.center || [0, 0, 0];

  return (
    <group position={[0, 0, 0]}>
      <gridHelper args={[20, 20, '#64748b', '#334155']} position={[0, -0.01, 0]} />

      {nodesList.map((node, index) => {
        const layerKey = (node.category || node.layer || 'walls').toLowerCase().replace(/[^a-z0-9]/g, '_');

        if (layers && layers[layerKey] === false) return null;

        return (
          <DynamicBimElement
            key={node.element_id || node.id || index}
            element={node}
            visualStyle={visualStyle}
            activePart={activePart}
            onSelectPart={onSelectPart}
            clippingPlane={clippingPlane.current}
            centerOffset={centerOffset}
          />
        );
      })}

      {showSectionBox && (
        <mesh position={[0, (sectionCut * 2.5) / 2, 0]}>
          <boxGeometry args={[9.8, sectionCut * 2.5, 5.8]} />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.15} />
        </mesh>
      )}
    </group>
  );
};

const Navisworks3DViewer = () => {
  const dispatch = useDispatch();
  const modelState = useSelector((state) => state.model || {});
  const {
    bimData,
    cameraMode = 'orthographic',
    presetView = 'iso',
    visualStyle = 'revitTechnical',
    sectionCut = 1.0,
    showSectionBox = false,
    activePart
  } = modelState;

  const layers = modelState.layers || {};
  const controlsRef = useRef();

  const totalNodesCount = bimData?.nodes?.length || bimData?.elements?.length || 0;

  useEffect(() => {
    if (!controlsRef.current) return;

    if (presetView === 'iso') {
      controlsRef.current.object.position.set(7, 6, 8);
      controlsRef.current.target.set(0, 1, 0);
    } else if (presetView === 'top') {
      controlsRef.current.object.position.set(0, 12, 0.1);
      controlsRef.current.target.set(0, 0, 0);
    } else if (presetView === 'front') {
      controlsRef.current.object.position.set(0, 2, 10);
      controlsRef.current.target.set(0, 1, 0);
    } else if (presetView === 'side') {
      controlsRef.current.object.position.set(10, 2, 0);
      controlsRef.current.target.set(0, 1, 0);
    }
    controlsRef.current.update();
  }, [presetView]);

  const handleSelectPart = (partId, info) => {
    dispatch(setActivePart(partId));
    if (info) {
      dispatch(setSelectedElementInfo(info));
    }
  };

  if (!bimData || totalNodesCount === 0) {
    return (
      <div className="relative w-full h-[580px] bg-slate-950 rounded-2xl border border-slate-800 flex flex-col items-center justify-center p-8 text-center select-none shadow-2xl">
        <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-4xl mb-4 shadow-inner">
          🏗️
        </div>
        <h3 className="text-xl font-black text-white mb-2">Visor BIM 3D Vacío</h3>
        <p className="text-slate-400 text-xs max-w-md mb-6 leading-relaxed">
          No hay ningún modelo cargado actualmente. Carga un archivo <code className="bg-slate-900 text-amber-400 font-mono px-2 py-0.5 rounded border border-slate-800">.json</code> exportado desde Revit o Supabase.
        </p>
        <button
          type="button"
          onClick={() => document.querySelector('input[type="file"]')?.click()}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          📥 Cargar JSON BIM Ahora
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[580px] bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-800 flex flex-col select-none">
      
      {/* BARRA SUPERIOR VISTAS NAVISWORKS */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-300 dark:border-slate-800 shadow-lg pointer-events-auto text-xs font-semibold">
          <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-lg font-bold">
            🏠 {'{3D}'}
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-lg pointer-events-auto">
          <span>🏗️ {totalNodesCount} Nodos BIM Cargados</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      <Canvas
        shadows
        gl={{ localClippingEnabled: true, antialias: true }}
        camera={{
          position: [7, 6, 8],
          fov: cameraMode === 'perspective' ? 45 : 35,
          near: 0.1,
          far: 1000
        }}
      >
        <ambientLight intensity={visualStyle === 'revitTechnical' ? 1.2 : 0.8} />
        <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
        <directionalLight position={[-10, 10, -5]} intensity={0.5} />

        <CafeBimModel
          bimData={bimData}
          sectionCut={sectionCut}
          showSectionBox={showSectionBox}
          layers={layers}
          visualStyle={visualStyle}
          activePart={activePart}
          onSelectPart={handleSelectPart}
        />

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02}
        />
      </Canvas>

      <div className="absolute top-16 right-4 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-2 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xl flex flex-col items-center gap-1">
        <span className="text-[10px] font-extrabold uppercase text-slate-400">ViewCube</span>
        <div className="grid grid-cols-3 gap-1 w-20 h-20 bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => dispatch({ type: 'model/setPresetView', payload: 'top' })}
            className="col-span-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[9px] rounded py-0.5 cursor-pointer"
          >
            TOP
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'model/setPresetView', payload: 'side' })}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[8px] rounded cursor-pointer"
          >
            LEFT
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'model/setPresetView', payload: 'iso' })}
            className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-[8px] rounded cursor-pointer"
          >
            3D
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'model/setPresetView', payload: 'front' })}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-[8px] rounded cursor-pointer"
          >
            FRONT
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navisworks3DViewer;
