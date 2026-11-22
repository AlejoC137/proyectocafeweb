import React, { useState, useEffect } from 'react';
import { Music2, Disc } from 'lucide-react';

/**
 * Cover image with graceful 404/error fallback to a clean icon placeholder.
 * Resets error state automatically when `src` changes (e.g. track switch or tunnel recovery).
 */
export default function CoverArt({
  src,
  alt = '',
  className = 'w-full h-full object-cover',
  fallbackClassName = 'w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center',
  iconClassName = 'w-5 h-5 text-neutral-500',
  fallbackType = 'music',
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    const Icon = fallbackType === 'disc' ? Disc : Music2;
    return (
      <div className={fallbackClassName} aria-label={alt || 'Sin portada'}>
        <Icon className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
