
import React, { useState } from 'react';
import AnimatedArtDisplay from './AnimatedArtDisplay';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you'd have API calls here.
    // We'll just simulate a successful login.
    onLoginSuccess();
  };

  return (
    <div className="flex-grow flex items-center justify-center animate-fade-in p-4">
      <div className="w-full max-w-sm md:max-w-6xl mx-auto grid md:grid-cols-2 gap-0 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/50 backdrop-blur-lg overflow-hidden">
        <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
            <div className="mb-8 text-center">
                 <h1 className="text-3xl md:text-4xl font-bold tracking-wider bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
                    Trigger AI PhotoEditor Pro
                </h1>
                <h2 className="text-2xl font-semibold text-slate-200 mt-4">
                    {isLoginView ? 'Sign In' : 'Create Account'}
                </h2>
                <p className="text-slate-400 mt-2 text-sm">{isLoginView ? 'Sign in to continue your creative journey.' : 'Unlock the future of photo editing.'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-slide-in-bottom">
                {!isLoginView && (
                     <div>
                        <label className="text-sm font-semibold text-slate-300">Name</label>
                        <input type="text" placeholder="Your Name" required className="w-full mt-1 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all outline-none" />
                    </div>
                )}
                <div>
                    <label className="text-sm font-semibold text-slate-300">Email</label>
                    <input type="email" placeholder="you@example.com" required className="w-full mt-1 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all outline-none" />
                </div>
                 <div>
                    <label className="text-sm font-semibold text-slate-300">Password</label>
                    <input type="password" placeholder="••••••••" required className="w-full mt-1 p-3 bg-slate-900/70 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 transition-all outline-none" />
                </div>
                <button type="submit" className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:opacity-50 transform hover:scale-105 transition-transform">
                    {isLoginView ? 'Sign In' : 'Sign Up'}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
                <p>
                    {isLoginView ? "Don't have an account?" : "Already have an account?"}
                    <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-cyan-400 hover:text-cyan-300 ml-2">
                         {isLoginView ? 'Sign Up' : 'Sign In'}
                    </button>
                </p>
            </div>
            
            <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-slate-700"></div>
                <span className="flex-shrink mx-4 text-slate-500 text-xs">OR CONTINUE WITH</span>
                <div className="flex-grow border-t border-slate-700"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">G</button>
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">A</button>
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">F</button>
            </div>
        </div>
        <div className="h-48 md:h-full order-1 md:order-2">
            <AnimatedArtDisplay />
        </div>
      </div>
    </div>
  );
};

export default AuthPage;