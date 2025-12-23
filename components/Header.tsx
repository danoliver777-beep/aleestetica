
import React, { ReactNode } from 'react';

interface HeaderProps {
  title?: string | ReactNode;
  leftIcon?: string | ReactNode;
  rightIcon?: string | ReactNode;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  children?: ReactNode;
  className?: string; // Allow combining classes
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  leftIcon, 
  rightIcon, 
  onLeftClick, 
  onRightClick, 
  children,
  className = ''
}) => {
  return (
    <header className={`sticky top-0 z-30 bg-white/95 dark:bg-[#1A202C]/95 backdrop-blur-md shadow-sm border-b border-gray-100 dark:border-gray-800 transition-colors ${className}`}>
      <div className="flex items-center justify-between p-4 min-h-[64px]">
        {/* Left Section */}
        <div className="flex items-center justify-center min-w-[40px]">
          {leftIcon && (
            <button 
              onClick={onLeftClick}
              className={`flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${!onLeftClick ? 'cursor-default hover:bg-transparent' : ''}`}
            >
              {typeof leftIcon === 'string' ? (
                <span className="material-symbols-outlined text-2xl text-gray-700 dark:text-gray-200">{leftIcon}</span>
              ) : (
                leftIcon
              )}
            </button>
          )}
        </div>

        {/* Center Section: Title */}
        <div className="flex-1 flex items-center justify-center text-center px-2">
           {typeof title === 'string' ? (
             <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{title}</h1>
           ) : (
             title
           )}
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-center min-w-[40px]">
          {rightIcon && (
             <button 
               onClick={onRightClick}
               className={`flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${!onRightClick ? 'cursor-default hover:bg-transparent' : ''}`}
             >
               {typeof rightIcon === 'string' ? (
                 <span className="material-symbols-outlined text-2xl text-gray-700 dark:text-gray-200">{rightIcon}</span>
               ) : (
                 rightIcon
               )}
             </button>
           )}
        </div>
      </div>
      
      {/* Optional Children content (e.g. Search bar, Tabs) */}
      {children && (
        <div className="px-4 pb-3">
          {children}
        </div>
      )}
    </header>
  );
};

export default Header;
