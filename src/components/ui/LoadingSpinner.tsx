interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = 'Duke u ngarkuar...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 gap-4 animate-fade-in px-4">
      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin" />
      <p className="text-sm text-slate-500 font-medium text-center">{label}</p>
    </div>
  );
}
