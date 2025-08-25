import { ReactNode } from 'react';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={clsx('text-center py-12', className)}>
      <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4">
        {icon || <DocumentTextIcon className="h-12 w-12" />}
      </div>
      
      <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
        {description}
      </p>
      
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            className={clsx(
              'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
              action.variant === 'secondary'
                ? 'btn-secondary'
                : 'btn-primary'
            )}
          >
            <PlusIcon className="-ml-0.5 mr-2 h-4 w-4" />
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}