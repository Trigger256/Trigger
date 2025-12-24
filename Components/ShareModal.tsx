
import React from 'react';
import XCircleIcon from './icons/XCircleIcon';
import TwitterIcon from './icons/TwitterIcon';
import FacebookIcon from './icons/FacebookIcon';
import PinterestIcon from './icons/PinterestIcon';
import RedditIcon from './icons/RedditIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';

interface ShareModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

// Utility to convert any URL (data or blob) to a File object
async function urlToFile(url: string, fileName: string): Promise<File | null> {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return new File([blob], fileName, { type: blob.type });
    } catch (error) {
        console.error("Could not convert URL to file:", error);
        return null;
    }
}

const ShareModal: React.FC<ShareModalProps> = ({ imageUrl, onClose }) => {
    const handleShare = async () => {
        if (!imageUrl) {
            alert('No content to share.');
            return;
        }

        const isVideo = imageUrl.startsWith('blob:');
        const fileExtension = isVideo ? 'mp4' : 'png';
        const fileName = `trigger-ai-creation.${fileExtension}`;

        const shareData: ShareData = {
            title: 'Created with Trigger AI PhotoEditor Pro',
            text: `Check out this ${isVideo ? 'video' : 'image'} I created using Trigger AI!`,
        };
    
        const file = await urlToFile(imageUrl, fileName);

        // Check if the browser supports sharing files.
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    ...shareData,
                    files: [file],
                });
                onClose(); // Close modal on successful share
            } catch (error) {
                console.error('Error sharing file:', error);
                // User might have cancelled the share, so we don't show an alert here.
            }
        } else {
            // Fallback for desktop or unsupported browsers
            alert(`Your browser doesn't support direct ${isVideo ? 'video' : 'image'} sharing. Please download the content to share it.`);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-30 flex flex-col items-center justify-center p-4 animate-fade-in-subtle">
            <div className="w-full max-w-sm bg-slate-800 rounded-lg p-6 space-y-4 relative shadow-2xl border border-slate-700">
                <button onClick={onClose} className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors">
                    <XCircleIcon />
                </button>
                <h3 className="text-xl font-bold text-center text-cyan-400">Share your Creation</h3>
                <p className="text-sm text-slate-400 text-center">Select a platform to share your art. This will open your device's native share menu.</p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                    <ShareButton platform="Twitter" icon={<TwitterIcon />} onClick={handleShare} />
                    <ShareButton platform="Facebook" icon={<FacebookIcon />} onClick={handleShare} />
                    <ShareButton platform="Pinterest" icon={<PinterestIcon />} onClick={handleShare} />
                    <ShareButton platform="Reddit" icon={<RedditIcon />} onClick={handleShare} />
                    <ShareButton platform="WhatsApp" icon={<WhatsAppIcon />} onClick={handleShare} />
                </div>
            </div>
        </div>
    );
};

interface ShareButtonProps {
    platform: string;
    icon: React.ReactNode;
    onClick: () => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ platform, icon, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-slate-300 hover:text-white">
        {icon}
        <span className="text-xs font-semibold">{platform}</span>
    </button>
);


export default ShareModal;
