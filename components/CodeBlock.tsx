

import * as React from 'react';

interface CodeBlockProps {
  filename: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ filename, code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-gray-900/70 rounded-lg overflow-hidden my-4 border border-gray-700">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50">
        <span className="text-sm font-mono text-gray-400">{filename}</span>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-300 hover:text-white flex items-center transition-colors"
        >
          {copied ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
             <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm overflow-x-auto text-gray-200">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;