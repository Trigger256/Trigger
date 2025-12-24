
import React from 'react';
import ModalWrapper from './ModalWrapper';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="Privacy Policy">
        <div className="space-y-4 text-slate-400 text-sm prose prose-invert prose-sm">
            <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>
            <p>Your privacy is important to us. It is Trigger AI's policy to respect your privacy regarding any information we may collect from you across our website, and other sites we own and operate.</p>
            
            <h4 className="text-slate-300 font-semibold pt-4">1. Information We Collect</h4>
            <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.</p>
            
            <h4 className="text-slate-300 font-semibold pt-4">2. Use of Information</h4>
            <p>We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we’ll protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.</p>

            <h4 className="text-slate-300 font-semibold pt-4">3. Image Data</h4>
            <p>Images you upload or generate are processed by Google's Gemini API. We do not store your images on our servers. Your images are subject to Google's privacy policy, which you can review on their website.</p>
            
            <h4 className="text-slate-300 font-semibold pt-4">4. Sharing Information</h4>
            <p>We don’t share any personally identifying information publicly or with third-parties, except when required to by law.</p>

            <p>Your continued use of our website will be regarded as acceptance of our practices around privacy and personal information. If you have any questions about how we handle user data and personal information, feel free to contact us.</p>
        </div>
    </ModalWrapper>
  );
};

export default PrivacyModal;
