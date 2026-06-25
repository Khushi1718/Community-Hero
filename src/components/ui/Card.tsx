import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = '', onClick, hoverable = false }: CardProps) {
  const hoverClasses = hoverable ? 'hover:-translate-y-1 hover:shadow-card-hover cursor-pointer transition-all duration-300' : '';
  
  return (
    <div 
      className={`glass-panel rounded-3xl overflow-hidden ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-5 sm:p-6 pb-0 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return <div className={`p-5 sm:p-6 pt-0 border-t border-surface-100 mt-4 flex items-center bg-surface-50/50 ${className}`}>{children}</div>;
}
