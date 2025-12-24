
import React from 'react';

const LogoIcon: React.FC = () => {
    return (
        <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#00e5ff', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 7L12 12L22 7" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 22V12" stroke="url(#logoGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 4.5L12 8L4 4.5" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" opacity="0.7"/>
            <path d="M17 19.5L12 17L7 19.5" stroke="url(#logoGradient)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 2" opacity="0.7"/>
        </svg>
    );
};

export default LogoIcon;
