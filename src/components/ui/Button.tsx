import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon, 
  fullWidth = false, 
  className = '', 
  disabled, 
  ...props 
}: ButtonProps) {
  
  const baseClasses = "inline-flex items-center justify-center font-semibold rounded-full px-6 py-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary-600 text-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
    secondary: "bg-white text-surface-800 border border-surface-200 shadow-sm hover:border-surface-300 hover:bg-surface-50 hover:-translate-y-0.5 active:translate-y-0",
    ghost: "bg-transparent text-surface-600 hover:text-surface-900 hover:bg-surface-100",
    danger: "bg-error-600 text-white shadow-card hover:shadow-card-hover hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${widthClass} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
