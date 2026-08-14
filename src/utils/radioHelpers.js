export const MAX_PLAYLIST_SECONDS = 4 * 60 * 60; // 4 horas en segundos (14,400 seg)

export const getAudioDuration = (file) => {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;
    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration || 0));
    };
    audio.onerror = () => resolve(0);
  });
};
