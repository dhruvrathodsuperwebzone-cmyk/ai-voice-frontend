/** White glyph on transparent tile — pair with `authLogoTileClass` for the gradient plate. */
export function BrandLogoIcon({ className = 'w-10 h-10' }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="transparent" />
      <path
        d="M12 20c0-1.5.5-2.8 1.4-3.8l2.2 2.2a5 5 0 107 0l2.2-2.2A8 8 0 1128 20h-2a6 6 0 10-3.4-5.4l-1.4 1.4V14h-2v6h-2v-2.8l-1.4-1.4A6 6 0 0112 20z"
        fill="white"
        fillOpacity="0.95"
      />
    </svg>
  );
}
