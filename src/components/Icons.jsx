export function IconLightning({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13 2L4.5 13.5h6L9 22l9.5-12.5h-6L13 2z" />
    </svg>
  );
}

export function IconSliders({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <line x1="4" y1="8" x2="20" y2="8" />
      <circle cx="14" cy="8" r="2.5" fill="currentColor" stroke="none" />
      <line x1="4" y1="16" x2="20" y2="16" />
      <circle cx="9" cy="16" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconHexGrid({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2l5 3v6l-5 3-5-3V5z" />
      <path d="M7 14l-5 3v6l5 3 5-3" />
      <path d="M17 14l5 3v6l-5 3-5-3" />
    </svg>
  );
}

export function IconPalette({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="16" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="13" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconHeart({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

export function IconShuffle({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
  );
}

export function IconReset({ size = 20, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 12a9 9 0 1 0 3-6.74" />
      <polyline points="3 2 3 8 9 8" />
    </svg>
  );
}
