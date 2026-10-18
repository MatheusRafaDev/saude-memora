import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] shadow-xs',
        primary:
          'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] active:bg-[#1E3A8A] shadow-xs',
        secondary:
          'bg-white text-[#14211F] border border-[#E3E8F0] hover:bg-[#F4F7FC] hover:border-[#CFE0FF] shadow-xs',
        outline:
          'border border-[#E3E8F0] bg-white text-[#14211F] hover:bg-[#F4F7FC] hover:text-[#1D4ED8] hover:border-[#CFE0FF] shadow-xs',
        destructive:
          'bg-[#E8664A] text-white hover:bg-[#D45338] active:bg-[#B9381E] shadow-xs',
        ghost:
          'text-[#5B6878] hover:text-[#14211F] hover:bg-[#F4F7FC]',
        link:
          'text-[#1D4ED8] underline-offset-4 hover:underline font-semibold p-0 h-auto',
      },
      size: {
        default: 'min-h-11 px-5 py-2.5',
        sm: 'min-h-9 rounded-lg px-3.5 py-1.5 text-xs',
        lg: 'min-h-12 rounded-xl px-6 py-3 text-base font-bold',
        icon: 'h-11 w-11 p-0 rounded-xl',
        'icon-sm': 'h-9 w-9 p-0 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };

