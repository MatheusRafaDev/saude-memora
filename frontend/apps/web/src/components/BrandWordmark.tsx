export type BrandWordmarkVariant = 'default' | 'inverse' | 'white';

type BrandWordmarkProps = {
  className?: string;
  inverse?: boolean;
  variant?: BrandWordmarkVariant;
  withDot?: boolean;
  layout?: 'stacked' | 'inline';
};

export function BrandWordmark({
  className = '',
  inverse = false,
  variant,
  withDot = true,
  layout = 'stacked',
}: BrandWordmarkProps) {
  const resolvedVariant = variant ?? (inverse ? 'inverse' : 'default');
  if (layout === 'inline') {
    const titleColor =
      resolvedVariant === 'white'
        ? 'text-white'
        : resolvedVariant === 'inverse'
          ? 'text-white'
          : 'text-[#0F1B4D]';

    const mainColor =
      resolvedVariant === 'white'
        ? 'text-white'
        : resolvedVariant === 'inverse'
          ? 'text-[#93C5FD]'
          : 'text-[#1D4ED8]';

    return (
      <span
        className={`inline-flex items-baseline font-sans select-none tracking-[-0.03em] leading-none ${className}`}
        style={{ fontFamily: "'Manrope', var(--font-sans, sans-serif)" }}
      >
        <span className={`font-medium transition-colors duration-150 ${titleColor}`}>
          saúde
        </span>
        <span className="w-1.5" />
        <span className={`font-extrabold transition-colors duration-150 ${mainColor}`}>
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

  const titleColor =
    resolvedVariant === 'white'
      ? 'text-white'
      : resolvedVariant === 'inverse'
        ? 'text-white/90'
        : 'text-[#0F1B4D]';

  const mainColor =
    resolvedVariant === 'white'
      ? 'text-white'
      : resolvedVariant === 'inverse'
        ? 'text-[#93C5FD]'
        : 'text-[#1D4ED8]';

  return (
    <span
      className={`inline-flex flex-col justify-center font-sans select-none leading-[0.92] ${className}`}
      style={{ fontFamily: "'Manrope', var(--font-sans, sans-serif)" }}
    >
      <span
        className={`text-[0.88em] font-medium tracking-[-0.025em] transition-colors duration-150 ${titleColor}`}
      >
        saúde
      </span>
      <span
        className={`text-[1.08em] font-extrabold tracking-[-0.035em] transition-colors duration-150 ${mainColor}`}
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
