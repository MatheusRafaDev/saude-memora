import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ threshold = 65, disabled = false }: PullToRefreshProps) {
  const [location] = useLocation();
  const [pullY, setPullY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const startXRef = useRef(0);
  const isEligibleRef = useRef(false);
  const hasVibratedRef = useRef(false);

  const isChat = location.startsWith('/chat');
  const isDisabled = disabled || isChat;

  useEffect(() => {
    if (isDisabled || isRefreshing) return;

    const isTop = () => {
      const top = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      return top <= 2;
    };

    const hasOpenModal = () => {
      return (
        document.querySelector('[role="dialog"]') !== null ||
        document.body.classList.contains('overflow-hidden') ||
        document.body.style.overflow === 'hidden'
      );
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      if (!isTop() || hasOpenModal()) {
        isEligibleRef.current = false;
        return;
      }

      // Evita interceptar se o toque iniciar em inputs, selects ou botões de rolagem própria
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [data-no-pull]')) {
        isEligibleRef.current = false;
        return;
      }

      startYRef.current = e.touches[0].clientY;
      startXRef.current = e.touches[0].clientX;
      isEligibleRef.current = true;
      hasVibratedRef.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEligibleRef.current || e.touches.length !== 1) return;

      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const deltaY = currentY - startYRef.current;
      const deltaX = currentX - startXRef.current;

      // Se for gesto predominantemente horizontal (ex: swipe de abas), descarta
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        if (!isPulling) {
          isEligibleRef.current = false;
        }
        return;
      }

      // Se não estiver no topo da página, cancela
      if (!isTop()) {
        isEligibleRef.current = false;
        setIsPulling(false);
        setPullY(0);
        return;
      }

      if (deltaY > 0) {
        // Aplica resistência elástica suave
        const damped = Math.min(Math.pow(deltaY, 0.82) * 1.7, 95);
        setPullY(damped);
        setIsPulling(true);

        // Feedback tátil quando atinge o limiar de recarga
        if (damped >= threshold && !hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(14);
            } catch {
              // Ignore
            }
          }
        } else if (damped < threshold) {
          hasVibratedRef.current = false;
        }

        // Impede rolagem estranha do navegador enquanto puxa para baixo
        if (e.cancelable && damped > 10) {
          e.preventDefault();
        }
      } else {
        setIsPulling(false);
        setPullY(0);
      }
    };

    const handleTouchEnd = () => {
      if (!isEligibleRef.current) return;
      isEligibleRef.current = false;

      setPullY((currentPullY) => {
        if (currentPullY >= threshold) {
          setIsRefreshing(true);
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(22);
            } catch {
              // Ignore
            }
          }

          // Breve intervalo para exibição do spinner antes de recarregar a página
          setTimeout(() => {
            window.location.reload();
          }, 320);

          return 52; // Mantém altura fixa do spinner durante a transição
        } else {
          setIsPulling(false);
          return 0;
        }
      });
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDisabled, isRefreshing, threshold]);

  const isReady = pullY >= threshold;
  const isVisible = pullY > 8 || isRefreshing;

  if (!isVisible) return null;

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-50 pointer-events-none flex justify-center pt-[calc(0.75rem+env(safe-area-inset-top,0px))] transition-transform duration-100 ease-out"
      style={{
        transform: `translateY(${Math.min(pullY * 0.75, 55)}px)`,
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-[#E3E8F0] bg-white/95 px-3.5 py-1.5 shadow-[0_8px_24px_-4px_rgba(20,33,31,0.14),0_2px_6px_rgba(20,33,31,0.08)] backdrop-blur-md">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors ${
            isReady || isRefreshing ? 'bg-[#1D4ED8] text-white' : 'bg-[#F0F5FF] text-[#1D4ED8]'
          }`}
        >
          {isRefreshing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowDown
              className="h-3.5 w-3.5 transition-transform duration-200"
              style={{
                transform: isReady ? 'rotate(180deg)' : `rotate(${Math.min((pullY / threshold) * 180, 180)}deg)`,
              }}
            />
          )}
        </div>
        <span className="text-[12px] font-medium tracking-tight text-[#14211F]">
          {isRefreshing
            ? 'Recarregando página...'
            : isReady
            ? 'Solte para recarregar'
            : 'Puxe para recarregar'}
        </span>
      </div>
    </div>
  );
}

