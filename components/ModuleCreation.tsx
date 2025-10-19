// FIX: Changed to namespace import to resolve module export errors for hooks and types.
import * as React from 'react';

interface ModuleCreationProps {
  onCreate: (description: string) => void;
  isGenerating: boolean;
}

const ModuleCreation: React.FC<ModuleCreationProps> = ({ onCreate, isGenerating }) => {
  const [description, setDescription] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(description);
  };

  return (
    <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl shadow-2xl shadow-black/30 overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-bold text-white mb-2">Create a New PrestaShop Module</h2>
        <p className="text-gray-400 mb-6">Describe the functionality you need. Be as detailed as possible. The AI will handle the research, planning, and coding.</p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="module-description" className="block text-sm font-medium text-gray-300 mb-2">
              Module Requirements
            </label>
            <textarea
              id="module-description"
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isGenerating}
              className="w-full bg-gray-900/50 text-gray-200 border border-gray-600 rounded-md p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all placeholder-gray-500"
              placeholder="e.g., 'Create a module that adds a custom block to the homepage displaying the 5 best-selling products. It should have a configurable title and product limit in the admin panel.'"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isGenerating || !description}
              className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-500 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-sky-500 transition-all duration-200 flex items-center"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : "Generate Module"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModuleCreation;