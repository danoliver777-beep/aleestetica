
import React from 'react';
import { Screen } from '../types';

interface AdminBottomNavProps {
    active: Screen;
    onNavigate: (s: Screen) => void;
}

const AdminBottomNav: React.FC<AdminBottomNavProps> = ({ active, onNavigate }) => {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 px-6 py-3 pb-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
            <ul className="flex justify-around items-center">
                <li>
                    <button
                        onClick={() => onNavigate('ADMIN_DASHBOARD')}
                        className={`flex flex-col items-center gap-1 transition-colors ${active === 'ADMIN_DASHBOARD' ? 'text-primary' : 'text-gray-400'}`}
                    >
                        <span className={`material-symbols-outlined text-[24px] ${active === 'ADMIN_DASHBOARD' ? 'filled' : ''}`}>dashboard</span>
                        <span className="text-[10px] font-bold">Início</span>
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => onNavigate('ADMIN_AGENDA')}
                        className={`flex flex-col items-center gap-1 transition-colors ${active === 'ADMIN_AGENDA' ? 'text-primary' : 'text-gray-400'}`}
                    >
                        <span className={`material-symbols-outlined text-[24px] ${active === 'ADMIN_AGENDA' ? 'filled' : ''}`}>calendar_month</span>
                        <span className="text-[10px] font-medium">Agenda</span>
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => onNavigate('ADMIN_SERVICES')}
                        className={`flex flex-col items-center gap-1 transition-colors ${active === 'ADMIN_SERVICES' ? 'text-primary' : 'text-gray-400'}`}
                    >
                        <span className={`material-symbols-outlined text-[24px] ${active === 'ADMIN_SERVICES' ? 'filled' : ''}`}>content_cut</span>
                        <span className="text-[10px] font-medium">Serviços</span>
                    </button>
                </li>
                <li>
                    <button
                        onClick={() => onNavigate('ADMIN_SETTINGS')}
                        className={`flex flex-col items-center gap-1 transition-colors ${active === 'ADMIN_SETTINGS' ? 'text-primary' : 'text-gray-400'}`}
                    >
                        <span className={`material-symbols-outlined text-[24px] ${active === 'ADMIN_SETTINGS' ? 'filled' : ''}`}>settings</span>
                        <span className="text-[10px] font-medium">Ajustes</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default AdminBottomNav;
