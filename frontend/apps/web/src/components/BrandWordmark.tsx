type BrandWordmarkProps = {
  className?: string;
  inverse?: boolean;
};

export function BrandWordmark({ className = '', inverse = false }: BrandWordmarkProps) {
  return (
    <span className={`font-extrabold ${className}`}>
      <span>Saúde</span>
      <span className={inverse ? 'text-[#7cc4e6]' : 'text-[#1f7fe0]'}>Memora</span>
    </span>
  );
}
