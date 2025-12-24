
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-4 px-4 sm:px-8 text-center text-slate-500 text-sm border-t border-slate-700/50">
      <p>&copy; {new Date().getFullYear()} Trigger AI. All rights reserved. The future of creativity is now.</p>
    </footer>
  );
};

export default Footer;
