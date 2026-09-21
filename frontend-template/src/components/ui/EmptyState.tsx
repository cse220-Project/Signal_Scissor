import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
      <div className="w-20 h-20 bg-primary-fixed/20 rounded-full flex items-center justify-center mb-6 text-primary">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="text-headline-lg font-bold text-on-surface mb-2">{title}</h3>
      {description && <p className="text-body-lg text-on-surface-variant mb-8 max-w-md">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
