
import React, { useState } from 'react';
import ImageGenerator from './components/ImageGenerator';
import AuthPage from './components/AuthPage';
import CreationsModal from './components/modals/CreationsModal';
import SettingsModal from './components/modals/SettingsModal';
import PrivacyModal from './components/modals/PrivacyModal';
import AboutModal from './components/modals/AboutModal';
import Sidebar from './components/Sidebar';
import VideoStudio from './components/VideoStudio';
import CommunityChat from './components/CommunityChat';
import { clearAllData } from './utils/storage';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [activeView, setActiveView] = useState('generate');

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleOpenModal = (modalName: string) => {
    setActiveModal(modalName);
  };

  const handleCloseModals = () => {
    setActiveModal(null);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all your creations and chat history? This action cannot be undone.')) {
      clearAllData();
      window.location.reload();
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
        case 'generate':
            return <ImageGenerator />;
        case 'studio':
            return <VideoStudio />;
        case 'community':
            return <CommunityChat />;
        default:
            return <ImageGenerator />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      {isAuthenticated ? (
        <div className="flex h-screen bg-slate-900">
          <Sidebar 
            activeView={activeView}
            onNavigate={setActiveView}
            onOpenModal={handleOpenModal}
            onLogout={handleLogout}
          />
           <main className="flex-1 overflow-y-auto relative isolate">
                <div className="absolute inset-0 w-full h-full main-app-bg -z-10" />
                <div className="p-4 sm:p-6 lg:p-8 h-full">
                    {renderActiveView()}
                </div>
           </main>

          <CreationsModal isOpen={activeModal === 'creations'} onClose={handleCloseModals} />
          <SettingsModal isOpen={activeModal === 'settings'} onClose={handleCloseModals} onClearAllData={handleClearAllData} />
          <PrivacyModal isOpen={activeModal === 'privacy'} onClose={handleCloseModals} />
          <AboutModal isOpen={activeModal === 'about'} onClose={handleCloseModals} />
        </div>
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
};

export default App;
