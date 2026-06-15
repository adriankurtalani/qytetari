import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-5 sm:p-8',
};

export function Card({ children, className, hover, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'card rounded-2xl',
        hover && 'card-hover',
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
