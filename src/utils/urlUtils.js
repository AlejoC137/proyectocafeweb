/**
 * Normaliza una URL o dirección web ingresada por un usuario.
 * Si se ingresa "concervezatorio.vercel.app" o "mi-sitio.com",
 * le añade el protocolo "https://" de forma automática.
 */
export const formatUrl = (url) => {
    if (!url) return '';
    const trimmed = String(url).trim();
    if (!trimmed) return '';
    if (/^(https?:\/\/|mailto:|tel:|\/)/i.test(trimmed)) {
        return trimmed;
    }
    return `https://${trimmed}`;
};
