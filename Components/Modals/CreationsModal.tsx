
import React, { useState, useEffect } from 'react';
import ModalWrapper from './ModalWrapper';
import { getCreations } from '../../utils/storage';
import PlayIcon from '../icons/PlayIcon';

interface CreationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreationsModal: React.FC<CreationsModalProps> = ({ isOpen, onClose }) => {
  const [creations, setCreations] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCreations(getCreations());
    }
  }, [isOpen]);

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="My Creations">
      {creations.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-8">
          You haven't saved any creations yet. Start generating some art!
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {creations.map((url, index) => {
            const isVideo = url.startsWith('blob:');
            return (
              <div key={index} className="aspect-square bg-slate-700/50 rounded-lg overflow-hidden relative group">
                {isVideo ? (
                  <>
                    <video src={url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayIcon />
                    </div>
                  </>
                ) : (
                  <img src={url} alt={`Creation ${index + 1}`} className="w-full h-full object-cover" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </ModalWrapper>
  );
};

export default CreationsModal;
