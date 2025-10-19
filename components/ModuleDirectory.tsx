// FIX: Changed React import to a namespace import (`* as React`) to resolve type errors with hooks and generic functional components.
import * as React from 'react';
import { PrestaModule } from '../types';
import ModuleCard from './ModuleCard';

interface ModuleDirectoryProps {
  modules: PrestaModule[];
  onModify: (moduleId: string, modificationRequest: string) => void;
  onUpload: (file: File) => Promise<void>;
  activeGenerationId: string | null;
}

const ModuleDirectory: React.FC<ModuleDirectoryProps> = ({ modules, onModify, onUpload, activeGenerationId }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset the input value to allow uploading the same file again
    event.target.value = '';
  };


  if (modules.length === 0) {
    return (
      <div className="text-center py-20">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7l8 5 8-5" />
        </svg>
        <h3 className="mt-2 text-2xl font-semibold text-gray-400">No Modules Yet</h3>
        <p className="mt-1 text-lg text-gray-500">Create your first module or upload an existing one.</p>
         <div className="mt-6">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".zip"
            />
            <button
              onClick={handleUploadClick}
              className="px-5 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-sky-500 transition-all duration-200 inline-flex items-center"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              Upload Module (.zip)
            </button>
          </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white">My Modules</h2>
        <div>
           <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".zip"
            />
            <button
              onClick={handleUploadClick}
              className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-sky-500 transition-all duration-200 inline-flex items-center"
            >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              Upload Module (.zip)
            </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {modules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            onModify={onModify}
            isBeingGenerated={activeGenerationId === module.id}
          />
        ))}
      </div>
    </div>
  );
};

export default ModuleDirectory;
