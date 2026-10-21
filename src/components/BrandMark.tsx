interface BrandMarkProps {
  compact?: boolean;
  light?: boolean;
  className?: string;
}

export function BrandIcon({ className = '', size = 54 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path d="M20 35a16 16 0 0 1 32 0H20Z" fill="#C8795B" />
      <g stroke="#C8795B" strokeWidth="2" strokeLinecap="round">
        <path d="M36 8v7M20 12l4 6M52 12l-4 6M9 26l7 2M63 26l-7 2M15 18l5 4M57 18l-5 4" />
      </g>
      <path d="M8 38c10-4 21-1 29 11-13 5-24 0-29-11Z" fill="#9BAA91" />
      <path d="M10 40c8 4 15 8 21 10" stroke="#F6EFE3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M37 49c-1-11 4-23 14-29 9 11 5 23-14 29Z" fill="#2B211C" />
      <path d="M41 45 49 32" stroke="#F6EFE3" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M37 50c9 2 17-1 24-8-2 11-13 16-24 8Z" fill="#D8C6AE" />
    </svg>
  );
}

export default function BrandMark({ compact = false, light = false, className = '' }: BrandMarkProps) {
  return (
    <span className={`brand-lockup ${compact ? 'brand-lockup--compact' : ''} ${light ? 'brand-lockup--light' : ''} ${className}`}>
      <BrandIcon size={compact ? 36 : 48} />
      <span className="brand-lockup__words">
        <span className="brand-lockup__name">MORROW <span>&amp;</span> BEAN</span>
        {!compact && <span className="brand-lockup__descriptor">CAFÉ <i /> COFFEE <i /> BAKES</span>}
      </span>
    </span>
  );
}
