import { Link } from 'wouter';
import { BrandWordmark } from '@/components/BrandWordmark';

type BrandLogoIconProps = {
  className?: string;
  inverse?: boolean;
};

export function BrandLogoIcon({ className = 'h-9 w-9', inverse = false }: BrandLogoIconProps) {
  if (inverse) {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label="Símbolo Saúde Memora"
        className={`${className} flex-none`}
      >
        <rect width="64" height="64" rx="18" fill="#CFE0FF" />
        <path
          d="M11 38 L20 38 L26 20 L32 44 L38 20 L44 38 L50 38"
          fill="none"
          stroke="#1D4ED8"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="54" cy="38" r="3.2" fill="#E8664A" />
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
      <rect width="64" height="64" rx="18" fill="#1D4ED8" />
      <path
        d="M11 38 L20 38 L26 20 L32 44 L38 20 L44 38 L50 38"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="54" cy="38" r="3.2" fill="#E8664A" />
    </svg>
  );
}

type BrandLogoProps = {
  className?: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  inverse?: boolean;
  withLink?: boolean;
  href?: string;
  showWordmark?: boolean;
  subtitle?: string;
};

export function BrandLogo({
  className = '',
  iconClassName = 'h-9 w-9',
  wordmarkClassName = '',
  inverse = false,
  withLink = true,
  href = '/',
  showWordmark = true,
  subtitle,
}: BrandLogoProps) {
  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <BrandLogoIcon className={iconClassName} inverse={inverse} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <BrandWordmark className={wordmarkClassName} inverse={inverse} />
          {subtitle && (
            <span
              className={`text-[12px] font-medium tracking-normal mt-1 ${
                inverse ? 'text-[#c9d6e8]' : 'text-[#5B6878]'
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
