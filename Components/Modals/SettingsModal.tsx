
import React, { useState } from 'react';
import ModalWrapper from './ModalWrapper';
import UserIcon from '../icons/UserIcon';
import SunIcon from '../icons/SunIcon';
import PrivacyIcon from '../icons/PrivacyIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onClearAllData }) => {
    const [activeTab, setActiveTab] = useState('profile');

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileSettings onClearAllData={onClearAllData} />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'notifications':
                return <NotificationSettings />;
            default:
                return null;
        }
    };

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="Settings">
            <div className="flex flex-col md:flex-row gap-8">
                <nav className="flex-shrink-0 md:w-48">
                    <ul className="space-y-1">
                        <SettingsTabButton icon={<UserIcon />} label="Profile & Account" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <SettingsTabButton icon={<SunIcon />} label="Appearance" isActive={activeTab === 'appearance'} onClick={() => setActiveTab('appearance')} />
                        <SettingsTabButton icon={<PrivacyIcon />} label="Notifications" isActive={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
                    </ul>
                </nav>
                <div className="flex-grow">
                    {renderContent()}
                </div>
            </div>
        </ModalWrapper>
    );
};

const ProfileSettings = ({ onClearAllData }: { onClearAllData: () => void; }) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-slate-200">Profile Information</h3>
            <p className="text-sm text-slate-400 mt-1">Update your account's profile information.</p>
        </div>
        <div className="space-y-4">
             <div>
                <label className="text-sm font-semibold text-slate-300">Name</label>
                <input type="text" defaultValue="Demo User" className="w-full mt-1 p-2 bg-slate-900/70 border border-slate-700 rounded-lg" />
            </div>
            <div>
                <label className="text-sm font-semibold text-slate-300">Email</label>
                <input type="email" defaultValue="user@example.com" className="w-full mt-1 p-2 bg-slate-900/70 border border-slate-700 rounded-lg" />
            </div>
        </div>
         <div className="border-t border-slate-700 pt-6">
            <h3 className="text-lg font-semibold text-slate-200">Security</h3>
             <button className="mt-4 py-2 px-4 text-sm bg-slate-600 hover:bg-slate-500 rounded-lg">Change Password</button>
        </div>
        <div className="border-t border-slate-700 pt-6">
             <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
             <p className="text-sm text-slate-400 mt-1">Permanently delete all your creations and chat history from this browser.</p>
             <button onClick={onClearAllData} className="mt-4 py-2 px-4 text-sm bg-red-800 hover:bg-red-700 rounded-lg">Clear All Data</button>
        </div>
    </div>
);

const AppearanceSettings = () => (
     <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-slate-200">Appearance</h3>
            <p className="text-sm text-slate-400 mt-1">Customize the look and feel of the app.</p>
        </div>
        <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-300">Theme</label>
            <div className="flex gap-4">
                <button className="flex-1 p-4 bg-slate-700 rounded-lg border-2 border-cyan-500">Dark</button>
                <button className="flex-1 p-4 bg-slate-600 rounded-lg border-2 border-transparent">Light</button>
            </div>
        </div>
    </div>
);

const NotificationSettings = () => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold text-slate-200">Notifications</h3>
            <p className="text-sm text-slate-400 mt-1">Manage how you receive notifications from us.</p>
        </div>
        <div className="space-y-4">
            <Toggle setting="New Features" description="Notify me about new features and updates." />
            <Toggle setting="Weekly Inspiration" description="Send a weekly email with creative prompts." />
            <Toggle setting="Account Activity" description="Notify me about important changes to my account." defaultChecked={true} />
        </div>
    </div>
);

const Toggle = ({ setting, description, defaultChecked = false }: {setting: string, description: string, defaultChecked?: boolean}) => (
    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
        <div>
            <p className="font-semibold text-slate-300">{setting}</p>
            <p className="text-xs text-slate-400">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" defaultChecked={defaultChecked} />
            <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
        </label>
    </div>
);


interface SettingsTabButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}
const SettingsTabButton: React.FC<SettingsTabButtonProps> = ({ icon, label, isActive, onClick }) => (
    <li>
        <button onClick={onClick} className={`w-full flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${isActive ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'}`}>
            {icon}
            <span>{label}</span>
        </button>
    </li>
);

export default SettingsModal;
