import React, { useState, useRef } from 'react';
import { 
  Plus, Trash2, RotateCcw, RotateCw, Copy, Move, Check, 
  Sparkles, Sliders, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Download, Eye, Database, Cloud, Loader2, DoorOpen, ArrowLeftRight, ArrowUpDown, AppWindow
} from 'lucide-react';
import defaultCadLayout from '../../../assets/data/plantaCustomLayout.json';
import dxfSvgData from '../../../assets/data/plantaDxfSvgData.json';

const EQUIPOS_PRESETS = [
  {
    id: 'batidora-20l',
    nombre: 'Batidora Planetaria 20 Litros',
    tipo: 'BATIDORA',
    dimensiones: '0.55m x 0.50m',
    capacidadBowlLitros: 20,
    capacidadMasaBatidaKg: 14.0,
    capacidadTartasVascas: 14,
    capacidadCroissants: 60,
    tiempoCicloMin: 15,
    potenciaElectrica: '1.5 kW / 220V',
    cuelloDeBotellaDesc: 'Permite preparar hasta 14 tartas vascas por tanda (3x más que la de 6L).',
    posicion: { x: 70, y: 50, width: 18, height: 18, rotacion: 0, color: '#2563eb' }
  },
  {
    id: 'abatidor-temp',
    nombre: 'Abatidor de Temperatura (5 Bandejas 60x40)',
    tipo: 'ABATIDOR',
    dimensiones: '0.75m x 0.74m',
    capacidadTartasVascas: 20,
    capacidadCroissants: 60,
    tiempoCicloMin: 90,
    potenciaElectrica: '1.2 kW',
    temperaturaRango: '-40°C a +3°C',
    cuelloDeBotellaDesc: 'Enfría 20 tartas hirviendo a +3°C en 90 min (elimina el cuello de botella de frío).',
    posicion: { x: 70, y: 38, width: 22, height: 24, rotacion: 0, color: '#0284c7' }
  },
  {
    id: 'laminadora-mesa',
    nombre: 'Laminadora de Masas (Hojaldre y Croissant)',
    tipo: 'LAMINADORA',
    dimensiones: '1.00m x 0.85m',
    capacidadTartasVascas: 0,
    capacidadCroissants: 48,
    tiempoCicloMin: 10,
    potenciaElectrica: '750 W',
    cuelloDeBotellaDesc: 'Lamina hojaldres en 10 min continuos sin fatiga en mesón manual.',
    posicion: { x: 38, y: 72, width: 26, height: 20, rotacion: 0, color: '#d97706' }
  },
  {
    id: 'meson-inox-extra',
    nombre: 'Mesón Inox Auxiliar (1.00m x 0.60m)',
    tipo: 'AREA_PREPARACION',
    dimensiones: '1.00m x 0.60m',
    material: 'Acero Inox AISI 304',
    capacidadTartasVascas: 8,
    capacidadCroissants: 30,
    tiempoCicloMin: 10,
    cuelloDeBotellaDesc: 'Área de manipulación para un segundo operario de pastelería.',
    posicion: { x: 36, y: 74, width: 28, height: 18, rotacion: 0, color: '#059669' }
  },
  {
    id: 'horno-segunda-camara',
    nombre: 'Segundo Horno Doble Cámara (70x85 cm)',
    tipo: 'HORNO',
    dimensiones: '0.70m x 0.85m',
    camaras: 2,
    capacidadTartasVascas: 8,
    capacidadCroissants: 24,
    tiempoCalentamientoMin: 20,
    tiempoCicloMin: 38,
    cuelloDeBotellaDesc: 'Duplica al 100% el techo de horneado simultáneo de la planta.',
    posicion: { x: 12, y: 44, width: 26, height: 28, rotacion: 0, color: '#ea580c' }
  },
  {
    id: 'puerta-batiente-80',
    nombre: 'Puerta Batiente Estándar (0.80m)',
    tipo: 'PUERTA',
    dimensiones: '0.80m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 0.80,
    fondoM: 0.12,
    mano: 'izq',
    apertura: 'interior',
    cuelloDeBotellaDesc: 'Acceso peatonal con arco de barrido hacia el interior.',
    posicion: { x: 26, y: 96, width: 25, height: 4, rotacion: 0, color: '#2563eb' }
  },
  {
    id: 'puerta-batiente-90',
    nombre: 'Puerta Obrador Carros (0.90m)',
    tipo: 'PUERTA',
    dimensiones: '0.90m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 0.90,
    fondoM: 0.12,
    mano: 'izq',
    apertura: 'interior',
    cuelloDeBotellaDesc: 'Paso ancho para operarios con carros bandejeros.',
    posicion: { x: 26, y: 96, width: 28, height: 4, rotacion: 0, color: '#1d4ed8' }
  },
  {
    id: 'puerta-doble-140',
    nombre: 'Puerta Doble Hoja (1.40m)',
    tipo: 'PUERTA_DOBLE',
    dimensiones: '1.40m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 1.40,
    fondoM: 0.12,
    mano: 'izq',
    apertura: 'interior',
    cuelloDeBotellaDesc: 'Acceso amplio para ingreso de carros bandejeros y maquinaria.',
    posicion: { x: 20, y: 96, width: 44, height: 4, rotacion: 0, color: '#1d4ed8' }
  },
  {
    id: 'puerta-corredera-100',
    nombre: 'Puerta Corredera (1.00m)',
    tipo: 'PUERTA_CORREDERA',
    dimensiones: '1.00m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 1.00,
    fondoM: 0.12,
    mano: 'der',
    cuelloDeBotellaDesc: 'Puerta deslizante sobre riel que no consume espacio de barrido.',
    posicion: { x: 26, y: 96, width: 31, height: 4, rotacion: 0, color: '#0284c7' }
  },
  {
    id: 'puerta-vaiven-90',
    nombre: 'Puerta Vaivén Cocina (0.90m)',
    tipo: 'PUERTA_VAIVEN',
    dimensiones: '0.90m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 0.90,
    fondoM: 0.12,
    mano: 'izq',
    cuelloDeBotellaDesc: 'Puerta vaivén de doble acción para paso rápido sin manos.',
    posicion: { x: 26, y: 96, width: 28, height: 4, rotacion: 0, color: '#2563eb' }
  },
  {
    id: 'ventana-estandar-100',
    nombre: 'Ventana Batiente (1.00m)',
    tipo: 'VENTANA',
    subtipo: 'BATIENTE',
    dimensiones: '1.00m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 1.00,
    fondoM: 0.12,
    cuelloDeBotellaDesc: 'Vano con marco de aluminio y doble acristalamiento abatible.',
    posicion: { x: 34, y: 0, width: 31, height: 4, rotacion: 0, color: '#0284c7' }
  },
  {
    id: 'ventana-corredera-120',
    nombre: 'Ventana Corredera (1.20m)',
    tipo: 'VENTANA',
    subtipo: 'CORREDERA',
    dimensiones: '1.20m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 1.20,
    fondoM: 0.12,
    cuelloDeBotellaDesc: 'Ventana de dos hojas correderas con marco estanco de aluminio.',
    posicion: { x: 30, y: 0, width: 37, height: 4, rotacion: 0, color: '#0284c7' }
  },
  {
    id: 'ventanal-amplio-160',
    nombre: 'Ventanal Panorámico Vitrina (1.60m)',
    tipo: 'VENTANA',
    subtipo: 'FIJA',
    dimensiones: '1.60m x 0.12m',
    categoria: 'ARQUITECTURA',
    anchoM: 1.60,
    fondoM: 0.12,
    cuelloDeBotellaDesc: 'Ventanal panorámico fijo vitrina con doble vidrio térmico hacia salón o fachada.',
    posicion: { x: 25, y: 0, width: 50, height: 4, rotacion: 0, color: '#0369a1' }
  }
];

