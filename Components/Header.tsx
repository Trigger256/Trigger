
import React, { useState, useEffect, useRef } from 'react';
import Menu from './Menu';
import UserIcon from './icons/UserIcon';

interface HeaderProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  onOpenModal: (modalName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isAuthenticated, onLogout, onOpenModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <header className="py-5 px-4 sm:px-8 border-b border-slate-700/50 backdrop-blur-sm bg-gray-900/50 sticky top-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-wider bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
          Trigger AI PhotoEditor Pro
        </h1>
        {isAuthenticated ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
              aria-label="Open user menu"
            >
              <UserIcon />
            </button>
            {isMenuOpen && <Menu onLogout={onLogout} onClose={() => setIsMenuOpen(false)} onOpenModal={onOpenModal} />}
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-cyan-500 rounded-full animate-pulse"></div>
        )}
      </div>
    </header>
  );
};

export default Header;
