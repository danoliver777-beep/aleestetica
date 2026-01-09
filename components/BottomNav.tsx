
import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  active: Screen;
  onNavigate: (s: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-surface-dark border-t-4 border-black dark:border-white pb-safe pt-2 px-4 shadow-[0_-8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[0_-8px_0px_0px_rgba(255,255,255,1)] z-[50]">
      <div className="flex justify-between items-center h-16">
        <button
          onClick={() => onNavigate('HOME')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${active === 'HOME' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${active === 'HOME' ? 'filled' : ''}`}>home</span>
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button
          onClick={() => onNavigate('MY_APPOINTMENTS')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${active === 'MY_APPOINTMENTS' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${active === 'MY_APPOINTMENTS' ? 'filled' : ''}`}>calendar_month</span>
          <span className="text-[10px] font-medium">Agenda</span>
        </button>

        <button
          onClick={() => onNavigate('BOOKING')}
          className="flex flex-col items-center justify-center -mt-10"
        >
          <div className="bg-primary text-white rounded-full p-3 shadow-[4px_4px_0px_0px_#000] border-4 border-black dark:border-white active:scale-95 transition-transform">
            <span className="material-symbols-outlined text-[28px]">add</span>
          </div>
          <span className="text-[10px] font-bold text-black dark:text-white mt-1 uppercase">Novo</span>
        </button>

        <button
          onClick={() => onNavigate('PET_REGISTRATION')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${active === 'PET_REGISTRATION' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${active === 'PET_REGISTRATION' ? 'filled' : ''}`}>pets</span>
          <span className="text-[10px] font-medium">Pets</span>
        </button>

        <button
          onClick={() => onNavigate('PROFILE')}
          className={`flex flex-col items-center justify-center gap-1 w-16 transition-colors ${active === 'PROFILE' ? 'text-primary' : 'text-gray-400'}`}
        >
          <span className={`material-symbols-outlined ${active === 'PROFILE' ? 'filled' : ''}`}>person</span>
          <span className="text-[10px] font-medium">Perfil</span>
        </button>
      </div>
      <div className="h-4 w-full"></div>
    </div>
  );
};

export default BottomNav;
