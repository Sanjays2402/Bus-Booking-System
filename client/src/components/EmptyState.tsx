import { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`glass rounded-2xl p-10 text-center flex flex-col items-center gap-3 ${className}`}
      role="status"
    >
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white/60">
        {icon ?? <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="text-sm text-white/60 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
