type BrandWordmarkProps = {
  className?: string;
  inverse?: boolean;
};

export function BrandWordmark({ className = '', inverse = false }: BrandWordmarkProps) {
  return (
    <span className={`inline-flex items-baseline tracking-[-0.02em] select-none ${className}`}>
      <span className={`font-serif font-semibold ${inverse ? 'text-[#F4F7FC]' : 'text-[#14211F]'}`}>
        Saúde
      </span>
      <span className="inline-block w-1.5" />
      <span className={`font-serif italic font-medium ${inverse ? 'text-[#CFE0FF]' : 'text-[#1D4ED8]'}`}>
        Memora
      </span>
    </span>
  );
}
