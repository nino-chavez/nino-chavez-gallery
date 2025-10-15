'use client';

import { motion } from 'framer-motion';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  error?: Error | string;
}

export function ErrorState({ 
  message = 'Something went wrong', 
  onRetry,
  error 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <motion.div
        className="text-6xl mb-4"
        animate={{ rotate: [0, -10, 10, -10, 0] }}
        transition={{ duration: 0.5 }}
      >
        ⚠️
      </motion.div>
      <h3 className="text-2xl font-bold mb-2">Oops!</h3>
      <p className="text-gray-600 mb-6 text-center max-w-md">{message}</p>
      
      {error && process.env.NODE_ENV === 'development' && (
        <details className="mb-6 max-w-2xl">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Error details
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto">
            {typeof error === 'string' ? error : error.message}
          </pre>
        </details>
      )}

      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition flex items-center gap-2"
        >
          <span>🔄</span>
          Try Again
        </button>
      )}
    </div>
  );
}

export function InlineError({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <motion.div
      className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <span className="text-red-500 text-xl">⚠️</span>
      <div className="flex-1">
        <p className="text-red-800 text-sm">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-600 text-xl leading-none"
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </motion.div>
  );
}

export function EmptyState({ 
  icon = '📸',
  title = 'No items found',
  description = 'Try adjusting your filters or check back later',
  action
}: {
  icon?: string;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">{icon}</div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}