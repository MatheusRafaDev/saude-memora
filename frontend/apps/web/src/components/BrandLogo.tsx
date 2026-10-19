import { Link } from 'wouter';
import { BrandWordmark, type BrandWordmarkVariant } from '@/components/BrandWordmark';

export type BrandLogoVariant = BrandWordmarkVariant;

type BrandLogoIconProps = {
  className?: string;
  inverse?: boolean;
  variant?: BrandLogoVariant;
};

export function BrandLogoIcon({
  className = 'h-9 w-9',
  inverse = false,
  variant,
}: BrandLogoIconProps) {
  const resolvedVariant = variant ?? (inverse ? 'inverse' : 'default');

  if (resolvedVariant === 'white') {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="Símbolo Saúde Memora"
        className={`${className} flex-none`}
      >
        <rect width="64" height="64" rx="15" fill="#FFFFFF" />
        <path
          d="M9 38 L18 38 L25.5 19.5 L32 44 L38.5 19.5 L46 38 L51 38"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="54" cy="38" r="3.2" fill="#EB6A4A" />
      </svg>
    );
  }

  if (resolvedVariant === 'inverse') {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="Símbolo Saúde Memora"
        className={`${className} flex-none`}
      >
        <rect width="64" height="64" rx="15" fill="#CFE0FF" />
        <path
          d="M9 38 L18 38 L25.5 19.5 L32 44 L38.5 19.5 L46 38 L51 38"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="54" cy="38" r="3.2" fill="#EB6A4A" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Símbolo Saúde Memora"
      className={`${className} flex-none`}
    >
      <rect width="64" height="64" rx="15" fill="#1D4ED8" />
      <path
        d="M9 38 L18 38 L25.5 19.5 L32 44 L38.5 19.5 L46 38 L51 38"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="54" cy="38" r="3.2" fill="#EB6A4A" />
    </svg>
  );
}

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  inverse?: boolean;
  variant?: BrandLogoVariant;
  withLink?: boolean;
  href?: string;
  showWordmark?: boolean;
  withDot?: boolean;
  layout?: 'stacked' | 'inline';
  subtitle?: string;
};

export function BrandLogo({
  className = '',
  iconClassName = 'h-10 w-10',
  wordmarkClassName = '',
  inverse = false,
  variant,
  withLink = true,
  href = '/',
  showWordmark = true,
  withDot = true,
  layout = 'stacked',
  subtitle,
}: BrandLogoProps) {
  const resolvedVariant = variant ?? (inverse ? 'inverse' : 'default');

  const content = (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandLogoIcon className={iconClassName} variant={resolvedVariant} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <BrandWordmark
            className={wordmarkClassName}
            variant={resolvedVariant}
            withDot={withDot}
            layout={layout}
          />
          {subtitle && (
            <span
              className={`text-[12px] font-medium tracking-normal mt-1 ${
                resolvedVariant === 'white'
                  ? 'text-white/80'
                  : resolvedVariant === 'inverse'
                  ? 'text-[#c9d6e8]'
                  : 'text-[#5B6878]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link href={href} aria-label="Saúde Memora — início" className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
}
