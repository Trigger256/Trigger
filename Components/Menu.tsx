
import React from 'react';
import SettingsIcon from './icons/SettingsIcon';
import PrivacyIcon from './icons/PrivacyIcon';
import InfoIcon from './icons/InfoIcon';
import GridIcon from './icons/GridIcon';
import LogoutIcon from './icons/LogoutIcon';

interface MenuProps {
  onLogout: () => void;
  onClose: () => void;
  onOpenModal: (modalName: string) => void;
}

const Menu: React.FC<MenuProps> = ({ onLogout, onClose, onOpenModal }) => {
    
    const handleMenuItemClick = (modalName: string) => {
        onOpenModal(modalName);
        onClose();
    };

    return (
        <div className="absolute top-16 right-4 sm:right-8 w-64 bg-slate-800/80 backdrop-blur-md rounded-lg shadow-2xl border border-slate-700/50 z-20 animate-scale-in-tr">
            <ul className="p-2 text-slate-300">
                <MenuItem icon={<GridIcon />} text="My Creations" onClick={() => handleMenuItemClick('creations')} />
                <MenuItem icon={<SettingsIcon />} text="Settings" onClick={() => handleMenuItemClick('settings')} />
                <MenuItem icon={<PrivacyIcon />} text="Privacy" onClick={() => handleMenuItemClick('privacy')} />
                <MenuItem icon={<InfoIcon />} text="About App" onClick={() => handleMenuItemClick('about')} />
                <div className="border-t border-slate-700 my-2" />
                <MenuItem icon={<LogoutIcon />} text="Logout" onClick={onLogout} />
            </ul>
        </div>
    );
};

interface MenuItemProps {
    icon: React.ReactNode;
    text: string;
    onClick: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onClick }) => {
    return (
        <li>
            <button
                onClick={onClick}
                className="w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md hover:bg-slate-700/70 transition-colors text-left"
            >
                {icon}
                <span>{text}</span>
            </button>
        </li>
    );
};


export default Menu;
