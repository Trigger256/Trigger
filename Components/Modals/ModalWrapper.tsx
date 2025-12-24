
import React from 'react';
import XCircleIcon from '../icons/XCircleIcon';

interface ModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4 animate-fade-in-subtle"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 w-full max-w-2xl animate-slide-in-bottom flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="relative flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">{title}</h2>
          {/* FIX: Wrapped XCircleIcon in a button for consistent usage and styling. */}
          <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
            <XCircleIcon />
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ModalWrapper;
