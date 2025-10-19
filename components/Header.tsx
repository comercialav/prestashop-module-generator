// FIX: Changed React import to a namespace import (`* as React`) to resolve type errors with hooks and generic functional components.
import * as React from 'react';
import { View } from '../types';

interface HeaderProps {
  currentView: View;
  setView: (view: View) => void;
  onTestEmail: () => void;
  isGenerating: boolean;
}

const NavButton: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'bg-sky-600 text-white shadow-lg'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {label}
  </button>
);

const Header: React.FC<HeaderProps> = ({ currentView, setView, onTestEmail, isGenerating }) => {
  return (
    <header className="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg shadow-black/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h1 className="text-xl font-bold ml-3 text-white tracking-wider">
              PrestaShop ModuleGenius AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-2 bg-gray-900/50 p-1 rounded-lg">
              <NavButton
                label="New Module"
                isActive={currentView === View.CREATION}
                onClick={() => setView(View.CREATION)}
              />
              <NavButton
                label="My Modules"
                isActive={currentView === View.DIRECTORY}
                onClick={() => setView(View.DIRECTORY)}
              />
            </nav>
            <button
              onClick={onTestEmail}
              disabled={isGenerating}
              className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-teal-200 bg-teal-800/50 hover:bg-teal-700/70 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400 flex items-center"
              title="Send a test email to check the service configuration"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Test Email
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