// RENDERIZADOR ARQUITECTÓNICO CAD DE PUERTAS (BATIENTE, DOBLE, CORREDERA, VAIVÉN)
function DoorCadRenderer({ item }) {
  const rot = item.posicion?.rotacion || 0;
  const w = item.posicion?.width || 25;
  const h = item.posicion?.height || 4;
  const mano = item.mano || 'izq'; // 'izq' o 'der'
  const apertura = item.apertura || 'interior'; // 'interior' o 'exterior'
  const tipo = item.tipo || 'PUERTA';
  const esVertical = (rot === 90 || rot === 270) || (w < h);

  // 1. PUERTA CORREDERA (SLIDING)
  if (tipo === 'PUERTA_CORREDERA') {
    if (esVertical) {
      return (
        <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 15 100" preserveAspectRatio="none">
          <rect x="0" y="0" width="15" height="8" fill="#0f172a" />
          <rect x="0" y="92" width="15" height="8" fill="#0f172a" />
          <line x1="7.5" y1="-20" x2="7.5" y2="180" stroke="#475569" strokeWidth="2" strokeDasharray="3 2" />
          <rect x={rot === 270 ? -5 : 14} y="6" width="6" height="88" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" rx="1" />
          <path d="M 7.5 35 L 7.5 65 M 4 58 L 7.5 65 L 11 58" stroke="#1e40af" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 15" preserveAspectRatio="none">
        <rect x="0" y="0" width="8" height="15" fill="#0f172a" />
        <rect x="92" y="0" width="8" height="15" fill="#0f172a" />
        <line x1="-20" y1="7.5" x2="180" y2="7.5" stroke="#475569" strokeWidth="2" strokeDasharray="3 2" />
        <rect x="6" y={rot === 180 ? 14 : -5} width="88" height="6" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" rx="1" />
        <path d="M 35 7.5 L 65 7.5 M 58 4 L 65 7.5 L 58 11" stroke="#1e40af" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  // 2. PUERTA DOBLE HOJA (TWO LEAF)
  if (tipo === 'PUERTA_DOBLE') {
    if (esVertical) {
      const swingRight = (rot === 90 && apertura === 'interior') || (rot === 270 && apertura === 'exterior');
      const flipX = swingRight ? 1 : -1;
      return (
        <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 15 100" preserveAspectRatio="none">
          <rect x="0" y="0" width="15" height="8" fill="#0f172a" />
          <rect x="0" y="92" width="15" height="8" fill="#0f172a" />
          <line x1="7.5" y1="8" x2="7.5" y2="92" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
          <g transform={flipX === -1 ? 'scale(-1, 1) translate(-15, 0)' : undefined}>
            {/* Hoja Superior */}
            <path d="M 15 8 L 15 50 A 42 42 0 0 0 57 8 Z" fill="rgba(37, 99, 235, 0.14)" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="3 3" />
            <line x1="15" y1="8" x2="57" y2="8" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="15" cy="8" r="3" fill="#1e3a8a" />
            {/* Hoja Inferior */}
            <path d="M 15 92 L 15 50 A 42 42 0 0 1 57 92 Z" fill="rgba(37, 99, 235, 0.14)" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="3 3" />
            <line x1="15" y1="92" x2="57" y2="92" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="15" cy="92" r="3" fill="#1e3a8a" />
          </g>
        </svg>
      );
    }
    const swingUp = (rot === 0 && apertura === 'interior') || (rot === 180 && apertura === 'exterior');
    const flipY = swingUp ? 1 : -1;
    return (
      <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 15" preserveAspectRatio="none">
        <rect x="0" y="0" width="8" height="15" fill="#0f172a" />
        <rect x="92" y="0" width="8" height="15" fill="#0f172a" />
        <line x1="8" y1="7.5" x2="92" y2="7.5" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
        <g transform={flipY === -1 ? 'scale(1, -1) translate(0, -15)' : undefined}>
          {/* Hoja Izquierda */}
          <path d="M 8 0 L 50 0 A 42 42 0 0 0 8 -42 Z" fill="rgba(37, 99, 235, 0.14)" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="3 3" />
          <line x1="8" y1="0" x2="8" y2="-42" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="8" cy="0" r="3" fill="#1e3a8a" />
          {/* Hoja Derecha */}
          <path d="M 92 0 L 50 0 A 42 42 0 0 1 92 -42 Z" fill="rgba(37, 99, 235, 0.14)" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="3 3" />
          <line x1="92" y1="0" x2="92" y2="-42" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="92" cy="0" r="3" fill="#1e3a8a" />
        </g>
      </svg>
    );
  }

  // 3. PUERTA VAIVÉN COCINA
  if (tipo === 'PUERTA_VAIVEN') {
    if (esVertical) {
      return (
        <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 15 100" preserveAspectRatio="none">
          <rect x="0" y="0" width="15" height="8" fill="#0f172a" />
          <rect x="0" y="92" width="15" height="8" fill="#0f172a" />
          <line x1="7.5" y1="8" x2="7.5" y2="92" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
          <path d="M 7.5 92 A 84 84 0 0 0 50 8" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2 3" />
          <path d="M 7.5 92 A 84 84 0 0 1 -35 8" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2 3" />
          <circle cx="7.5" cy="8" r="3" fill="#1e3a8a" />
        </svg>
      );
    }
    return (
      <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 15" preserveAspectRatio="none">
        <rect x="0" y="0" width="8" height="15" fill="#0f172a" />
        <rect x="92" y="0" width="8" height="15" fill="#0f172a" />
        <line x1="8" y1="7.5" x2="92" y2="7.5" stroke="#1d4ed8" strokeWidth="3" strokeLinecap="round" />
        <path d="M 92 7.5 A 84 84 0 0 0 8 -40" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M 92 7.5 A 84 84 0 0 1 8 55" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2 3" />
        <circle cx="8" cy="7.5" r="3" fill="#1e3a8a" />
      </svg>
    );
  }

  // 4. PUERTA BATIENTE SIMPLE ESTÁNDAR
  if (esVertical) {
    const swingRight = (rot === 90 && apertura === 'interior') || (rot === 270 && apertura === 'exterior');
    const isTopHinge = mano === 'izq';
    const flipX = swingRight ? 1 : -1;

    return (
      <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 15 100" preserveAspectRatio="none">
        <rect x="0" y="0" width="15" height="8" fill="#0f172a" />
        <rect x="0" y="92" width="15" height="8" fill="#0f172a" />
        <line x1="7.5" y1="8" x2="7.5" y2="92" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />

        <g transform={flipX === -1 ? 'scale(-1, 1) translate(-15, 0)' : undefined}>
          {isTopHinge ? (
            <>
              <path 
                d="M 15 8 L 15 92 A 84 84 0 0 0 99 8 Z" 
                fill="rgba(37, 99, 235, 0.14)" 
                stroke="#2563eb" 
                strokeWidth="1.6" 
                strokeDasharray="4 3" 
              />
              <line x1="15" y1="8" x2="99" y2="8" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="15" cy="8" r="3.5" fill="#1e3a8a" />
              <circle cx="91" cy="12" r="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
            </>
          ) : (
            <>
              <path 
                d="M 15 92 L 15 8 A 84 84 0 0 1 99 92 Z" 
                fill="rgba(37, 99, 235, 0.14)" 
                stroke="#2563eb" 
                strokeWidth="1.6" 
                strokeDasharray="4 3" 
              />
              <line x1="15" y1="92" x2="99" y2="92" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="15" cy="92" r="3.5" fill="#1e3a8a" />
              <circle cx="91" cy="88" r="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
            </>
          )}
        </g>
      </svg>
    );
  }

  // Horizontal (Muro Sur 0° o Muro Norte 180°)
  const swingUp = (rot === 0 && apertura === 'interior') || (rot === 180 && apertura === 'exterior');
  const isLeftHinge = mano === 'izq';
  const flipY = swingUp ? 1 : -1;

  return (
    <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 15" preserveAspectRatio="none">
      <rect x="0" y="0" width="8" height="15" fill="#0f172a" />
      <rect x="92" y="0" width="8" height="15" fill="#0f172a" />
      <line x1="8" y1="7.5" x2="92" y2="7.5" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />

      <g transform={flipY === -1 ? 'scale(1, -1) translate(0, -15)' : undefined}>
        {isLeftHinge ? (
          <>
            <path 
              d="M 8 0 L 92 0 A 84 84 0 0 0 8 -84 Z" 
              fill="rgba(37, 99, 235, 0.14)" 
              stroke="#2563eb" 
              strokeWidth="1.6" 
              strokeDasharray="4 3" 
            />
            <line x1="8" y1="0" x2="8" y2="-84" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="8" cy="0" r="3.5" fill="#1e3a8a" />
            <circle cx="12" cy="-76" r="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          </>
        ) : (
          <>
            <path 
              d="M 92 0 L 8 0 A 84 84 0 0 1 92 -84 Z" 
              fill="rgba(37, 99, 235, 0.14)" 
              stroke="#2563eb" 
              strokeWidth="1.6" 
              strokeDasharray="4 3" 
            />
            <line x1="92" y1="0" x2="92" y2="-84" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="92" cy="0" r="3.5" fill="#1e3a8a" />
            <circle cx="88" cy="-76" r="2.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          </>
        )}
      </g>
    </svg>
  );
}

// RENDERIZADOR ARQUITECTÓNICO CAD DE VENTANAS (BATIENTE, CORREDERA, FIJA/PANORÁMICA)
function WindowCadRenderer({ item }) {
  const rot = item.posicion?.rotacion || 0;
  const w = item.posicion?.width || 31;
  const h = item.posicion?.height || 4;
  const subtipo = item.subtipo || (item.nombre?.toLowerCase().includes('vitrina') || item.nombre?.toLowerCase().includes('panorám') ? 'FIJA' : item.nombre?.toLowerCase().includes('corredera') ? 'CORREDERA' : 'BATIENTE');
  const esVertical = (rot === 90 || rot === 270) || (w < h);

  if (esVertical) {
    return (
      <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 15 100" preserveAspectRatio="none">
        {/* Mochetas / Jambas de muro cortado */}
        <rect x="0" y="0" width="15" height="8" fill="#0f172a" />
        <rect x="0" y="92" width="15" height="8" fill="#0f172a" />

        {/* Alféizar exterior (sill) */}
        <line x1={rot === 270 ? 15 : 0} y1="0" x2={rot === 270 ? 15 : 0} y2="100" stroke="#475569" strokeWidth="2.5" />

        {/* Marco perimetral de carpintería de aluminio */}
        <rect x="1" y="8" width="13" height="84" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.2" rx="0.5" />

        {/* Fondo tintado de cristal aislante */}
        <rect x="3" y="10" width="9" height="80" fill="rgba(56, 189, 248, 0.22)" />

        {/* Doble acristalamiento (dos líneas paralelas de vidrio) */}
        <line x1="5.5" y1="10" x2="5.5" y2="90" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="9.5" y1="10" x2="9.5" y2="90" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />

        {/* Detalles según subtipo */}
        {subtipo === 'CORREDERA' ? (
          <>
            <rect x="1" y="46" width="13" height="8" fill="#e2e8f0" stroke="#0369a1" strokeWidth="1" />
            <path d="M 7.5 24 L 7.5 36 M 4.5 28 L 7.5 24 L 10.5 28" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" fill="none" />
            <path d="M 7.5 76 L 7.5 64 M 4.5 72 L 7.5 76 L 10.5 72" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          </>
        ) : subtipo === 'BATIENTE' ? (
          <>
            <rect x="1" y="47" width="13" height="6" fill="#e2e8f0" stroke="#0369a1" strokeWidth="1" />
            <path d="M 3 10 L 12 29 L 3 47" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
            <path d="M 3 53 L 12 71 L 3 90" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
          </>
        ) : (
          /* FIJA / PANORÁMICA */
          <>
            <line x1="3.5" y1="15" x2="11.5" y2="28" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="3.5" y1="72" x2="11.5" y2="85" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}
      </svg>
    );
  }

  // Horizontal (Muro Norte o Sur)
  return (
    <svg className="w-full h-full overflow-visible pointer-events-none" viewBox="0 0 100 15" preserveAspectRatio="none">
      {/* Mochetas / Jambas de muro cortado */}
      <rect x="0" y="0" width="8" height="15" fill="#0f172a" />
      <rect x="92" y="0" width="8" height="15" fill="#0f172a" />

      {/* Alféizar exterior (sill) */}
      <line x1="0" y1={rot === 180 ? 15 : 0} x2="100" y2={rot === 180 ? 15 : 0} stroke="#475569" strokeWidth="2.5" />

      {/* Marco perimetral de carpintería de aluminio */}
      <rect x="8" y="1" width="84" height="13" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.2" rx="0.5" />

      {/* Fondo tintado de cristal aislante */}
      <rect x="10" y="3" width="80" height="9" fill="rgba(56, 189, 248, 0.22)" />

      {/* Doble acristalamiento (dos líneas paralelas de vidrio) */}
      <line x1="10" y1="5.5" x2="90" y2="5.5" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="9.5" x2="90" y2="9.5" stroke="#0284c7" strokeWidth="1.6" strokeLinecap="round" />

      {/* Detalles según subtipo */}
      {subtipo === 'CORREDERA' ? (
        <>
          <rect x="46" y="1" width="8" height="13" fill="#e2e8f0" stroke="#0369a1" strokeWidth="1" />
          <path d="M 24 7.5 L 36 7.5 M 28 4.5 L 24 7.5 L 28 10.5" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          <path d="M 76 7.5 L 64 7.5 M 72 4.5 L 76 7.5 L 72 10.5" stroke="#0284c7" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      ) : subtipo === 'BATIENTE' ? (
        <>
          <rect x="47" y="1" width="6" height="13" fill="#e2e8f0" stroke="#0369a1" strokeWidth="1" />
          <path d="M 10 3 L 29 12 L 47 3" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
          <path d="M 53 3 L 71 12 L 90 3" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" fill="none" />
        </>
      ) : (
        /* FIJA / PANORÁMICA */
        <>
          <line x1="15" y1="3.5" x2="28" y2="11.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="72" y1="3.5" x2="85" y2="11.5" stroke="rgba(255,255,255,0.85)" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export default function PlantaCadEditor({ 
  equipos = [], 
  setEquipos, 
  dimensionesHabitacion = { ancho: 3.20, largo: 3.10 },
  setDimensionesHabitacion,
  analisisProductos = [],
  horasTurno = 8,
  equipoSeleccionado, 
  setEquipoSeleccionado,
  onResetOriginal,
  syncStatus = 'idle',
  onForceSaveSupabase
}) {
  const canvasRef = useRef(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [guardadoNotif, setGuardadoNotif] = useState(false);
  const [activeYieldTab, setActiveYieldTab] = useState('tarta-basca');
  const [verMuros, setVerMuros] = useState(true);

  // Estados locales para las dimensiones de la habitación
  const anchoHab = Number(dimensionesHabitacion?.ancho || 3.20);
  const largoHab = Number(dimensionesHabitacion?.largo || 3.10);
  const areaHab = (anchoHab * largoHab).toFixed(2);

  const [localAnchoHab, setLocalAnchoHab] = useState(anchoHab.toFixed(2));
  const [localLargoHab, setLocalLargoHab] = useState(largoHab.toFixed(2));

  React.useEffect(() => {
    setLocalAnchoHab(anchoHab.toFixed(2));
  }, [anchoHab]);

  React.useEffect(() => {
    setLocalLargoHab(largoHab.toFixed(2));
  }, [largoHab]);

  const handleUpdateHabitacion = (campo, valorStr) => {
    if (campo === 'ancho') setLocalAnchoHab(valorStr);
    if (campo === 'largo') setLocalLargoHab(valorStr);

    const val = parseFloat(valorStr);
    if (!isNaN(val) && val >= 1.5 && val <= 25.0) {
      if (setDimensionesHabitacion) {
        setDimensionesHabitacion(prev => ({
          ...prev,
          [campo]: Number(val.toFixed(2))
        }));
      }
      triggerGuardado();
    }
  };

  const handleBlurHabitacion = (campo) => {
    if (campo === 'ancho') {
      const val = parseFloat(localAnchoHab);
      if (isNaN(val) || val < 1.5 || val > 25.0) {
        setLocalAnchoHab(anchoHab.toFixed(2));
      } else {
        handleUpdateHabitacion('ancho', val.toFixed(2));
      }
    } else if (campo === 'largo') {
      const val = parseFloat(localLargoHab);
      if (isNaN(val) || val < 1.5 || val > 25.0) {
        setLocalLargoHab(largoHab.toFixed(2));
      } else {
        handleUpdateHabitacion('largo', val.toFixed(2));
      }
    }
  };

  // Drag and Resize tracking state
  const [pointerActiveId, setPointerActiveId] = useState(null);
  const [pointerAction, setPointerAction] = useState('drag'); // 'drag' o 'resize'
  const [resizeHandle, setResizeHandle] = useState(null); // 'se', 'e', 's'
  const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
  const [itemStart, setItemStart] = useState({ x: 0, y: 0, width: 20, height: 20 });

  const eq = equipos.find(e => e.id === equipoSeleccionado?.id) || equipoSeleccionado || equipos[0] || {};

  // Dimensiones calculadas del equipo según el tamaño dinámico de la habitación
  const anchoMetrosCalc = (((eq.posicion?.width || 20) / 100) * anchoHab).toFixed(2);
  const largoMetrosCalc = (((eq.posicion?.height || 20) / 100) * largoHab).toFixed(2);
  const anchoMetros = anchoMetrosCalc;
  const largoMetros = largoMetrosCalc;
  const distMuroIzqMetros = (((eq.posicion?.x || 0) / 100) * anchoHab).toFixed(2);
  const distMuroSupMetros = (((eq.posicion?.y || 0) / 100) * largoHab).toFixed(2);

  // Estados locales para los inputs de texto del equipo
  const [localAncho, setLocalAncho] = useState(anchoMetrosCalc);
  const [localLargo, setLocalLargo] = useState(largoMetrosCalc);

  // Sincronizar inputs locales cuando cambia el equipo seleccionado o cuando se arrastra/redimensiona en el canvas
  React.useEffect(() => {
    setLocalAncho(anchoMetrosCalc);
  }, [eq.id, anchoMetrosCalc]);

  React.useEffect(() => {
    setLocalLargo(largoMetrosCalc);
  }, [eq.id, largoMetrosCalc]);

  // MANEJO DE POINTER EVENTS (ARRASTRE DIRECTO FLUIDO)
  const handlePointerDown = (e, item) => {
    e.stopPropagation();
    setEquipoSeleccionado(item);
    setPointerActiveId(item.id);
    setPointerAction('drag');
    setPointerStart({ x: e.clientX, y: e.clientY });
    setItemStart({ 
      x: item.posicion?.x || 10, 
      y: item.posicion?.y || 10,
      width: item.posicion?.width || 20,
      height: item.posicion?.height || 20
    });
    e.target.setPointerCapture?.(e.pointerId);
  };

  // INICIO DE RESIZE CON MANIJAS (HANDLES)
  const handleResizeStart = (e, item, handle) => {
    e.stopPropagation();
    setEquipoSeleccionado(item);
    setPointerActiveId(item.id);
    setPointerAction('resize');
    setResizeHandle(handle);
    setPointerStart({ x: e.clientX, y: e.clientY });
    setItemStart({
      x: item.posicion?.x || 10,
      y: item.posicion?.y || 10,
      width: item.posicion?.width || 20,
      height: item.posicion?.height || 20
    });
    e.target.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!pointerActiveId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    
    const deltaX = ((e.clientX - pointerStart.x) / rect.width) * 100;
    const deltaY = ((e.clientY - pointerStart.y) / rect.height) * 100;

    if (pointerAction === 'drag') {
      const activeItem = equipos.find(it => it.id === pointerActiveId);
      const esApertura = activeItem?.tipo === 'PUERTA' || activeItem?.tipo === 'PUERTA_DOBLE' || activeItem?.tipo === 'PUERTA_CORREDERA' || activeItem?.tipo === 'PUERTA_VAIVEN' || activeItem?.tipo === 'VENTANA';

      // Margen de muro: 12 cm convertido a porcentaje
      const muroPctX = (0.12 / anchoHab) * 100;
      const muroPctY = (0.12 / largoHab) * 100;

      const w = itemStart.width || 20;
      const h = itemStart.height || 20;

      let newX = Math.round(itemStart.x + deltaX);
      let newY = Math.round(itemStart.y + deltaY);

      if (esApertura) {
        // Puertas y Ventanas: se sitúan sobre los muros perimetrales
        // Imán magnético a los muros (Magnetic Snap) para adherirse al 100% al perímetro exterior
        const snapThreshold = 4.0;
        if (newY <= snapThreshold) newY = 0; // Muro Norte
        else if (newY >= (100 - h - snapThreshold)) newY = 100 - h; // Muro Sur

        if (newX <= snapThreshold) newX = 0; // Muro Oeste
        else if (newX >= (100 - w - snapThreshold)) newX = 100 - w; // Muro Este

        newX = Math.max(0, Math.min(100 - w, newX));
        newY = Math.max(0, Math.min(100 - h, newY));
      } else {
        // Equipos de cocina y mobiliario: ESTRICTAMENTE dentro de los muros (no pueden invadir el muro de 12cm)
        const minX = Math.ceil(muroPctX);
        const maxX = Math.floor(100 - muroPctX - w);
        const minY = Math.ceil(muroPctY);
        const maxY = Math.floor(100 - muroPctY - h);

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));
      }

      setEquipos(prev => prev.map(it => {
        if (it.id === pointerActiveId) {
          return {
            ...it,
            posicion: { ...(it.posicion || {}), x: newX, y: newY }
          };
        }
        return it;
      }));
    } else if (pointerAction === 'resize') {
      const activeItem = equipos.find(it => it.id === pointerActiveId);
      const esApertura = activeItem?.tipo === 'PUERTA' || activeItem?.tipo === 'PUERTA_DOBLE' || activeItem?.tipo === 'PUERTA_CORREDERA' || activeItem?.tipo === 'PUERTA_VAIVEN' || activeItem?.tipo === 'VENTANA';

      const muroPctX = (0.12 / anchoHab) * 100;
      const muroPctY = (0.12 / largoHab) * 100;

      const maxLimitX = esApertura ? 100 : (100 - muroPctX);
      const maxLimitY = esApertura ? 100 : (100 - muroPctY);

      let newW = itemStart.width;
      let newH = itemStart.height;

      if (resizeHandle === 'se' || resizeHandle === 'e') {
        newW = Math.max(4, Math.min(maxLimitX - itemStart.x, Math.round(itemStart.width + deltaX)));
      }
      if (resizeHandle === 'se' || resizeHandle === 's') {
        newH = Math.max(4, Math.min(maxLimitY - itemStart.y, Math.round(itemStart.height + deltaY)));
      }

      setEquipos(prev => prev.map(it => {
        if (it.id === pointerActiveId) {
          const wM = ((newW / 100) * anchoHab).toFixed(2);
          const hM = ((newH / 100) * largoHab).toFixed(2);
          return {
            ...it,
            dimensiones: `${wM}m x ${hM}m`,
            posicion: { ...(it.posicion || {}), width: newW, height: newH }
          };
        }
        return it;
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (pointerActiveId) {
      e.target.releasePointerCapture?.(e.pointerId);
      setPointerActiveId(null);
      triggerGuardado();
    }
  };

  // Mover equipo con botones de flecha (pasos de 2% ~ 6 cm de gran precisión)
  const handleNudge = (dx, dy) => {
    if (!eq.id) return;
    const esApertura = eq.tipo === 'PUERTA' || eq.tipo === 'PUERTA_DOBLE' || eq.tipo === 'PUERTA_CORREDERA' || eq.tipo === 'PUERTA_VAIVEN' || eq.tipo === 'VENTANA';
    const curX = eq.posicion?.x || 10;
    const curY = eq.posicion?.y || 10;
    const w = eq.posicion?.width || 20;
    const h = eq.posicion?.height || 20;

    const muroPctX = (0.12 / anchoHab) * 100;
    const muroPctY = (0.12 / largoHab) * 100;

    let minX = 0;
    let maxX = 100 - w;
    let minY = 0;
    let maxY = 100 - h;

    if (!esApertura) {
      minX = Math.ceil(muroPctX);
      maxX = Math.floor(100 - muroPctX - w);
      minY = Math.ceil(muroPctY);
      maxY = Math.floor(100 - muroPctY - h);
    }

    const newX = Math.max(minX, Math.min(maxX, curX + dx));
    const newY = Math.max(minY, Math.min(maxY, curY + dy));

    setEquipos(prev => prev.map(it => {
      if (it.id === eq.id) {
        return {
          ...it,
          posicion: { ...(it.posicion || {}), x: newX, y: newY }
        };
      }
      return it;
    }));
    triggerGuardado();
  };

  // Rotar equipo 90 grados conservando el centro y respetando muros
  const handleRotate = (anguloDelta = 90) => {
    if (!eq.id) return;
    setEquipos(prev => {
      const updated = prev.map(item => {
        if (item.id === eq.id) {
          const curW = item.posicion?.width || 20;
          const curH = item.posicion?.height || 20;
          const curX = item.posicion?.x || 10;
          const curY = item.posicion?.y || 10;
          const curRot = item.posicion?.rotacion || 0;
          const newRot = ((curRot + anguloDelta) % 360 + 360) % 360;

          // Al rotar 90 o 270 grados se intercambian ancho y alto
          const esGiro90 = Math.abs(anguloDelta) % 180 !== 0;
          let newW = esGiro90 ? curH : curW;
          let newH = esGiro90 ? curW : curH;

          // Conservar el centro geométrico del elemento
          const centroX = curX + (curW / 2);
          const centroY = curY + (curH / 2);
          let newX = Math.round(centroX - (newW / 2));
          let newY = Math.round(centroY - (newH / 2));

          const esApertura = item.tipo === 'PUERTA' || item.tipo === 'PUERTA_DOBLE' || item.tipo === 'PUERTA_CORREDERA' || item.tipo === 'PUERTA_VAIVEN' || item.tipo === 'VENTANA';
          const muroPctX = (0.12 / anchoHab) * 100;
          const muroPctY = (0.12 / largoHab) * 100;

          if (esApertura) {
            // Para puertas y ventanas, garantizar que el vano tenga espesor exacto de muro (12 cm)
            const anchoM = item.anchoM || (esGiro90 ? ((curH / 100) * largoHab) : ((curW / 100) * anchoHab)) || 1.0;
            if (newRot === 90 || newRot === 270) {
              newW = parseFloat(((0.12 / anchoHab) * 100).toFixed(2));
              newH = parseFloat(((anchoM / largoHab) * 100).toFixed(2));
            } else {
              newW = parseFloat(((anchoM / anchoHab) * 100).toFixed(2));
              newH = parseFloat(((0.12 / largoHab) * 100).toFixed(2));
            }

            // Si estaba anclado al muro perimetral, conservarlo pegado al muro
            if (curX <= 1) newX = 0;
            else if (curX + curW >= 99) newX = 100 - newW;
            else newX = Math.max(0, Math.min(100 - newW, newX));

            if (curY <= 1) newY = 0;
            else if (curY + curH >= 99) newY = 100 - newH;
            else newY = Math.max(0, Math.min(100 - newH, newY));
          } else {
            const minX = Math.ceil(muroPctX);
            const maxX = Math.floor(100 - muroPctX - newW);
            const minY = Math.ceil(muroPctY);
            const maxY = Math.floor(100 - muroPctY - newH);
            newX = Math.max(minX, Math.min(maxX, newX));
            newY = Math.max(minY, Math.min(maxY, newY));
          }

          const wM = ((newW / 100) * anchoHab).toFixed(2);
          const hM = ((newH / 100) * largoHab).toFixed(2);

          const newItem = {
            ...item,
            dimensiones: `${wM}m x ${hM}m`,
            posicion: {
              ...(item.posicion || {}),
              x: newX,
              y: newY,
              width: newW,
              height: newH,
              rotacion: newRot
            }
          };

          return newItem;
        }
        return item;
      });
      return updated;
    });
    triggerGuardado();
  };

  const handleRotateTo = (targetDeg) => {
    if (!eq.id) return;
    const curRot = eq.posicion?.rotacion || 0;
    const delta = ((targetDeg - curRot) % 360 + 360) % 360;
    if (delta === 0) return;
    handleRotate(delta);
  };

  const handleUpdateProp = (campo, valor) => {
    setEquipos(prev => prev.map(item => {
      if (item.id === eq.id) {
        return { ...item, [campo]: valor };
      }
      return item;
    }));
  };

  // Alternar mano de la bisagra de la puerta (Izquierda <-> Derecha)
  const handleToggleDoorMano = () => {
    if (!eq.id) return;
    const currentMano = eq.mano || 'izq';
    const newMano = currentMano === 'izq' ? 'der' : 'izq';
    handleUpdateProp('mano', newMano);
    triggerGuardado();
  };

  // Alternar sentido de apertura de la puerta (Hacia Adentro <-> Hacia Afuera)
  const handleToggleDoorApertura = () => {
    if (!eq.id) return;
    const currentAp = eq.apertura || 'interior';
    const newAp = currentAp === 'interior' ? 'exterior' : 'interior';
    handleUpdateProp('apertura', newAp);
    triggerGuardado();
  };

  // Cambiar el tipo de puerta (Batiente Simple, Doble Hoja, Corredera, Vaivén)
  const handleChangeDoorTipo = (nuevoTipo) => {
    if (!eq.id) return;
    const defaultNames = {
      'PUERTA': 'Puerta Batiente Estándar (0.80m)',
      'PUERTA_DOBLE': 'Puerta Doble Hoja (1.40m)',
      'PUERTA_CORREDERA': 'Puerta Corredera (1.00m)',
      'PUERTA_VAIVEN': 'Puerta Vaivén Cocina (0.90m)'
    };
    setEquipos(prev => prev.map(it => {
      if (it.id === eq.id) {
        return {
          ...it,
          tipo: nuevoTipo,
          nombre: defaultNames[nuevoTipo] || it.nombre
        };
      }
      return it;
    }));
    triggerGuardado();
  };

  // Cambiar ancho estándar del vano de la puerta en metros
  const handleSetDoorWidth = (anchoM) => {
    if (!eq.id) return;
    const rot = eq.posicion?.rotacion || 0;
    const esVertical = (rot === 90 || rot === 270);
    
    let newWPct, newHPct;
    if (esVertical) {
      newWPct = parseFloat(((0.12 / anchoHab) * 100).toFixed(2));
      newHPct = parseFloat(((anchoM / largoHab) * 100).toFixed(2));
    } else {
      newWPct = parseFloat(((anchoM / anchoHab) * 100).toFixed(2));
      newHPct = parseFloat(((0.12 / largoHab) * 100).toFixed(2));
    }

    setEquipos(prev => prev.map(it => {
      if (it.id === eq.id) {
        const curX = it.posicion?.x || 0;
        const curY = it.posicion?.y || 0;
        return {
          ...it,
          anchoM: anchoM,
          dimensiones: `${anchoM.toFixed(2)}m x 0.12m`,
          posicion: {
            ...(it.posicion || {}),
            x: Math.max(0, Math.min(100 - newWPct, curX)),
            y: Math.max(0, Math.min(100 - newHPct, curY)),
            width: newWPct,
            height: newHPct
          }
        };
      }
      return it;
    }));
    triggerGuardado();
  };

  // Alternar subtipo de ventana (Batiente <-> Corredera <-> Fija Vitrina)
  const handleToggleWindowSubtipo = () => {
    if (!eq.id) return;
    const tipos = ['BATIENTE', 'CORREDERA', 'FIJA'];
    const curIdx = tipos.indexOf(eq.subtipo || 'BATIENTE');
    const nextSubtipo = tipos[(curIdx + 1) % tipos.length];
    handleChangeWindowSubtipo(nextSubtipo);
  };

  // Cambiar subtipo de ventana directamente
  const handleChangeWindowSubtipo = (nuevoSubtipo) => {
    if (!eq.id) return;
    const labels = {
      'BATIENTE': 'Ventana Batiente',
      'CORREDERA': 'Ventana Corredera',
      'FIJA': 'Ventanal Panorámico Vitrina'
    };
    const curAnchoM = (eq.posicion?.rotacion === 90 || eq.posicion?.rotacion === 270)
      ? parseFloat(largoMetrosCalc)
      : parseFloat(anchoMetrosCalc);

    setEquipos(prev => prev.map(it => {
      if (it.id === eq.id) {
        return {
          ...it,
          subtipo: nuevoSubtipo,
          nombre: `${labels[nuevoSubtipo] || 'Ventana'} (${curAnchoM.toFixed(2)}m)`
        };
      }
      return it;
    }));
    triggerGuardado();
  };

  // Cambiar ancho estándar del vano de la ventana en metros (espesor exacto del muro 0.12m)
  const handleSetWindowWidth = (anchoM) => {
    if (!eq.id) return;
    const rot = eq.posicion?.rotacion || 0;
    const esVertical = (rot === 90 || rot === 270);
    
    let newWPct, newHPct;
    if (esVertical) {
      newWPct = parseFloat(((0.12 / anchoHab) * 100).toFixed(2));
      newHPct = parseFloat(((anchoM / largoHab) * 100).toFixed(2));
    } else {
      newWPct = parseFloat(((anchoM / anchoHab) * 100).toFixed(2));
      newHPct = parseFloat(((0.12 / largoHab) * 100).toFixed(2));
    }

    setEquipos(prev => prev.map(it => {
      if (it.id === eq.id) {
        const curX = it.posicion?.x || 0;
        const curY = it.posicion?.y || 0;
        return {
          ...it,
          anchoM: anchoM,
          dimensiones: `${anchoM.toFixed(2)}m x 0.12m`,
          posicion: {
            ...(it.posicion || {}),
            x: Math.max(0, Math.min(100 - newWPct, curX)),
            y: Math.max(0, Math.min(100 - newHPct, curY)),
            width: newWPct,
            height: newHPct
          }
        };
      }
      return it;
    }));
    triggerGuardado();
  };

  // Modificar dimensiones en metros (Ancho o Largo/Fondo)
  const handleDimensionChange = (tipo, valMetros) => {
    if (tipo === 'ancho') setLocalAncho(valMetros);
    if (tipo === 'largo') setLocalLargo(valMetros);

    if (!eq.id) return;
    const num = parseFloat(valMetros);
    if (isNaN(num) || num <= 0) return;

    // Convertir de metros a porcentaje del canvas según anchoHab x largoHab
    let newWidthPct = eq.posicion?.width || 20;
    let newHeightPct = eq.posicion?.height || 20;

    if (tipo === 'ancho') {
      newWidthPct = Math.max(4, Math.min(95, parseFloat(((num / anchoHab) * 100).toFixed(2))));
    } else if (tipo === 'largo') {
      newHeightPct = Math.max(4, Math.min(95, parseFloat(((num / largoHab) * 100).toFixed(2))));
    }

    const finalAnchoM = ((newWidthPct / 100) * anchoHab).toFixed(2);
    const finalLargoM = ((newHeightPct / 100) * largoHab).toFixed(2);

    setEquipos(prev => prev.map(it => {
      if (it.id === eq.id) {
        return {
          ...it,
          dimensiones: `${finalAnchoM}m x ${finalLargoM}m`,
          posicion: {
            ...(it.posicion || {}),
            width: newWidthPct,
            height: newHeightPct
          }
        };
      }
      return it;
    }));
    triggerGuardado();
  };

  const handleDimensionBlur = (tipo) => {
    if (tipo === 'ancho') {
      const num = parseFloat(localAncho);
      if (isNaN(num) || num < 0.10 || num > anchoHab) {
        setLocalAncho(anchoMetrosCalc);
      } else {
        handleDimensionChange('ancho', num.toFixed(2));
      }
    } else if (tipo === 'largo') {
      const num = parseFloat(localLargo);
      if (isNaN(num) || num < 0.10 || num > largoHab) {
        setLocalLargo(largoMetrosCalc);
      } else {
        handleDimensionChange('largo', num.toFixed(2));
      }
    }
  };

  const triggerGuardado = () => {
    setGuardadoNotif(true);
    setTimeout(() => setGuardadoNotif(false), 2500);
  };

  // Exportar / Descargar layout en archivo JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(equipos, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantaCustomLayout.json';
    a.click();
    URL.revokeObjectURL(url);
    alert('Archivo plantaCustomLayout.json descargado con éxito. Puedes conservarlo en tu proyecto.');
  };

  const handleAddPreset = (preset) => {
    if (!preset) return;
    const nuevoId = preset.id + '-' + Date.now().toString().slice(-4);
    const esPuerta = preset.tipo === 'PUERTA' || preset.tipo === 'PUERTA_DOBLE' || preset.tipo === 'PUERTA_CORREDERA' || preset.tipo === 'PUERTA_VAIVEN';
    const esVentana = preset.tipo === 'VENTANA';
    const rot = preset.posicion?.rotacion || 0;

    let posX = Math.floor(Math.random() * 20) + 35;
    let posY = Math.floor(Math.random() * 20) + 35;
    let wPct = preset.posicion?.width || 20;
    let hPct = preset.posicion?.height || 20;

    if (esPuerta || esVentana) {
      const anchoM = preset.anchoM || 1.00;
      const esVertical = (rot === 90 || rot === 270);
      if (esVertical) {
        wPct = parseFloat(((0.12 / anchoHab) * 100).toFixed(2));
        hPct = parseFloat(((anchoM / largoHab) * 100).toFixed(2));
      } else {
        wPct = parseFloat(((anchoM / anchoHab) * 100).toFixed(2));
        hPct = parseFloat(((0.12 / largoHab) * 100).toFixed(2));
      }

      if (esVentana) {
        // Las ventanas se adhieren por defecto sobre el Muro Superior (Norte)
        posX = 35;
        posY = 0;
      } else {
        // Las puertas se adhieren por defecto sobre el Muro Inferior (Sur)
        posX = 30;
        posY = parseFloat((100 - hPct).toFixed(2));
      }
    }

    const nuevoEquipo = {
      ...preset,
      id: nuevoId,
      nombre: preset.nombre,
      posicion: {
        x: posX,
        y: posY,
        width: wPct,
        height: hPct,
        rotacion: rot,
        color: preset.posicion?.color || '#3b82f6'
      }
    };
    setEquipos(prev => [...prev, nuevoEquipo]);
    setEquipoSeleccionado(nuevoEquipo);
    setShowAddModal(false);
    triggerGuardado();
  };

  const handleDelete = () => {
    if (!eq.id) return;
    if (equipos.length <= 1) {
      alert('La planta debe tener al menos un equipo.');
      return;
    }
    if (window.confirm('¿Deseas eliminar "' + eq.nombre + '" del plano?')) {
      const rest = equipos.filter(item => item.id !== eq.id);
      setEquipos(rest);
      setEquipoSeleccionado(rest[0]);
      triggerGuardado();
    }
  };

  const handleDuplicate = () => {
    if (!eq.id) return;
    const duplicado = {
      ...eq,
      id: eq.id + '-copia-' + Date.now().toString().slice(-4),
      nombre: eq.nombre + ' (Copia)',
      posicion: {
        ...(eq.posicion || { x: 30, y: 30, width: 20, height: 20 }),
        x: Math.min(65, (eq.posicion?.x || 30) + 6),
        y: Math.min(65, (eq.posicion?.y || 30) + 6)
      }
    };
    setEquipos(prev => [...prev, duplicado]);
    setEquipoSeleccionado(duplicado);
    triggerGuardado();
  };

  // Tasa horaria de tartas y croissants
  const yieldHorarioTartas = eq.tiempoCicloMin > 0 
    ? Math.round((60 / eq.tiempoCicloMin) * (eq.capacidadTartasVascas || 8)) 
    : 0;

  const yieldHorarioCroissants = eq.tiempoCicloMin > 0 
    ? Math.round((60 / eq.tiempoCicloMin) * (eq.capacidadCroissants || 24)) 
    : 0;

  return (
    <div className="space-y-1.5">
      {/* Barra de Controles y Guardado */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="px-2 py-0.5 bg-black text-white font-mono text-[11px] font-black uppercase flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            CAD 2D
          </div>

          {/* CONTROLES DE DIMENSIÓN DE LA HABITACIÓN */}
          <div className="flex items-center gap-1.5 bg-gray-100 border border-black px-2 py-0.5 text-xs">
            <span className="font-mono text-gray-700 font-bold uppercase text-[9.5px]">Habitación:</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[9.5px] font-mono font-bold text-gray-500">X:</span>
              <input
                type="text"
                inputMode="decimal"
                value={localAnchoHab}
                onChange={(e) => handleUpdateHabitacion('ancho', e.target.value)}
                onBlur={() => handleBlurHabitacion('ancho')}
                onKeyDown={(e) => e.key === 'Enter' && handleBlurHabitacion('ancho')}
                className="w-11 text-center font-mono font-black text-xs bg-white border border-black px-1 py-0.2"
                title="Ancho de la habitación en metros (Eje X)"
              />
              <span className="font-mono text-[9.5px] font-bold">m</span>
            </div>
            <span className="font-bold text-gray-400">&times;</span>
            <div className="flex items-center gap-0.5">
              <span className="text-[9.5px] font-mono font-bold text-gray-500">Y:</span>
              <input
                type="text"
                inputMode="decimal"
                value={localLargoHab}
                onChange={(e) => handleUpdateHabitacion('largo', e.target.value)}
                onBlur={() => handleBlurHabitacion('largo')}
                onKeyDown={(e) => e.key === 'Enter' && handleBlurHabitacion('largo')}
                className="w-11 text-center font-mono font-black text-xs bg-white border border-black px-1 py-0.2"
                title="Largo de la habitación en metros (Eje Y)"
              />
              <span className="font-mono text-[9.5px] font-bold">m</span>
            </div>
            <span className="px-1.5 py-0.2 bg-black text-white font-mono text-[9.5px] font-black">
              {areaHab} m²
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {/* BOTONES DIRECTOS PARA AÑADIR PUERTA Y VENTANA */}
          <button
            onClick={() => handleAddPreset(EQUIPOS_PRESETS.find(p => p.id === 'puerta-batiente-80'))}
            className="flex items-center gap-1 px-2 py-1 bg-blue-700 text-white font-black text-[11px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-800"
            title="Insertar Puerta Batiente 0.80m con arco de apertura CAD"
          >
            <Plus className="w-3 h-3" /> + Puerta (0.8m)
          </button>

          <button
            onClick={() => handleAddPreset(EQUIPOS_PRESETS.find(p => p.id === 'puerta-doble-140'))}
            className="flex items-center gap-1 px-2 py-1 bg-blue-900 text-white font-black text-[11px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-blue-950"
            title="Insertar Puerta Doble Hoja 1.40m con doble arco de apertura"
          >
            <Plus className="w-3 h-3" /> + Doble (1.4m)
          </button>

          <button
            onClick={() => handleAddPreset(EQUIPOS_PRESETS.find(p => p.id === 'ventana-estandar-100'))}
            className="flex items-center gap-1 px-2 py-1 bg-sky-600 text-white font-black text-[11px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-sky-700"
            title="Insertar Ventana 1.00m con marco y vidrio"
          >
            <Plus className="w-3 h-3" /> + Ventana (1.0m)
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-[#f97316] text-white font-black text-[11px] uppercase border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:bg-orange-600"
          >
            <Plus className="w-3.5 h-3.5" /> Catálogo
          </button>

          <button
            onClick={handleRotate}
            className="flex items-center gap-1 px-2 py-1 bg-white font-bold text-[11px] border border-black hover:bg-gray-100"
            title="Rotar 90 grados"
          >
            <RotateCw className="w-3 h-3" /> Rotar 90°
          </button>

          <button
            onClick={handleDuplicate}
            className="flex items-center gap-1 px-2 py-1 bg-white font-bold text-[11px] border border-black hover:bg-gray-100"
          >
            <Copy className="w-3 h-3" /> Duplicar
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 font-bold text-[11px] border border-red-700 hover:bg-red-100"
          >
            <Trash2 className="w-3 h-3" /> Eliminar
          </button>

          <button
            onClick={onForceSaveSupabase}
            className="flex items-center gap-1 px-2 py-1 bg-emerald-700 text-white font-black text-[11px] border border-black hover:bg-emerald-800 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
            title="Sincronizar y guardar en base de datos Supabase (PostgreSQL)"
          >
            <Cloud className="w-3 h-3" /> Guardar SQL
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-800 font-black text-[11px] border border-blue-800 hover:bg-blue-100"
            title="Descargar archivo plantaCustomLayout.json"
          >
            <Download className="w-3 h-3" /> JSON
          </button>

          <button
            onClick={onResetOriginal}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 font-bold text-[11px] border border-black hover:bg-gray-200"
            title="Restablecer plano al original"
          >
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
        </div>
      </div>

      {/* Banner de Estado de Guardado y Ubicación */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-1 px-2 bg-emerald-50 border border-emerald-600 text-[10.5px] font-bold text-emerald-950">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-emerald-700" />
          <span><b>Sincronización en la Nube:</b> Dimensiones <b>{anchoHab.toFixed(2)}m &times; {largoHab.toFixed(2)}m ({areaHab} m²)</b> en <b>Supabase SQL</b> (PostgreSQL).</span>
        </div>
        <div className="flex items-center gap-1.5">
          {syncStatus === 'syncing' && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white font-black uppercase text-[9.5px] flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
            </span>
          )}
          {syncStatus === 'saved' && (
            <span className="px-1.5 py-0.2 bg-emerald-600 text-white font-black uppercase text-[9.5px] flex items-center gap-1">
              <Check className="w-3 h-3" /> Sincronizado
            </span>
          )}
          {syncStatus === 'error' && (
            <span className="px-1.5 py-0.2 bg-red-600 text-white font-black uppercase text-[9.5px]">
              Error conexión
            </span>
          )}
        </div>
      </div>

      {/* Grid Principal: Canvas 2D + Inspector de Propiedades */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5">
        {/* Lienzo Interactivo CAD 2D */}
        <div className="lg:col-span-8 bg-white border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center">
          {/* Header de Escala Arquitectónica & Capas */}
          <div className="w-full flex flex-wrap justify-between items-center gap-1 text-xs font-bold mb-1 px-0.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-black"></span>
              <span className="font-mono text-gray-900 uppercase font-black tracking-wide text-[10.5px]">
                Plano 2D ({anchoHab.toFixed(2)}m &times; {largoHab.toFixed(2)}m)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setVerMuros(!verMuros)}
                className={`px-2 py-0.2 border border-black font-mono text-[9.5px] font-black uppercase transition-all ${
                  verMuros ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {verMuros ? '✓ Muros' : '✕ Muros'}
              </button>
              <span className="font-mono bg-black text-white px-1.5 py-0.2 text-[9.5px] font-bold">
                {areaHab} m²
              </span>
              <span className="font-mono bg-orange-100 text-orange-900 px-1.5 py-0.2 border border-orange-400 text-[9.5px] font-bold">
                1:1
              </span>
            </div>
          </div>

          {/* Contenedor del Lienzo con Reglas Arquitectónicas Dinámicas */}
          <div className="w-full max-w-3xl flex flex-col items-end">
            {/* Regla Horizontal Superior (Eje X: 0.00m a anchoHab) */}
            <div className="w-full flex items-end">
              {/* Esquina origen (0,0) */}
              <div className="w-7 h-7 bg-black text-white text-[9px] font-mono font-bold flex items-center justify-center border-t-2 border-l-2 border-black select-none shrink-0">
                0,0
              </div>
              {/* Cuerpo de la regla X */}
              <div className="flex-1 h-7 bg-[#f8fafc] border-t-2 border-b-2 border-r-2 border-black relative overflow-hidden select-none">
                {(() => {
                  const anchoCm = Math.round(anchoHab * 100);
                  const numTicksX = Math.round(anchoHab * 10) + 1;
                  return (
                    <svg className="w-full h-full" viewBox={`0 0 ${anchoCm} 28`} preserveAspectRatio="none">
                      <rect x="0" y="0" width={anchoCm} height="28" fill="#f8fafc" />
                      {Array.from({ length: numTicksX }).map((_, i) => {
                        const pos = i * 10;
                        const isMajor = i % 10 === 0;
                        const isMid = i % 5 === 0 && !isMajor;
                        const height = isMajor ? 18 : isMid ? 11 : 6;
                        return (
                          <g key={`tick-x-${i}`}>
                            <line
                              x1={pos}
                              y1={28 - height}
                              x2={pos}
                              y2={28}
                              stroke="#0f172a"
                              strokeWidth={isMajor ? 1.5 : 0.8}
                            />
                            {isMajor && (
                              <text
                                x={pos + 2}
                                y={11}
                                fontSize="8"
                                fontFamily="monospace"
                                fontWeight="bold"
                                fill="#0f172a"
                              >
                                {(i * 0.1).toFixed(1)}m
                              </text>
                            )}
                          </g>
                        );
                      })}
                      <text
                        x={anchoCm - 2}
                        y="11"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#ea580c"
                        textAnchor="end"
                      >
                        {anchoHab.toFixed(2)}m
                      </text>
                    </svg>
                  );
                })()}
              </div>
            </div>

            {/* Fila Central: Regla Vertical Izquierda + Lienzo */}
            <div className="w-full flex">
              {/* Regla Vertical Izquierda (Eje Y: 0.00m a largoHab) */}
              <div className="w-7 bg-[#f8fafc] border-l-2 border-r-2 border-b-2 border-black relative select-none shrink-0 overflow-hidden">
                {(() => {
                  const largoCm = Math.round(largoHab * 100);
                  const numTicksY = Math.round(largoHab * 10) + 1;
                  return (
                    <svg className="w-full h-full" viewBox={`0 0 28 ${largoCm}`} preserveAspectRatio="none">
                      <rect x="0" y="0" width="28" height={largoCm} fill="#f8fafc" />
                      {Array.from({ length: numTicksY }).map((_, i) => {
                        const pos = i * 10;
                        const isMajor = i % 10 === 0;
                        const isMid = i % 5 === 0 && !isMajor;
                        const width = isMajor ? 18 : isMid ? 11 : 6;
                        return (
                          <g key={`tick-y-${i}`}>
                            <line
                              x1={28 - width}
                              y1={pos}
                              x2={28}
                              y2={pos}
                              stroke="#0f172a"
                              strokeWidth={isMajor ? 1.5 : 0.8}
                            />
                            {isMajor && (
                              <text
                                x={3}
                                y={pos + 9}
                                fontSize="7.5"
                                fontFamily="monospace"
                                fontWeight="bold"
                                fill="#0f172a"
                              >
                                {(i * 0.1).toFixed(1)}
                              </text>
                            )}
                          </g>
                        );
                      })}
                      <text
                        x="3"
                        y={largoCm - 4}
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#ea580c"
                      >
                        {largoHab.toFixed(2)}m
                      </text>
                    </svg>
                  );
                })()}
              </div>

              {/* Lienzo Arquitectónico 2D Dinámico */}
              <div 
                ref={canvasRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="flex-1 bg-white border-2 border-black relative p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] select-none overflow-hidden touch-none"
                style={{
                  aspectRatio: `${anchoHab} / ${largoHab}`,
                  backgroundImage: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              >
                {/* Muros Arquitectónicos Reales Perimetrales Adaptativos */}
                {verMuros && (() => {
                  const anchoCm = Math.round(anchoHab * 100);
                  const largoCm = Math.round(largoHab * 100);
                  const muroEspesor = 12; // 12 cm de espesor arquitectónico

                  return (
                    <svg viewBox={`0 0 ${anchoCm} ${largoCm}`} className="absolute inset-0 w-full h-full pointer-events-none z-10">
                      <defs>
                        {/* Patrón rayado arquitectónico para corte de muro a 45 grados */}
                        <pattern id="muroHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <line x1="0" y1="0" x2="0" y2="8" stroke="#334155" strokeWidth="1.5" />
                        </pattern>

                        {/* Máscara de vanos: corta y oculta el muro al 100% bajo puertas y ventanas */}
                        <mask id="muroVanoMask">
                          {/* Blanco = todo el muro visible */}
                          <rect x="-50" y="-50" width={anchoCm + 100} height={largoCm + 100} fill="white" />

                          {/* Negro = huecos que eliminan completamente el muro, trama y bordes */}
                          {equipos.filter(item => 
                            item.tipo === 'PUERTA' || 
                            item.tipo === 'PUERTA_DOBLE' || 
                            item.tipo === 'PUERTA_CORREDERA' || 
                            item.tipo === 'PUERTA_VAIVEN' || 
                            item.tipo === 'VENTANA'
                          ).map(ap => {
                            const xCm = ((ap.posicion?.x ?? 0) / 100) * anchoCm;
                            const yCm = ((ap.posicion?.y ?? 0) / 100) * largoCm;
                            const wCm = ((ap.posicion?.width ?? 20) / 100) * anchoCm;
                            const hCm = ((ap.posicion?.height ?? 4) / 100) * largoCm;

                            let cutX = xCm;
                            let cutY = yCm;
                            let cutW = wCm;
                            let cutH = hCm;

                            // Expansión para corte limpio de borde exterior a interior
                            if (yCm <= muroEspesor * 1.5) {
                              cutY = -6;
                              cutH = Math.max(hCm, muroEspesor) + 8;
                            }
                            if (yCm + hCm >= largoCm - (muroEspesor * 1.5)) {
                              cutH = largoCm - yCm + 12;
                            }
                            if (xCm <= muroEspesor * 1.5) {
                              cutX = -6;
                              cutW = Math.max(wCm, muroEspesor) + 8;
                            }
                            if (xCm + wCm >= anchoCm - (muroEspesor * 1.5)) {
                              cutW = anchoCm - xCm + 12;
                            }

                            return (
                              <rect
                                key={ap.id}
                                x={cutX - 0.5}
                                y={cutY - 0.5}
                                width={cutW + 1}
                                height={cutH + 1}
                                fill="black"
                              />
                            );
                          })}
                        </mask>
                      </defs>

                      {/* Muros perimetrales con corte limpio en cada vano */}
                      <g mask="url(#muroVanoMask)">
                        {/* Muro Superior */}
                        <rect x="0" y="0" width={anchoCm} height={muroEspesor} fill="url(#muroHatch)" stroke="#0f172a" strokeWidth="1.5" />

                        {/* Muro Lateral Izquierdo */}
                        <rect x="0" y="0" width={muroEspesor} height={largoCm} fill="url(#muroHatch)" stroke="#0f172a" strokeWidth="1.5" />

                        {/* Muro Lateral Derecho */}
                        <rect x={anchoCm - muroEspesor} y="0" width={muroEspesor} height={largoCm} fill="url(#muroHatch)" stroke="#0f172a" strokeWidth="1.5" />

                        {/* Muro Inferior */}
                        <rect x="0" y={largoCm - muroEspesor} width={anchoCm} height={muroEspesor} fill="url(#muroHatch)" stroke="#0f172a" strokeWidth="1.5" />
                      </g>

                      {/* Etiqueta técnica de muro */}
                      <text x="16" y="22" fill="#64748b" fontSize="6.5" fontFamily="monospace" fontWeight="bold">MURO e=0.12m</text>
                      <text x={anchoCm - 18} y={largoCm - 16} fill="#64748b" fontSize="6.5" fontFamily="monospace" fontWeight="bold" textAnchor="end">
                        {anchoHab.toFixed(2)}m &times; {largoHab.toFixed(2)}m
                      </text>
                    </svg>
                  );
                })()}

            {/* Cotas Temporales Azules para el equipo seleccionado */}
            {eq.id && (
              <>
                <div 
                  style={{
                    left: '16px',
                    top: (eq.posicion?.y || 0) + '%',
                    width: (eq.posicion?.x || 0) + '%'
                  }}
                  className="absolute h-0.5 border-b border-dashed border-blue-600 pointer-events-none z-20 flex items-center justify-center"
                >
                  <span className="text-[8px] font-mono font-bold bg-blue-600 text-white px-1 -top-2 relative">
                    {distMuroIzqMetros}m
                  </span>
                </div>

                <div 
                  style={{
                    top: '16px',
                    left: (eq.posicion?.x || 0) + '%',
                    height: (eq.posicion?.y || 0) + '%'
                  }}
                  className="absolute w-0.5 border-l border-dashed border-blue-600 pointer-events-none z-20 flex items-center justify-center"
                >
                  <span className="text-[8px] font-mono font-bold bg-blue-600 text-white px-1 -left-3 relative">
                    {distMuroSupMetros}m
                  </span>
                </div>
              </>
            )}

            {/* RENDERIZADO DE EQUIPOS Y ELEMENTOS ARQUITECTÓNICOS BIM */}
            {equipos.map((item) => {
              const isSel = eq.id === item.id;
              const posX = item.posicion?.x ?? 30;
              const posY = item.posicion?.y ?? 30;
              const w = item.posicion?.width ?? 20;
              const h = item.posicion?.height ?? 20;
              const rot = item.posicion?.rotacion ?? 0;
              const itemAnchoM = ((w / 100) * anchoHab).toFixed(2);
              const itemLargoM = ((h / 100) * largoHab).toFixed(2);

              const esPuerta = item.tipo === 'PUERTA' || item.tipo === 'PUERTA_DOBLE' || item.tipo === 'PUERTA_CORREDERA' || item.tipo === 'PUERTA_VAIVEN';
              const esVentana = item.tipo === 'VENTANA';
              const esApertura = esPuerta || esVentana;

              // RENDERIZADO ESPECIALIZADO DE PUERTAS ARQUITECTÓNICAS CAD
              if (esPuerta) {
                return (
                  <div
                    key={item.id}
                    onPointerDown={(e) => handlePointerDown(e, item)}
                    style={{
                      left: posX + '%',
                      top: posY + '%',
                      width: w + '%',
                      height: h + '%'
                    }}
                    className={`absolute cursor-grab active:cursor-grabbing select-none z-30 transition-shadow ${
                      isSel 
                        ? 'ring-2 ring-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.4)]' 
                        : 'hover:ring-1 hover:ring-blue-400'
                    }`}
                    title="Arrastra para mover la puerta por el muro. Clic para configurar bisagra y apertura."
                  >
                    {/* Vano en el muro (cubre y corta el muro perimetral al 100%) */}
                    <div className="absolute inset-0 bg-white" />

                    {/* Gráfico CAD de Puerta con arco de barrido, hoja batiente y marcos */}
                    <DoorCadRenderer item={item} />

                    {/* Etiqueta Técnica CAD Discreta */}
                    <div className="absolute inset-x-0 -bottom-3.5 flex items-center justify-center pointer-events-none z-40">
                      <span className="text-[7.5px] font-mono font-black bg-blue-900 text-white px-1 py-0.2 rounded shadow-sm whitespace-nowrap">
                        {item.tipo === 'PUERTA_DOBLE' ? 'PD' : item.tipo === 'PUERTA_CORREDERA' ? 'PC' : item.tipo === 'PUERTA_VAIVEN' ? 'PV' : 'P1'} • {itemAnchoM}m
                      </span>
                    </div>

                    {/* Barra Flotante de Acciones Rápidas CAD al Seleccionar */}
                    {isSel && (
                      <div 
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 z-50 bg-black/95 px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-gray-700 whitespace-nowrap"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotate(90);
                          }}
                          className="px-1.5 py-0.5 bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-mono font-black rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                          title="Girar puerta 90° (Muro Sur ⇄ Oeste ⇄ Norte ⇄ Este)"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Girar 90°</span>
                          <span className="text-[7.5px] bg-black/30 px-1 rounded">{rot}°</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDoorMano();
                          }}
                          className="px-1.5 py-0.5 bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-mono font-bold rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                          title="Invertir mano de bisagra (Izquierda / Derecha)"
                        >
                          <ArrowLeftRight className="w-3 h-3 text-blue-200" />
                          <span>Bisagra {item.mano === 'der' ? 'Der ➔' : '⬅︎ Izq'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleDoorApertura();
                          }}
                          className="px-1.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-[9px] font-mono font-bold rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                          title="Invertir sentido de apertura (Hacia Adentro / Hacia Afuera)"
                        >
                          <ArrowUpDown className="w-3 h-3 text-emerald-200" />
                          <span>{item.apertura === 'exterior' ? 'Afuera' : 'Adentro'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className="p-1 bg-red-800 hover:bg-red-700 text-white rounded cursor-pointer transition-colors active:scale-95 ml-0.5"
                          title="Eliminar puerta"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Manijas de Redimensionamiento del Vano */}
                    {isSel && (
                      <>
                        {w >= h ? (
                          <div
                            onPointerDown={(e) => handleResizeStart(e, item, 'e')}
                            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-5 bg-blue-600 border-2 border-white rounded cursor-ew-resize z-40 shadow hover:scale-125 transition-transform"
                            title="Arrastra para cambiar el ancho del vano de la puerta"
                          />
                        ) : (
                          <div
                            onPointerDown={(e) => handleResizeStart(e, item, 's')}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-blue-600 border-2 border-white rounded cursor-ns-resize z-40 shadow hover:scale-125 transition-transform"
                            title="Arrastra para cambiar el ancho del vano de la puerta"
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              }

              // RENDERIZADO ESPECIALIZADO DE VENTANAS ARQUITECTÓNICAS CAD
              if (esVentana) {
                const subtipo = item.subtipo || 'BATIENTE';
                return (
                  <div
                    key={item.id}
                    onPointerDown={(e) => handlePointerDown(e, item)}
                    style={{
                      left: posX + '%',
                      top: posY + '%',
                      width: w + '%',
                      height: h + '%'
                    }}
                    className={`absolute cursor-grab active:cursor-grabbing select-none z-30 transition-shadow ${
                      isSel 
                        ? 'ring-2 ring-sky-500 shadow-[0_0_12px_rgba(2,132,199,0.5)]' 
                        : 'hover:ring-1 hover:ring-sky-400'
                    }`}
                    title="Arrastra para mover la ventana por el muro. Clic para configurar carpintería y acristalamiento."
                  >
                    {/* Vano en el muro (cubre y corta el muro perimetral al 100%) */}
                    <div className="absolute inset-0 bg-white" />

                    {/* Gráfico CAD de Ventana con carpintería, alféizar y doble vidrio */}
                    <WindowCadRenderer item={item} />

                    {/* Etiqueta Técnica CAD Discreta */}
                    <div className="absolute inset-x-0 -bottom-3.5 flex items-center justify-center pointer-events-none z-40">
                      <span className="text-[7.5px] font-mono font-black bg-sky-800 text-white px-1 py-0.2 rounded shadow-sm whitespace-nowrap">
                        {subtipo === 'CORREDERA' ? 'VC' : subtipo === 'FIJA' ? 'VF' : 'V1'} • {itemAnchoM}m
                      </span>
                    </div>

                    {/* Barra Flotante de Acciones Rápidas CAD al Seleccionar */}
                    {isSel && (
                      <div 
                        className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 z-50 bg-black/95 px-1.5 py-0.5 rounded shadow-[0_2px_8px_rgba(0,0,0,0.5)] border border-gray-700 whitespace-nowrap"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRotate(90);
                          }}
                          className="px-1.5 py-0.5 bg-sky-700 hover:bg-sky-600 text-white text-[9px] font-mono font-black rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                          title="Girar ventana 90° (Muro Norte/Sur ⇄ Este/Oeste)"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Girar 90°</span>
                          <span className="text-[7.5px] bg-black/30 px-1 rounded">{rot}°</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWindowSubtipo();
                          }}
                          className="px-1.5 py-0.5 bg-blue-700 hover:bg-blue-600 text-white text-[9px] font-mono font-bold rounded flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
                          title="Alternar tipo de ventana (Batiente ⇄ Corredera ⇄ Fija Vitrina)"
                        >
                          <span>{subtipo === 'CORREDERA' ? '⇄ Corredera' : subtipo === 'FIJA' ? '◻ Fija Vitrina' : '🪟 Batiente'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                          }}
                          className="p-1 bg-red-800 hover:bg-red-700 text-white rounded cursor-pointer transition-colors active:scale-95 ml-0.5"
                          title="Eliminar ventana"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Manijas de Redimensionamiento del Vano */}
                    {isSel && (
                      <>
                        {w >= h ? (
                          <div
                            onPointerDown={(e) => handleResizeStart(e, item, 'e')}
                            className="absolute top-1/2 -translate-y-1/2 -right-1.5 w-3 h-5 bg-sky-600 border-2 border-white rounded cursor-ew-resize z-40 shadow hover:scale-125 transition-transform"
                            title="Arrastra para cambiar el ancho del vano de la ventana"
                          />
                        ) : (
                          <div
                            onPointerDown={(e) => handleResizeStart(e, item, 's')}
                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-3 bg-sky-600 border-2 border-white rounded cursor-ns-resize z-40 shadow hover:scale-125 transition-transform"
                            title="Arrastra para cambiar el ancho del vano de la ventana"
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => handlePointerDown(e, item)}
                  style={{
                    left: posX + '%',
                    top: posY + '%',
                    width: w + '%',
                    height: h + '%'
                  }}
                  className={`absolute border-2 cursor-grab active:cursor-grabbing transition-shadow flex flex-col items-center justify-between p-0.5 select-none ${
                    esApertura ? 'z-25' : 'z-20'
                  } ${
                    esVentana
                      ? (isSel ? 'bg-white border-sky-700 ring-2 ring-sky-600 shadow-lg' : 'bg-white/95 border-sky-600 hover:bg-sky-50 shadow-sm')
                      : isSel 
                      ? 'bg-amber-100/95 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ring-2 ring-blue-600' 
                      : 'bg-white/95 border-gray-800 hover:bg-orange-50'
                  }`}
                >
                  {/* Botón Flotante de Rotación 90° Directo en el Canvas */}
                  {isSel && (
                    <div 
                      className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 z-40"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotate(90);
                        }}
                        className="px-2 py-0.5 bg-black hover:bg-orange-600 text-white text-[10px] font-mono font-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)] flex items-center gap-1 cursor-pointer transition-colors active:scale-95 whitespace-nowrap"
                        title="Rotar elemento 90° horario"
                      >
                        <RotateCw className="w-3 h-3 text-orange-400" />
                        <span>Rotar 90°</span>
                        <span className="text-[8px] bg-white/20 px-1 rounded font-bold">{rot}°</span>
                      </button>
                    </div>
                  )}

                  {/* Indicador sutil de cara frontal del equipo */}
                  {!esApertura && (
                    <div 
                      className={`absolute pointer-events-none ${
                        rot === 0 ? 'bottom-0 inset-x-0 h-1 bg-orange-500/80' :
                        rot === 90 ? 'left-0 inset-y-0 w-1 bg-orange-500/80' :
                        rot === 180 ? 'top-0 inset-x-0 h-1 bg-orange-500/80' :
                        'right-0 inset-y-0 w-1 bg-orange-500/80'
                      }`}
                      title={`Frente del equipo: ${rot}°`}
                    />
                  )}

                  {/* Encabezado */}
                  <div className="w-full flex items-center justify-between pointer-events-none px-0.5">
                    <span className="text-[8.5px] font-black text-gray-900 truncate leading-none">
                      {item.nombre.split('(')[0]}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <span className={`text-[7px] font-mono px-1 font-bold ${
                        esVentana ? 'bg-sky-600 text-white' : 'bg-black text-white'
                      }`}>
                        {item.tipo?.slice(0, 5)}
                      </span>
                      {rot > 0 && (
                        <span className="text-[6.5px] font-mono font-bold bg-amber-200 text-amber-900 px-0.5 border border-amber-400">
                          {rot}°
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Moldes gráficos internos */}
                  <div className="w-full flex-1 my-0.5 flex flex-wrap items-center justify-center gap-0.5 overflow-hidden pointer-events-none relative">
                    {item.tipo === 'HORNO' && (
                      <div className="w-full h-full flex flex-col justify-around py-0.5">
                        <div className="flex justify-center gap-1">
                          {[...Array(Math.min(4, item.capacidadTartasVascas || 4))].map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 rounded-full border border-orange-600 bg-orange-400"></div>
                          ))}
                        </div>
                        <div className="flex justify-center gap-1">
                          {[...Array(Math.min(4, Math.max(0, (item.capacidadTartasVascas || 8) - 4)))].map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 rounded-full border border-orange-600 bg-orange-400"></div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.tipo === 'BATIDORA' && (
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-blue-200 flex items-center justify-center font-bold text-[8px] text-blue-900">
                        {item.capacidadBowlLitros || 6}L
                      </div>
                    )}

                    {item.tipo === 'AREA_PREPARACION' && (
                      <div className="w-full h-full border border-dashed border-emerald-600 bg-emerald-100/50 flex items-center justify-center text-[8px] font-mono text-emerald-800">
                        Mesón Inox
                      </div>
                    )}

                    {item.tipo === 'REFRIGERACION' && (
                      <div className="w-full h-full border border-cyan-600 bg-cyan-100 flex flex-col justify-around px-1">
                        <div className="h-0.5 bg-cyan-600"></div>
                        <div className="h-0.5 bg-cyan-600"></div>
                      </div>
                    )}
                  </div>

                  {/* Dimensiones en metros adaptativas */}
                  <div className="w-full text-center text-[7px] font-mono text-gray-700 border-t border-gray-300 pointer-events-none">
                    {itemAnchoM}m &times; {itemLargoM}m
                  </div>

                  {/* MANIJAS DE REDIMENSIONAMIENTO (RESIZE HANDLES) */}
                  {isSel && (
                    <>
                      {/* Manija Esquina Inferior Derecha (Redimensionar Ambos) */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, item, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-600 border-2 border-white rounded-sm cursor-nwse-resize z-30 shadow-md hover:scale-125 transition-transform"
                        title="Arrastra para cambiar ancho y fondo"
                      />
                      {/* Manija Borde Derecho (Ancho) */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, item, 'e')}
                        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-4 bg-blue-600 border border-white rounded-sm cursor-ew-resize z-30 hover:scale-125 transition-transform"
                        title="Arrastra para cambiar ancho"
                      />
                      {/* Manija Borde Inferior (Largo/Fondo) */}
                      <div
                        onPointerDown={(e) => handleResizeStart(e, item, 's')}
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-blue-600 border border-white rounded-sm cursor-ns-resize z-30 hover:scale-125 transition-transform"
                        title="Arrastra para cambiar fondo"
                      />
                    </>
                  )}
                </div>
              );
            })}
              </div>
            </div>
          </div>

          {/* Botones de Control de Movimiento por Pasos (Nudge) y Rotación */}
          <div className="w-full flex flex-wrap items-center justify-between gap-2 mt-4 p-2 bg-gray-50 border border-black text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Mover (6 cm):</span>
              <div className="flex items-center gap-1">
                <button onClick={() => handleNudge(-2, 0)} className="p-1 border border-black bg-white hover:bg-gray-100" title="Izquierda">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleNudge(0, -2)} className="p-1 border border-black bg-white hover:bg-gray-100" title="Arriba">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleNudge(0, 2)} className="p-1 border border-black bg-white hover:bg-gray-100" title="Abajo">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleNudge(2, 0)} className="p-1 border border-black bg-white hover:bg-gray-100" title="Derecha">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-[10px] text-gray-500 ml-1">X: <b>{distMuroIzqMetros}m</b> • Y: <b>{distMuroSupMetros}m</b></span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500 text-[11px]">Rotar elemento:</span>
              <button 
                onClick={() => handleRotate(-90)} 
                className="px-2 py-1 border border-black bg-white hover:bg-orange-50 font-mono text-[10px] flex items-center gap-1"
                title="Rotar -90° (antihorario)"
              >
                <RotateCcw className="w-3 h-3 text-gray-700" /> -90°
              </button>
              <button 
                onClick={() => handleRotate(90)} 
                className="px-2 py-1 border border-black bg-orange-600 text-white hover:bg-orange-700 font-mono text-[10px] flex items-center gap-1 font-bold shadow-sm"
                title="Rotar +90° (horario)"
              >
                <RotateCw className="w-3 h-3 text-white" /> +90° ({eq.posicion?.rotacion || 0}°)
              </button>
            </div>
          </div>
        </div>

        {/* Panel Inspector de Propiedades y Yields */}
        <div className="lg:col-span-4 bg-white border-2 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-2 border-black">
            <div className="flex-1 mr-2">
              <label className="text-[10px] font-mono font-bold uppercase text-gray-500 block mb-0.5">Nombre del Activo</label>
              <input
                type="text"
                value={eq.nombre || ''}
                onChange={(e) => {
                  handleUpdateProp('nombre', e.target.value);
                  triggerGuardado();
                }}
                className="w-full text-sm font-black text-gray-900 border border-black px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Nombre del equipo..."
              />
            </div>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-orange-100 text-orange-800 border border-orange-600 shrink-0 self-end mb-1">
              {eq.tipo || 'EQUIPO'}
            </span>
          </div>

          {/* Control de Orientación / Rotación */}
          <div className="p-3 bg-amber-50/90 border-2 border-black space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-800 flex items-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-orange-600" /> Orientación / Rotación
              </span>
              <span className="text-[10px] font-mono font-black bg-black text-white px-1.5 py-0.5">
                {eq.posicion?.rotacion || 0}° {
                  (eq.posicion?.rotacion || 0) === 0 ? '▼ Sur' :
                  (eq.posicion?.rotacion || 0) === 90 ? '◄ Oeste' :
                  (eq.posicion?.rotacion || 0) === 180 ? '▲ Norte' : '► Este'
                }
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleRotate(-90)}
                className="py-1 px-2 bg-white border border-black font-mono font-bold text-xs hover:bg-orange-100 flex items-center justify-center gap-1 active:bg-orange-200"
                title="Girar 90° antihorario (-90°)"
              >
                <RotateCcw className="w-3.5 h-3.5 text-gray-700" /> Giro -90°
              </button>
              <button
                type="button"
                onClick={() => handleRotate(90)}
                className="py-1 px-2 bg-orange-600 text-white border border-black font-mono font-black text-xs hover:bg-orange-700 flex items-center justify-center gap-1 active:bg-orange-800 shadow-sm"
                title="Girar 90° horario (+90°)"
              >
                <RotateCw className="w-3.5 h-3.5 text-white" /> Giro +90°
              </button>
            </div>

            {/* 4 Orientaciones directas */}
            <div className="grid grid-cols-4 gap-1 pt-1 border-t border-amber-200 text-center font-mono text-[10px]">
              {[
                { deg: 0, label: '0° ▼' },
                { deg: 90, label: '90° ◄' },
                { deg: 180, label: '180° ▲' },
                { deg: 270, label: '270° ►' }
              ].map(p => {
                const isCur = (eq.posicion?.rotacion || 0) === p.deg;
                return (
                  <button
                    key={p.deg}
                    type="button"
                    onClick={() => handleRotateTo(p.deg)}
                    className={`py-1 border font-bold ${
                      isCur 
                        ? 'bg-black text-white border-black ring-1 ring-orange-500 font-black' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Condicional: Configurador de Puerta Arquitectónica o Dimensiones de Equipos */}
          {(() => {
            const esPuertaActiva = eq.tipo === 'PUERTA' || eq.tipo === 'PUERTA_DOBLE' || eq.tipo === 'PUERTA_CORREDERA' || eq.tipo === 'PUERTA_VAIVEN';
            if (esPuertaActiva) {
              const curWMetros = (eq.posicion?.rotacion === 90 || eq.posicion?.rotacion === 270)
                ? parseFloat(largoMetrosCalc) 
                : parseFloat(anchoMetrosCalc);

              return (
                <div className="p-3 bg-blue-50/90 border-2 border-blue-600 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <span className="text-[11px] font-black uppercase text-blue-950 flex items-center gap-1.5">
                      <DoorOpen className="w-4 h-4 text-blue-700" />
                      Configurador de Puerta CAD
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                      Vano {curWMetros.toFixed(2)}m
                    </span>
                  </div>

                  {/* Selector de Tipo de Puerta */}
                  <div>
                    <label className="text-[9px] font-black text-blue-900 uppercase block mb-1">Tipo de Puerta:</label>
                    <div className="grid grid-cols-2 gap-1 font-mono text-[10px]">
                      {[
                        { id: 'PUERTA', label: '🚪 1 Hoja Batiente' },
                        { id: 'PUERTA_DOBLE', label: '🚪🚪 Doble Hoja' },
                        { id: 'PUERTA_CORREDERA', label: '⇄ Corredera / Guía' },
                        { id: 'PUERTA_VAIVEN', label: '↶↷ Vaivén Cocina' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleChangeDoorTipo(t.id)}
                          className={`py-1.5 px-2 text-left font-bold border transition-colors ${
                            eq.tipo === t.id 
                              ? 'bg-blue-700 text-white border-blue-900 shadow-sm font-black' 
                              : 'bg-white text-gray-800 border-blue-300 hover:bg-blue-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ancho del Vano (Medidas Estándar Arquitectura) */}
                  <div>
                    <label className="text-[9px] font-black text-blue-900 uppercase block mb-1">Ancho del Vano de Acceso:</label>
                    <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                      {[
                        { w: 0.70, label: '0.70m' },
                        { w: 0.80, label: '0.80m' },
                        { w: 0.90, label: '0.90m' },
                        { w: 1.00, label: '1.00m' },
                        { w: 1.20, label: '1.20m' },
                        { w: 1.40, label: '1.40m' }
                      ].map(m => {
                        const isCurrent = Math.abs(curWMetros - m.w) < 0.04;
                        return (
                          <button
                            key={m.w}
                            type="button"
                            onClick={() => handleSetDoorWidth(m.w)}
                            className={`py-1 px-1 text-center font-bold border transition-colors ${
                              isCurrent 
                                ? 'bg-blue-900 text-white border-blue-950 font-black ring-1 ring-blue-500' 
                                : 'bg-white text-blue-950 border-blue-300 hover:bg-blue-100'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mano de Bisagra y Sentido de Apertura */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-blue-200">
                    <div>
                      <label className="text-[9px] font-black text-blue-900 uppercase block mb-1">Mano de Bisagra:</label>
                      <button
                        type="button"
                        onClick={handleToggleDoorMano}
                        className="w-full py-1.5 px-2 bg-white border border-blue-400 font-mono text-xs font-bold hover:bg-blue-100 flex items-center justify-between shadow-sm"
                      >
                        <span>{eq.mano === 'der' ? 'Bisagra Der ➔' : '⬅︎ Bisagra Izq'}</span>
                        <ArrowLeftRight className="w-3.5 h-3.5 text-blue-700" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[9px] font-black text-blue-900 uppercase block mb-1">Sentido de Apertura:</label>
                      <button
                        type="button"
                        onClick={handleToggleDoorApertura}
                        className="w-full py-1.5 px-2 bg-white border border-blue-400 font-mono text-xs font-bold hover:bg-blue-100 flex items-center justify-between shadow-sm"
                      >
                        <span>{eq.apertura === 'exterior' ? 'Hacia Afuera' : 'Hacia Adentro'}</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-700" />
                      </button>
                    </div>
                  </div>

                  {/* Advertencia Técnica de Normativa Sanitaria y Seguridad */}
                  <div className="p-2 bg-white border border-blue-300 rounded text-[9px] font-mono text-blue-950 space-y-0.5">
                    <span className="font-black text-blue-800 block">Normativa de Seguridad y Evacuación:</span>
                    <p className="text-gray-600 leading-tight">
                      El área sombreada en azul representa el barrido físico de la hoja. Ninguna mesa de preparación o maquinaria debe invadir este radio para permitir la circulación y evacuación.
                    </p>
                  </div>
                </div>
              );
            }

            const esVentanaActiva = eq.tipo === 'VENTANA';
            if (esVentanaActiva) {
              const curWMetros = (eq.posicion?.rotacion === 90 || eq.posicion?.rotacion === 270)
                ? parseFloat(largoMetrosCalc) 
                : parseFloat(anchoMetrosCalc);
              const curSubtipo = eq.subtipo || 'BATIENTE';

              return (
                <div className="p-3 bg-sky-50/90 border-2 border-sky-600 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between border-b border-sky-200 pb-2">
                    <span className="text-[11px] font-black uppercase text-sky-950 flex items-center gap-1.5">
                      <AppWindow className="w-4 h-4 text-sky-700" />
                      Configurador de Ventana CAD
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-sky-600 text-white px-1.5 py-0.5 rounded">
                      Vano {curWMetros.toFixed(2)}m
                    </span>
                  </div>

                  {/* Selector de Tipo de Ventana / Carpintería */}
                  <div>
                    <label className="text-[9px] font-black text-sky-900 uppercase block mb-1">Tipo de Carpintería:</label>
                    <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                      {[
                        { id: 'BATIENTE', label: '🪟 Batiente' },
                        { id: 'CORREDERA', label: '⇄ Corredera' },
                        { id: 'FIJA', label: '◻ Fija Vitrina' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleChangeWindowSubtipo(t.id)}
                          className={`py-1.5 px-1 text-center font-bold border transition-colors ${
                            curSubtipo === t.id 
                              ? 'bg-sky-700 text-white border-sky-900 shadow-sm font-black' 
                              : 'bg-white text-gray-800 border-sky-300 hover:bg-sky-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ancho del Vano de la Ventana */}
                  <div>
                    <label className="text-[9px] font-black text-sky-900 uppercase block mb-1">Ancho del Vano de Ventana:</label>
                    <div className="grid grid-cols-3 gap-1 font-mono text-[10px]">
                      {[
                        { w: 0.60, label: '0.60m' },
                        { w: 0.80, label: '0.80m' },
                        { w: 1.00, label: '1.00m' },
                        { w: 1.20, label: '1.20m' },
                        { w: 1.50, label: '1.50m' },
                        { w: 1.80, label: '1.80m' }
                      ].map(m => {
                        const isCurrent = Math.abs(curWMetros - m.w) < 0.04;
                        return (
                          <button
                            key={m.w}
                            type="button"
                            onClick={() => handleSetWindowWidth(m.w)}
                            className={`py-1 px-1 text-center font-bold border transition-colors ${
                              isCurrent 
                                ? 'bg-sky-900 text-white border-sky-950 font-black ring-1 ring-sky-500' 
                                : 'bg-white text-sky-950 border-sky-300 hover:bg-sky-100'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Controles rápidos de orientación y muro */}
                  <div className="pt-1 border-t border-sky-200">
                    <label className="text-[9px] font-black text-sky-900 uppercase block mb-1">Orientación y Muro:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleRotate(90)}
                        className="py-1.5 px-2 bg-white border border-sky-400 font-mono text-xs font-bold hover:bg-sky-100 flex items-center justify-between shadow-sm"
                        title="Girar 90 grados para encajar en muro horizontal o vertical"
                      >
                        <span>Girar 90°</span>
                        <RotateCw className="w-3.5 h-3.5 text-sky-700" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="py-1.5 px-2 bg-red-50 border border-red-300 text-red-700 font-mono text-xs font-bold hover:bg-red-100 flex items-center justify-between shadow-sm"
                        title="Eliminar ventana"
                      >
                        <span>Eliminar</span>
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>

                  {/* Ficha Técnica de Aislamiento y Sanidad */}
                  <div className="p-2 bg-white border border-sky-300 rounded text-[9px] font-mono text-sky-950 space-y-0.5">
                    <span className="font-black text-sky-800 block">Doble Acristalamiento con Rotura de Puente Térmico:</span>
                    <p className="text-gray-600 leading-tight">
                      Cámara de aire aislante para mantener la temperatura controlada del obrador y evitar condensación sobre áreas de amasado y horneado. Altura de antepecho recomendada: 1.00m.
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="p-3 bg-gray-50 border-2 border-black space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-gray-700 block">
                    Dimensiones Físicas (CAD / BIM)
                  </span>
                  <span className="text-[9px] font-mono text-gray-500">
                    Área: <b>{(parseFloat(anchoMetrosCalc) * parseFloat(largoMetrosCalc)).toFixed(2)} m²</b>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white p-2 border border-black shadow-sm">
                    <label className="text-[9px] font-black text-gray-600 block uppercase mb-1">
                      Ancho (X en metros):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={localAncho}
                        onChange={(e) => handleDimensionChange('ancho', e.target.value)}
                        onBlur={() => handleDimensionBlur('ancho')}
                        onKeyDown={(e) => e.key === 'Enter' && handleDimensionBlur('ancho')}
                        className="w-full font-black text-sm p-1 border border-gray-400 focus:border-blue-600 focus:outline-none bg-gray-50 text-gray-900"
                        placeholder="0.70"
                      />
                      <span className="text-xs font-bold text-gray-500">m</span>
                    </div>
                  </div>

                  <div className="bg-white p-2 border border-black shadow-sm">
                    <label className="text-[9px] font-black text-gray-600 block uppercase mb-1">
                      Fondo / Largo (Y en metros):
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={localLargo}
                        onChange={(e) => handleDimensionChange('largo', e.target.value)}
                        onBlur={() => handleDimensionBlur('largo')}
                        onKeyDown={(e) => e.key === 'Enter' && handleDimensionBlur('largo')}
                        className="w-full font-black text-sm p-1 border border-gray-400 focus:border-blue-600 focus:outline-none bg-gray-50 text-gray-900"
                        placeholder="0.85"
                      />
                      <span className="text-xs font-bold text-gray-500">m</span>
                    </div>
                  </div>
                </div>

                {/* Atajos rápidos de medidas estándar de hostelería */}
                <div className="pt-1 border-t border-gray-200">
                  <span className="text-[9px] font-bold text-gray-500 block mb-1">Medidas Estándar Gastronorm:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '70x70 (Nevera)', w: '0.70', l: '0.70' },
                      { label: '70x85 (Horno Pizza)', w: '0.70', l: '0.85' },
                      { label: '80x110 (Mesón)', w: '0.80', l: '1.10' },
                      { label: '60x40 (Bandeja GN)', w: '0.60', l: '0.40' },
                      { label: '90x35 (Repisa)', w: '0.90', l: '0.35' }
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          handleDimensionChange('ancho', preset.w);
                          handleDimensionChange('largo', preset.l);
                        }}
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-white border border-gray-300 hover:border-black hover:bg-orange-50 text-gray-700"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Capacidad Global de Producción de Toda la Planta (Top 10 Productos) */}
          <div className="p-3.5 bg-amber-50/90 border-2 border-black space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-black/20">
              <span className="text-xs font-black uppercase text-orange-950 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-orange-600" />
                Capacidad Global de la Planta (Turno {horasTurno}h)
              </span>
              <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5">
                10 Top Productos
              </span>
            </div>

            <p className="text-[11px] text-gray-600 leading-tight">
              Capacidad máxima real de la planta si se dedica a hornear y producir cada uno de los 10 productos más vendidos, calculada según el cuello de botella (TOC) de los equipos activos en el plano:
            </p>

            {/* Listado de los 10 Productos con Capacidad Total de Planta */}
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {(analisisProductos.length > 0 ? analisisProductos : defaultCadLayout.productos || []).map((p, idx) => {
                const unidadesNetas = p.unidadesNetasTurno || (p.demandaEstimadaDia ? p.demandaEstimadaDia * 2 : 40);
                const precio = p.precioVentaCOP || 0;
                const margen = p.margenContribucionTurnoCOP || (unidadesNetas * (precio * 0.6));
                const limitante = p.equipoLimitante || 'Horno / Batidora';

                return (
                  <div 
                    key={p.id || idx}
                    className="p-2 bg-white border border-black hover:border-orange-600 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs">{p.categoria === 'REPOSTERIA' ? '🍰' : '🥐'}</span>
                        <span className="font-bold text-xs text-gray-900 truncate">{p.nombre}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">
                        Cuello botella: <span className="text-orange-800 font-semibold">{limitante}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-black text-xs text-gray-900">
                        {unidadesNetas} <span className="text-[9px] font-normal text-gray-500">uds/turno</span>
                      </div>
                      <div className="font-mono font-bold text-[10px] text-green-700">
                        +${Math.round(margen).toLocaleString('es-CO')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 bg-white border border-black flex items-center justify-between text-[11px] font-mono font-bold">
              <span className="text-gray-600">Eficiencia OEE Planta:</span>
              <span className="text-orange-700">85% Operativa</span>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-black text-xs space-y-1">
            <span className="font-black uppercase text-[10px] text-gray-600 block">
              Cuello de Botella Físico en la Planta
            </span>
            <p className="text-gray-700 leading-snug">
              {eq.cuelloDeBotellaDesc || 'Activo operativo balanceado en la línea.'}
            </p>
          </div>
        </div>
      </div>

      {/* Modal para Agregar Nuevos Equipos */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 max-w-xl w-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b-2 border-black">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#f97316]" />
                <h3 className="text-lg font-black text-gray-900">Catálogo de Familias BIM para Insertar</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="font-bold text-lg px-2 border border-black hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {EQUIPOS_PRESETS.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => handleAddPreset(p)}
                  className="p-3 border-2 border-black hover:bg-orange-50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-sm text-gray-900">{p.nombre}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      Dimensiones: {p.dimensiones} • Potencia: {p.potenciaElectrica}
                    </div>
                    <div className="text-xs text-orange-800 mt-0.5">{p.cuelloDeBotellaDesc}</div>
                  </div>

                  <button className="px-3 py-1 bg-black text-white font-bold text-xs uppercase self-start sm:self-center shrink-0">
                    + Insertar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
