/**
 * Utilidades de procesamiento e ingesta multimodal para el Asistente IA.
 */

// --- 1. EXTRACCIÓN DE TEXTO DE ARCHIVOS (PDF, TXT, CSV, JSON, MD) ---

export async function extractTextFromFile(file) {
  if (!file) throw new Error("No se proporcionó ningún archivo");

  const fileName = file.name.toLowerCase();

  // Para archivos de texto plano, CSV, JSON, Markdown
  if (
    fileName.endsWith(".txt") ||
    fileName.endsWith(".csv") ||
    fileName.endsWith(".json") ||
    fileName.endsWith(".md")
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Error al leer el archivo de texto: " + e.target.error));
      reader.readAsText(file);
    });
  }

  // Para archivos PDF usando pdfjs-dist
  if (fileName.endsWith(".pdf")) {
    try {
      const pdfjsLib = await import("pdfjs-dist");
      
      // Configurar worker de pdfjs
      if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || "3.11.174"}/pdf.worker.min.js`;
      }

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(" ");
        fullText += `--- Página ${pageNum} ---\n${pageText}\n\n`;
      }

      return fullText.trim() || "No se pudo extraer texto legible del PDF.";
    } catch (err) {
      console.warn("PDF extraction warning (falling back to simple reader):", err);
      // Fallback simple si pdfjs falla
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = e.target.result;
          // Limpiar caracteres no imprimibles simples
          const printable = raw.replace(/[^\x20-\x7E\x0A\x0D\xC0-\xFF]/g, " ");
          resolve(`[Contenido extraído del PDF ${file.name}]\n${printable.slice(0, 5000)}`);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
      });
    }
  }

  throw new Error("Formato de archivo no soportado. Usa PDF, TXT, CSV, JSON o MD.");
}

// --- 2. EXTRACCIÓN Y VALIDACIÓN DE YOUTUBE ---

export function parseYouTubeURL(url) {
  if (!url) return null;

  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    const videoId = match[2];
    return {
      videoId,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`
    };
  }

  return null;
}

// --- 3. RECONOCIMIENTO DE VOZ EN TIEMPO REAL (WEB SPEECH API) ---

export class VoiceDictationHandler {
  constructor() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.isSupported = false;
      return;
    }

    this.isSupported = true;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "es-CO"; // Español Colombia / Latinoamérica
  }

  start(onResultCallback, onErrorCallback) {
    if (!this.isSupported) {
      if (onErrorCallback) onErrorCallback("El navegador no soporta reconocimiento de voz nativo.");
      return;
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResultCallback) {
        onResultCallback({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim()
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.error("Speech Recognition Error:", event.error);
      if (onErrorCallback) onErrorCallback(event.error);
    };

    this.recognition.start();
  }

  stop() {
    if (this.isSupported && this.recognition) {
      this.recognition.stop();
    }
  }
}
