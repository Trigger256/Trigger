
import React from 'react';
import UploadIcon from './icons/UploadIcon';
import WandIcon from './icons/WandIcon';

interface EmptyStateProps {
    message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-900/50 rounded-lg">
            <div className="p-4 bg-slate-800/60 rounded-full mb-4">
                 <WandIcon />
            </div>
            <p className="text-slate-400 max-w-xs">{message}</p>
            <p className="text-xs text-slate-500 mt-2">Start by using the 'Generate' tab.</p>
        </div>
    );
};

export default EmptyState;
