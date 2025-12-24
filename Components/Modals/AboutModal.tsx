
import React from 'react';
import ModalWrapper from './ModalWrapper';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="About Trigger AI PhotoEditor Pro">
      <div className="text-center">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
          Trigger AI PhotoEditor Pro
        </h3>
        <p className="text-slate-400 mt-2">Version 1.0.0</p>
        <p className="mt-6 text-slate-300 max-w-md mx-auto">
          This is a next-generation, AI-powered photo editor designed to bring your creative visions to life. 
          Generate stunning, unique images from simple text prompts, and experience the future of digital artistry.
        </p>
        <p className="text-xs text-slate-500 mt-8">
            &copy; {new Date().getFullYear()} Trigger AI. All Rights Reserved.
        </p>
      </div>
    </ModalWrapper>
  );
};

export default AboutModal;
