import { Link } from 'wouter';
import { BrandWordmark } from '@/components/BrandWordmark';

type BrandLogoIconProps = {
  className?: string;
  inverse?: boolean;
};

export function BrandLogoIcon({ className = 'h-9 w-9', inverse = false }: BrandLogoIconProps) {
  if (inverse) {
    return (
      <img
        src="/logo-white.svg"
        alt="SaúdeMemora"
        className={`${className} flex-none object-contain`}
      />
    );
  }

  return (
    <img
      src="/logo.png"
      alt="SaúdeMemora"
      className={`${className} flex-none object-contain`}
    />
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
