import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default' | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  icon?: React.ReactNode;
}

export function Badge({ children, variant = 'default', className = '', icon }: BadgeProps) {
  const baseClasses = "inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-colors";
  
  const variants = {
    success: "bg-success-50 text-success-600 border-success-200",
    warning: "bg-warning-50 text-warning-600 border-warning-200",
    error: "bg-error-50 text-error-600 border-error-200",
    info: "bg-info-50 text-info-600 border-info-200",
    primary: "bg-primary-50 text-primary-600 border-primary-200",
    default: "bg-surface-100 text-surface-600 border-surface-200",
  };

  return (
    <span className={`${baseClasses} ${variants[variant]} ${className}`}>
      {icon && <span className="w-3 h-3 flex items-center justify-center">{icon}</span>}
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  let variant: BadgeVariant = 'default';
  
  const s = status.toLowerCase();
  if (['completed', 'resolved', 'closed', 'verified'].includes(s)) variant = 'success';
  else if (['in progress', 'work in progress', 'work started', 'travelling', 'assigned'].includes(s)) variant = 'info';
  else if (['reported', 'open'].includes(s)) variant = 'warning';
  else if (['rejected', 'escalated'].includes(s)) variant = 'error';
  else if (['ready for verification', 'waiting for materials', 'material approved'].includes(s)) variant = 'primary';

  return <Badge variant={variant} className={className}>{status.replace(/_/g, ' ')}</Badge>;
}
