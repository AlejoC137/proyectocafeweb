import React from "react";

export const headerStyles = {
  CAFE: {
    backgroundImage: 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.25) 0, rgba(0,0,0,0.25) 1px, transparent 1px, transparent 7px)',
    backgroundColor: '#f0f0f0',
  },
  BEBIDAS: {
    backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.3) 1.5px, transparent 1.5px)',
    backgroundSize: '7px 7px',
    backgroundColor: '#f0f0f0',
  },
  ALIMENTOS: {
    backgroundImage: [
      'repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 8px)',
      'repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 8px)',
    ].join(', '),
    backgroundColor: '#f0f0f0',
  },
  EXTRAS: {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='8'%3E%3Cline x1='1' y1='2' x2='7' y2='2' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3Cline x1='9' y1='6' x2='15' y2='6' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3C/svg%3E\")",
    backgroundSize: '16px 8px',
    backgroundColor: '#f0f0f0',
  },
  INFO: {
    backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Cline x1='7' y1='3' x2='7' y2='11' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3Cline x1='3' y1='7' x2='11' y2='7' stroke='rgba(0,0,0,0.28)' stroke-width='1.2'/%3E%3C/svg%3E\")",
    backgroundSize: '14px 14px',
    backgroundColor: '#f0f0f0',
  },
};

export const MenuPrintStyles = () => (
  <style>
    {`
      @media print {
        @page {
          size: 11in 17in !important;
          margin: 0 !important;
        }

        /* 1. Oculta absolutamente todo en la página al imprimir */
        body * {
          visibility: hidden !important;
        }

        /* 2. Hace visible ÚNICAMENTE el contenedor con el ID 'print-area' y todos sus hijos */
        #print-area, #print-area * {
          visibility: visible !important;
        }

        /* 3. Mueve el área de impresión a la esquina superior izquierda exacta de la hoja */
        #print-area {
          position: relative !important;
          width: 11in !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          z-index: 9999 !important;
        }

        /* 4. Permitir que el documento crezca con las páginas */
        html, body {
          width: 11in !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: visible !important;
          background: transparent !important;
        }

        .page-container {
          width: 11in !important;
          height: 17in !important;
          overflow: hidden !important;
          margin: 0 !important;
          padding: 0 !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          page-break-after: always !important;
          break-after: page !important;
        }

        /* Forzar renderizado de colores en todo */
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
      
      /* Markdown Styles */
      .columns-1 { column-count: 1 !important; }
      .columns-2 { column-count: 2 !important; }
      .columns-3 { column-count: 3 !important; }
      
      .print-markdown-content p {
        margin-bottom: 0.5em;
      }
      .print-markdown-content p:last-child {
        margin-bottom: 0;
      }
      .print-markdown-content h1, .print-markdown-content h2, .print-markdown-content h3 {
        font-weight: bold;
        margin-top: 0.5em;
        margin-bottom: 0.2em;
        line-height: 1.1;
        color: #000;
      }
      .print-markdown-content h1 { font-size: 1.4em; }
      .print-markdown-content h2 { font-size: 1.2em; }
      .print-markdown-content h3 { font-size: 1.1em; }
      .print-markdown-content strong { font-weight: bold; }
      .print-markdown-content hr {
        border: 0;
        border-bottom: 1px solid #ccc;
        margin: 0.5em 0;
      }
      .print-markdown-content table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0.5em;
        font-size: 11px;
      }
      .print-markdown-content th, .print-markdown-content td {
        border: 1px solid #000;
        padding: 2px 4px;
        text-align: left;
      }
      .print-markdown-content th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      .print-markdown-content blockquote {
        border-left: 2px solid #000;
        padding-left: 6px;
        margin-left: 0;
        color: #444;
      }
      .print-markdown-content table, 
      .print-markdown-content blockquote, 
      .print-markdown-content ul, 
      .print-markdown-content ol, 
      .print-markdown-content h1, 
      .print-markdown-content h2, 
      .print-markdown-content h3 {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    `}
  </style>
);
