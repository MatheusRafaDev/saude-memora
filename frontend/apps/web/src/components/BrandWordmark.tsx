export type BrandWordmarkVariant = 'default' | 'inverse' | 'white';

type BrandWordmarkProps = {
  className?: string;
  inverse?: boolean;
  variant?: BrandWordmarkVariant;
  height?: number | string;
  withDot?: boolean;
  layout?: 'stacked' | 'inline';
};

export function BrandWordmark({
  className = '',
  inverse = false,
  variant,
  height,
  withDot = true,
  layout = 'stacked',
}: BrandWordmarkProps) {
  const resolvedVariant = variant ?? (inverse ? 'inverse' : 'default');

  const titleColor =
    resolvedVariant === 'white'
      ? 'text-white'
      : resolvedVariant === 'inverse'
        ? 'text-white/95'
        : 'text-[#0F1B4D]';

  const mainColor =
    resolvedVariant === 'white'
      ? 'text-white'
      : resolvedVariant === 'inverse'
        ? 'text-[#93C5FD]'
        : 'text-[#1D4ED8]';

  const dotColor = '#EB6A4A';

  const style: React.CSSProperties = {
    fontFamily: "var(--app-font-sans)",
  };

  if (height) {
    if (typeof height === 'number') {
      style.fontSize = layout === 'stacked' ? `${Math.round(height * 0.48)}px` : `${Math.round(height * 0.72)}px`;
    } else {
      style.fontSize = height;
    }
  }

  if (layout === 'inline') {
    return (
      <span
        className={`inline-flex items-baseline gap-1.5 select-none leading-none ${className}`}
        style={style}
      >
        <span className={`font-medium tracking-[-0.02em] transition-colors ${titleColor}`}>
          saúde
        </span>
        <span className={`font-extrabold tracking-[-0.03em] transition-colors ${mainColor}`}>
          memora
          {withDot && (
            <span
              className="inline-block ml-0.5 font-extrabold transition-transform duration-200 group-hover:scale-125"
              style={{ color: dotColor }}
              aria-hidden="true"
            >
              .
            </span>
          )}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex flex-col justify-center select-none leading-[0.92] ${className}`}
      style={style}
    >
      <span
        className={`text-[0.88em] font-medium tracking-[-0.025em] transition-colors ${titleColor}`}
      >
        saúde
      </span>
      <span
        className={`text-[1.08em] font-extrabold tracking-[-0.035em] transition-colors ${mainColor}`}
      >
        memora
        {withDot && (
          <span
            className="inline-block ml-0.5 font-extrabold transition-transform duration-200 group-hover:scale-125"
            style={{ color: dotColor }}
            aria-hidden="true"
          >
            .
          </span>
        )}
      </span>
    </span>
  );
}

