import React from 'react';
import { cn } from '../../lib/utils';

export default function PageShell({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className,
  fullWidth = false 
}) {
  return (
    <div className={cn("min-h-screen pt-16 md:pt-0 pb-12 animate-fade-in", className)}>
      <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-8", fullWidth ? "w-full" : "max-w-7xl")}>
        
        {/* Page Header */}
        {(title || actions) && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
            <div>
              {title && <h1 className="text-2xl font-bold text-white tracking-tight">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
            </div>
            {actions && (
              <div className="flex items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Page Content */}
        <div className="animate-slide-up">
          {children}
        </div>
      </div>
    </div>
  );
}
