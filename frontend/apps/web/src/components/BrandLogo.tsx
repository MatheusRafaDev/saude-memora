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
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${className} flex-none`}
        role="img"
        aria-label="Símbolo Saúde Memora"
      >
        <rect width="120" height="120" rx="30" fill="#ffffff" />
        <path
          d="M60 96 C22 70 20 40 41 32 C52 28 58 35 60 41 C62 35 68 28 79 32 C100 40 98 70 60 96 Z"
          fill="#1f7fe0"
        />
        <path
          d="M30 60 H47 L54 46 L65 76 L72 60 H90"
          fill="none"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} flex-none`}
      role="img"
      aria-label="Símbolo Saúde Memora"
    >
      <rect width="120" height="120" rx="30" fill="#1f7fe0" />
      <path
        d="M60 96 C22 70 20 40 41 32 C52 28 58 35 60 41 C62 35 68 28 79 32 C100 40 98 70 60 96 Z"
        fill="#ffffff"
      />
      <path
        d="M30 60 H47 L54 46 L65 76 L72 60 H90"
        fill="none"
        stroke="#1f7fe0"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandLogoIcon className={iconClassName} inverse={inverse} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <BrandWordmark className={wordmarkClassName} inverse={inverse} />
          {subtitle && (
            <span
              className={`text-[12px] font-medium tracking-normal mt-1 ${
                inverse ? 'text-[#c9d6e8]' : 'text-[#5a6a80]'
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
      <Link href={href} aria-label="SaúdeMemora — início" className="group">
        {content}
      </Link>
    );
  }

  return content;
}
