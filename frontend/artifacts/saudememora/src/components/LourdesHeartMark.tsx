type LourdesHeartMarkProps = {
  className?: string;
  strokeWidth?: number;
};

export function LourdesHeartMark({
  className = 'h-6 w-6',
  strokeWidth = 1.8,
}: LourdesHeartMarkProps) {
  return (
    <img src="/logo.png" alt="SaúdeMemora Logo" className={className} style={{ objectFit: 'contain' }} />
  );
}
