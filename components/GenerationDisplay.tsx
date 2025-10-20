// FIX: Switched from a namespace import (`* as React`) to a default import with named hooks (`useState`, `useEffect`) to resolve TypeScript errors with generic types and hooks.
import React, { useState, useEffect } from 'react';
import { GenerationState } from '../types';

interface GenerationDisplayProps {
  state: GenerationState;
}

// FIX: Namespace '"file:///node_modules/react/index".export=' has no exported member 'FC'.
const GenerationDisplay: React.FC<GenerationDisplayProps> = ({ state }) => {
  const { plan, files } = state;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalSteps = (plan.length || 5) + 2; // Plan steps + 2 code files
    const completedSteps = plan.filter(p => p).length + files.size;
    setProgress(Math.round((completedSteps / totalSteps) * 100));
  }, [plan, files]);

  return (
    <div className="mt-6 space-y-6">
      <div>
        <h4 className="text-lg font-semibold text-gray-300 mb-3">Generation Progress</h4>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        <p className="text-right text-sm text-gray-400 mt-1">{progress}% Complete</p>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-gray-300 mb-3">Execution Plan</h4>
        <ul className="space-y-3">
          {plan.map((step, index) => (
            <li key={index} className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="ml-3 text-sm text-gray-300">{step}</p>
            </li>
          ))}
          {plan.length === 0 && (
             <li className="flex items-start animate-pulse">
                <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <p className="ml-3 text-sm text-gray-400">Waiting for AI to generate plan...</p>
             </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default GenerationDisplay;
