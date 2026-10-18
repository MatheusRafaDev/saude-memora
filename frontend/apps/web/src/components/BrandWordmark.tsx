type BrandWordmarkProps = {
  className?: string;
  inverse?: boolean;
  withDot?: boolean;
  layout?: 'stacked' | 'inline';
};

export function BrandWordmark({
  className = '',
  inverse = false,
  withDot = true,
  layout = 'stacked',
}: BrandWordmarkProps) {
  if (layout === 'inline') {
    return (
      <span
        className={`inline-flex items-baseline font-sans select-none tracking-[-0.03em] leading-none ${className}`}
        style={{ fontFamily: "'Manrope', var(--font-sans, sans-serif)" }}
      >
        <span
          className={`font-medium transition-colors duration-150 ${
            inverse ? 'text-white' : 'text-[#0F1B4D]'
          }`}
        >
          saúde
        </span>
        <span className="w-1.5" />
        <span
          className={`font-extrabold transition-colors duration-150 ${
            inverse ? 'text-[#93C5FD]' : 'text-[#1D4ED8]'
          }`}
        >
          memora
        </span>
        {withDot && (
          <span
            className="inline-block text-[#EB6A4A] font-extrabold transition-transform duration-200 group-hover:scale-125"
            aria-hidden="true"
          >
            .
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-col justify-center font-sans select-none leading-[0.92] ${className}`}
      style={{ fontFamily: "'Manrope', var(--font-sans, sans-serif)" }}
    >
      <span
        className={`text-[0.88em] font-medium tracking-[-0.025em] transition-colors duration-150 ${
          inverse ? 'text-white/90' : 'text-[#0F1B4D]'
        }`}
      >
        saúde
      </span>
      <span
        className={`text-[1.08em] font-extrabold tracking-[-0.035em] transition-colors duration-150 ${
          inverse ? 'text-[#93C5FD]' : 'text-[#1D4ED8]'
        }`}
      >
        memora
        {withDot && (
          <span
            className="inline-block ml-0.5 text-[#EB6A4A] transition-transform duration-200 group-hover:scale-125"
            aria-hidden="true"
          >
            .
          </span>
        )}
      </span>
    </span>
  );
}
