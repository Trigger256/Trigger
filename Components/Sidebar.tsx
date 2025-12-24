
import React from 'react';
import WandIcon from './icons/WandIcon';
import FilmIcon from './icons/FilmIcon';
import UsersIcon from './icons/UsersIcon';
import GridIcon from './icons/GridIcon';
import SettingsIcon from './icons/SettingsIcon';
import LogoutIcon from './icons/LogoutIcon';
import LogoIcon from './icons/LogoIcon';
import UserIcon from './icons/UserIcon';


interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenModal: (modal: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onOpenModal, onLogout }) => {
  return (
    <aside className="w-20 bg-slate-900/70 backdrop-blur-lg border-r border-slate-700/50 flex flex-col items-center justify-between p-4">
      <div className="flex flex-col items-center gap-8">
        <button onClick={() => onNavigate('generate')} className="text-cyan-400">
            <LogoIcon />
        </button>
        <nav className="flex flex-col gap-6">
            <NavItem 
                icon={<WandIcon />} 
                label="Generate" 
                isActive={activeView === 'generate'} 
                onClick={() => onNavigate('generate')} 
            />
            <NavItem 
                icon={<FilmIcon />} 
                label="Video Studio" 
                isActive={activeView === 'studio'} 
                onClick={() => onNavigate('studio')} 
            />
            <NavItem 
                icon={<UsersIcon />} 
                label="Community" 
                isActive={activeView === 'community'} 
                onClick={() => onNavigate('community')} 
            />
        </nav>
      </div>
      <div className="flex flex-col items-center gap-6">
          <NavItem 
            icon={<GridIcon />} 
            label="My Creations" 
            onClick={() => onOpenModal('creations')} 
        />
        <NavItem 
            icon={<SettingsIcon />} 
            label="Settings" 
            onClick={() => onOpenModal('settings')} 
        />
        <NavItem 
            icon={<LogoutIcon />} 
            label="Logout" 
            onClick={onLogout} 
        />
      </div>
    </aside>
  );
};


interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive = false, onClick }) => (
    <div className="relative group">
        <button 
            onClick={onClick}
            className={`p-3 rounded-lg transition-colors duration-200 relative ${isActive ? 'bg-cyan-500 text-white shadow-lg' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/70 hover:text-white'}`}
            aria-label={label}
        >
            {icon}
        </button>
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap tooltip">
            {label}
            <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
        </div>
    </div>
);


export default Sidebar;
