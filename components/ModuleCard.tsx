import React, { useState } from 'react';
import { PrestaModule, GenerationStatusEnum } from '../types';
import GenerationDisplay from './GenerationDisplay';
import CodeBlock from './CodeBlock';
import { toast } from 'react-toastify';
import { sendEmailNotification } from '../services/emailService';

interface ModuleCardProps {
  module: PrestaModule;
  onModify: (moduleId: string, modificationRequest: string) => void;
  isBeingGenerated: boolean;
}

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Result is "data:application/zip;base64,xxxx...". We only need the part after the comma.
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read blob as a string.'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, onModify, isBeingGenerated }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showModifyForm, setShowModifyForm] = useState(false);
  const [modificationRequest, setModificationRequest] = useState('');

  const getModuleName = (): string => {
    const files = module.generationState.files;
    return Array.from(files.keys())[0]?.split('/')[0] || module.id.replace('mod_', 'Module');
  }

  const createZipBlob = async (): Promise<Blob | null> => {
     if (typeof JSZip === 'undefined') {
      toast.error("JSZip library not loaded. Cannot create zip file.", { theme: 'dark' });
      return null;
    }
    const files = module.generationState.files;
    if (files.size === 0) {
      toast.warn("No files have been generated for this module yet.", { theme: 'dark' });
      return null;
    }
    try {
      const zip = new JSZip();
      files.forEach((content, path) => {
        zip.file(path, content);
      });
      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
       console.error("Failed to create zip file:", error);
      toast.error("An error occurred while creating the zip file.", { theme: 'dark' });
      return null;
    }
  }

  const handleDownload = async () => {
    const blob = await createZipBlob();
    if (!blob) return;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getModuleName()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async () => {
    const toastId = toast.loading('DEBUG: Starting email process...', { theme: 'dark', autoClose: false });

    // Step 1: Create ZIP
    toast.update(toastId, { render: 'DEBUG (1/5): Creating module .zip file...', isLoading: true });
    const blob = await createZipBlob();
    if (!blob) {
      toast.update(toastId, { render: 'DEBUG FAIL (1/5): Failed to create module .zip. Process stopped.', type: 'error', isLoading: false, autoClose: 8000 });
      return;
    }
    toast.update(toastId, { render: 'DEBUG OK (1/5): Module .zip created.', isLoading: true });

    let base64Content: string;
    try {
      // Step 2: Convert to Base64
      toast.update(toastId, { render: 'DEBUG (2/5): Encoding .zip to Base64...', isLoading: true });
      base64Content = await blobToBase64(blob);
      toast.update(toastId, { render: 'DEBUG OK (2/5): Encoding complete.', isLoading: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown encoding error.";
      toast.update(toastId, { render: `DEBUG FAIL (2/5): Base64 encoding failed: ${errorMessage}`, type: 'error', isLoading: false, autoClose: 8000 });
      return;
    }

    const moduleName = getModuleName();
    
    // Step 3 & 4: Call the service and await response
    try {
      toast.update(toastId, { render: `DEBUG (3/5): Contacting backend proxy at /api/send-email for module "${moduleName}"...`, isLoading: true });
      // The service itself will now throw detailed errors
      await sendEmailNotification(moduleName, base64Content);
      
      toast.update(toastId, { render: `DEBUG OK (5/5): Proxy confirmed email sent for "${moduleName}"!`, type: 'success', isLoading: false, autoClose: 5000 });
    } catch(error) {
       // Step 5: Catch and display the detailed error from the service
       const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
       toast.update(toastId, { render: `DEBUG FAIL: ${errorMessage}`, type: 'error', isLoading: false, autoClose: 15000 }); // Longer timeout to read error
    }
  }

  const status = module.generationState.status;

  return (
    <div className="bg-gray-800 rounded-xl shadow-2xl shadow-black/30 overflow-hidden transition-all duration-300">
      <div className="p-6 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold text-white">{module.name}</h3>
            <p className="text-sm text-gray-400 mt-1 line-clamp-2">{module.description}</p>
          </div>
          <div className="flex items-center space-x-2 ml-4">
            {status === GenerationStatusEnum.GENERATING && <span className="text-xs font-medium bg-blue-600/50 text-blue-200 py-1 px-2 rounded-full">Generating</span>}
            {status === GenerationStatusEnum.COMPLETED && <span className="text-xs font-medium bg-green-600/50 text-green-200 py-1 px-2 rounded-full">Completed</span>}
            {status === GenerationStatusEnum.ERROR && <span className="text-xs font-medium bg-red-600/50 text-red-200 py-1 px-2 rounded-full">Error</span>}
             <button>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-700/50">
          {status === GenerationStatusEnum.GENERATING && <GenerationDisplay state={module.generationState} />}
          
          {status !== GenerationStatusEnum.GENERATING && module.generationState.error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md my-4">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{module.generationState.error}</span>
            </div>
          )}
          
          {status === GenerationStatusEnum.COMPLETED && (
            <div>
              <p className="mt-4 p-3 bg-green-900/50 text-green-200 rounded-md text-sm">{module.generationState.completionMessage}</p>
              <div className="mt-4">
                <h4 className="text-lg font-semibold text-gray-300 mb-2">Generated Files</h4>
                {Array.from(module.generationState.files.keys()).map(filename => (
                  <CodeBlock key={filename} filename={filename} code={module.generationState.files.get(filename) || ''} />
                ))}
              </div>
               <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <h4 className="text-md font-semibold text-gray-300 mb-2">Send Module via Email</h4>
                  <p className="text-sm text-gray-400 mb-3">Click the button to send the module .zip file to your email via our secure service.</p>
                  <div className="flex justify-end">
                    <button onClick={handleSendEmail} disabled={isBeingGenerated} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-500 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-colors duration-200">
                      Send Email
                    </button>
                  </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end space-x-3">
             <button
              onClick={() => setShowModifyForm(!showModifyForm)}
              disabled={isBeingGenerated}
              className="px-4 py-2 bg-gray-700 text-gray-200 font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-600/50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Modify
            </button>
            <button
              onClick={handleDownload}
              disabled={status !== GenerationStatusEnum.COMPLETED || isBeingGenerated}
              className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 disabled:bg-sky-800/50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-colors duration-200"
            >
              Download .zip
            </button>
          </div>
          
          {showModifyForm && (
            <form onSubmit={(e) => { e.preventDefault(); onModify(module.id, modificationRequest); setShowModifyForm(false); setModificationRequest(''); }} className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-300 mb-2">Modify Module</h4>
                 <textarea
                    rows={4}
                    value={modificationRequest}
                    onChange={(e) => setModificationRequest(e.target.value)}
                    disabled={isBeingGenerated}
                    className="w-full bg-gray-800 text-gray-200 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-gray-500"
                    placeholder="e.g., 'Change the product limit to be 10 by default and add a new option to sort by date added.'"
                />
                <div className="flex justify-end mt-2">
                     <button type="submit" disabled={isBeingGenerated || !modificationRequest} className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-500 disabled:bg-gray-600">
                        Submit Modification
                    </button>
                </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleCard;