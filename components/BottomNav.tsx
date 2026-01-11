
import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 pb-safe pt-2 px-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-[50]">
      <div className="flex justify-between items-center h-16">
        <button
          onClick={() => onNavigate('HOME')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all ${active === 'HOME' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined !text-[28px] ${active === 'HOME' ? 'filled' : ''}`} style={{ fontVariationSettings: "'wght' 700" }}>home</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => onNavigate('MY_APPOINTMENTS')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all ${active === 'MY_APPOINTMENTS' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined !text-[28px] ${active === 'MY_APPOINTMENTS' ? 'filled' : ''}`} style={{ fontVariationSettings: "'wght' 700" }}>calendar_month</span>
          <span className="text-[10px] font-bold">Agenda</span>
        </button>

        <button
          onClick={() => onNavigate('PET_REGISTRATION')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all ${active === 'PET_REGISTRATION' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined !text-[28px] ${active === 'PET_REGISTRATION' ? 'filled' : ''}`} style={{ fontVariationSettings: "'wght' 700" }}>pets</span>
          <span className="text-[10px] font-bold">Pets</span>
        </button>

        <button
          onClick={() => onNavigate('PROFILE')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-all ${active === 'PROFILE' ? 'text-primary scale-110' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined !text-[28px] ${active === 'PROFILE' ? 'filled' : ''}`} style={{ fontVariationSettings: "'wght' 700" }}>person</span>
          <span className="text-[10px] font-bold">Perfil</span>
        </button>
      </div>
      <div className="h-4 w-full"></div>
    </div>
  );
};

export default BottomNav;
