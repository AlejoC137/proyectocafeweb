import React from "react";

export const HorizontalStyles = ({ width, height, unit }) => (
  <style>
    {`
      @media print {
        @page {
          size: ${width}${unit} ${height}${unit} !important;
          margin: 0 !important;
        }

        body * {
          visibility: hidden !important;
        }

        #print-area, #print-area * {
          visibility: visible !important;
        }

        #print-area {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
        }

        .horizontal-page {
          width: ${width}${unit} !important;
          height: ${height}${unit} !important;
          page-break-after: always !important;
          break-after: page !important;
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          visibility: visible !important;
        }

        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }

      .horizontal-page {
        width: ${width}${unit};
        height: ${height}${unit};
        background-color: white;
        box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        margin-bottom: 2rem;
        position: relative;
        overflow: hidden;
      }

      .w-window {
        width: 100% !important;
        max-width: 100% !important;
      }

      /* Markdown Styles */
      .print-markdown-content p { margin-bottom: 0.5em; }
      .print-markdown-content h1 { font-size: 1.4em; font-weight: bold; }
      .print-markdown-content h2 { font-size: 1.2em; font-weight: bold; }
      .print-markdown-content h3 { font-size: 1.1em; font-weight: bold; }
      .print-markdown-content table { width: 100%; border-collapse: collapse; margin-bottom: 0.5em; font-size: 11px; }
      .print-markdown-content th, .print-markdown-content td { border: 1px solid #000; padding: 2px 4px; }
    `}
  </style>
);
