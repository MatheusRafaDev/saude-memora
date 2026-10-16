type BrandWordmarkProps = {
  className?: string;
  inverse?: boolean;
};

export function BrandWordmark({ className = '', inverse = false }: BrandWordmarkProps) {
  return (
    <span className={`inline-flex items-baseline tracking-[-0.03em] select-none ${className}`}>
      <span className="font-light">Saúde</span><span className={`font-black ${inverse ? 'text-[#7cc4e6]' : 'text-[#1f7fe0]'}`}>Memora</span>
    </span>
  );
}
