import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'hero';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:shadow-md focus:ring-blue-500 active:scale-[0.98]',
      hero: 'bg-white text-blue-700 shadow-md hover:bg-blue-50 hover:shadow-lg focus:ring-white active:scale-[0.98]',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 focus:ring-slate-400 active:scale-[0.98]',
      outline:
        'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus:ring-blue-500 active:scale-[0.98]',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-400',
      danger:
        'bg-red-600 text-white shadow-sm hover:bg-red-700 focus:ring-red-500 active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3.5 py-2 text-sm rounded-lg min-h-[40px]',
      md: 'px-5 py-2.5 text-sm rounded-xl min-h-[44px]',
      lg: 'px-6 py-3 text-base rounded-xl min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export { Button };
