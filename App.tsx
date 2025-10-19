import * as React from 'react';
import { View, PrestaModule, GenerationStatusEnum, GenerationState } from './types';
import { generateModuleStream } from './services/geminiService';
import Header from './components/Header';
import ModuleCreation from './components/ModuleCreation';
import ModuleDirectory from './components/ModuleDirectory';
import { ToastContainer, toast } from 'react-toastify';
import { sendEmailNotification } from './services/emailService';

// Minimalist styling for react-toastify to match Tailwind dark theme
const toastOptions = {
    position: "bottom-right" as const,
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "dark" as const,
};

// Helper functions for serializing/deserializing Maps to/from JSON
const replacer = (key: string, value: any) => {
  if(value instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(value.entries()),
    };
  }
  return value;
};

const reviver = (key: string, value: any) => {
  if(typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
  }
  return value;
};


export default function App() {
  const [view, setView] = React.useState<View>(View.CREATION);
  // Load modules from localStorage on initial render
  const [modules, setModules] = React.useState<PrestaModule[]>(() => {
    try {
      const savedModules = window.localStorage.getItem('prestaModules');
      return savedModules ? JSON.parse(savedModules, reviver) : [];
    } catch (error) {
      console.error("Failed to load modules from localStorage", error);
      return [];
    }
  });
  const [activeGenerationId, setActiveGenerationId] = React.useState<string | null>(null);

  // Save modules to localStorage whenever they change
  React.useEffect(() => {
    try {
      window.localStorage.setItem('prestaModules', JSON.stringify(modules, replacer));
    } catch (error) {
      console.error("Failed to save modules to localStorage", error);
    }
  }, [modules]);


  const updateModuleGenerationState = React.useCallback((moduleId: string, newGenerationState: Partial<GenerationState>) => {
    setModules(prevModules =>
      prevModules.map(m =>
        m.id === moduleId
          ? { ...m, generationState: { ...m.generationState, ...newGenerationState } }
          : m
      )
    );
  }, []);

  const handleTestEmail = async () => {
    // FIX: Cast toast to any to access the 'loading' method, which seems to be missing from the type definitions.
    const toastId = (toast as any).loading('Sending test email...', toastOptions);
    try {
        // Use placeholder values for the test
        const moduleName = 'Email System Test';
        // The base64 content can be empty for the mock, as it's not used.
        // For a real implementation, Resend can send emails without attachments.
        const base64Content = ''; 

        await sendEmailNotification(moduleName, base64Content);

        toast.update(toastId, {
            render: 'Test email process completed successfully!',
            type: 'success',
            isLoading: false,
            autoClose: 5000
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast.update(toastId, {
            render: `Test email failed: ${errorMessage}`,
            type: 'error',
            isLoading: false,
            autoClose: 10000
        });
    }
  };

  const handleCreateModule = async (description: string) => {
    if (!description.trim()) {
      toast.error("Please provide a description for your module.", toastOptions);
      return;
    }
    
    const newModuleId = `mod_${Date.now()}`;
    const moduleName = description.split(' ').slice(0, 5).join(' ') + '...';

    const newModule: PrestaModule = {
      id: newModuleId,
      name: moduleName,
      description,
      generationState: {
        status: GenerationStatusEnum.GENERATING,
        plan: [],
        currentPlanStep: 0,
        files: new Map(),
        error: null,
        completionMessage: '',
      },
    };
    
    setModules(prev => [newModule, ...prev]);
    setActiveGenerationId(newModuleId);
    setView(View.DIRECTORY);
    toast.info(`Started generating module: ${moduleName}`, toastOptions);

    try {
      for await (const update of generateModuleStream(description, 'create')) {
        updateModuleGenerationState(newModuleId, update);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      updateModuleGenerationState(newModuleId, { status: GenerationStatusEnum.ERROR, error: errorMessage });
      toast.error(`Error generating module: ${errorMessage}`, toastOptions);
    } finally {
       setActiveGenerationId(null);
    }
  };

  const handleModifyModule = async (moduleId: string, modificationRequest: string) => {
    const targetModule = modules.find(m => m.id === moduleId);
    if (!targetModule) {
      toast.error("Module not found for modification.", toastOptions);
      return;
    }

    if (!modificationRequest.trim()) {
      toast.error("Please provide modification instructions.", toastOptions);
      return;
    }
    
    const originalDescription = targetModule.description;
    
    updateModuleGenerationState(moduleId, {
        status: GenerationStatusEnum.GENERATING,
        plan: [],
        currentPlanStep: 0,
        files: targetModule.generationState.files, // Start with existing files
        error: null,
        completionMessage: '',
    });
    
    setActiveGenerationId(moduleId);
    toast.info(`Started modifying module: ${targetModule.name}`, toastOptions);

    try {
        const fullPrompt = `Original module description: "${originalDescription}". The module has these existing files: ${Array.from(targetModule.generationState.files.keys()).join(', ')}. Modification request: "${modificationRequest}"`;
        for await (const update of generateModuleStream(fullPrompt, 'modify')) {
            updateModuleGenerationState(moduleId, update);
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        updateModuleGenerationState(moduleId, { status: GenerationStatusEnum.ERROR, error: errorMessage });
        toast.error(`Error modifying module: ${errorMessage}`, toastOptions);
    } finally {
        setActiveGenerationId(null);
    }
  };

  const handleUploadModule = async (file: File) => {
    if (typeof JSZip === 'undefined') {
      toast.error("File processing library not loaded. Please try again.", toastOptions);
      return;
    }

    // FIX: Cast toast to any to access the 'loading' method, which seems to be missing from the type definitions.
    const toastId = (toast as any).loading(`Processing ${file.name}...`, toastOptions);

    try {
      const zip = await JSZip.loadAsync(file);
      const files = new Map<string, string>();
      let moduleName = file.name.replace('.zip', '');
      let moduleDescription = `Module uploaded from ${file.name}`;
      let configXmlContent = '';
      
      const filePromises = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!zipEntry.dir) {
           filePromises.push(
             zipEntry.async('string').then(content => {
                files.set(relativePath, content);
                if (relativePath.endsWith('config.xml')) {
                  configXmlContent = content;
                }
             })
           );
        }
      });
      
      await Promise.all(filePromises);

      // Attempt to parse config.xml for better metadata
      if (configXmlContent) {
        const nameMatch = configXmlContent.match(/<displayName><!\[CDATA\[(.*?)\]\]><\/displayName>/);
        const descMatch = configXmlContent.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/);
        if (nameMatch && nameMatch[1]) moduleName = nameMatch[1];
        if (descMatch && descMatch[1]) moduleDescription = descMatch[1];
      }

      const newModule: PrestaModule = {
        id: `mod_upload_${Date.now()}`,
        name: moduleName,
        description: moduleDescription,
        generationState: {
          status: GenerationStatusEnum.COMPLETED,
          plan: [],
          currentPlanStep: 0,
          files: files,
          error: null,
          completionMessage: `Successfully imported module from ${file.name}.`,
        },
      };

      setModules(prev => [newModule, ...prev]);
      setView(View.DIRECTORY);
      toast.update(toastId, { render: `Module "${moduleName}" uploaded successfully!`, type: 'success', isLoading: false, autoClose: 5000 });
    } catch (error) {
      console.error("Failed to process zip file:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.update(toastId, { render: `Error processing zip: ${errorMessage}`, type: 'error', isLoading: false, autoClose: 8000 });
    }
  };


  return (
    <>
      <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
        <Header 
          currentView={view} 
          setView={setView}
          onTestEmail={handleTestEmail}
          isGenerating={!!activeGenerationId}
        />
        <main className="container mx-auto p-4 md:p-8">
          {view === View.CREATION && <ModuleCreation onCreate={handleCreateModule} isGenerating={!!activeGenerationId} />}
          {view === View.DIRECTORY && (
            <ModuleDirectory 
              modules={modules}
              onModify={handleModifyModule}
              onUpload={handleUploadModule}
              activeGenerationId={activeGenerationId}
            />
          )}
        </main>
      </div>
      <ToastContainer />
    </>
  );
}