import React, { useState } from 'react';
import Markdown from 'react-markdown';
import axios from 'axios';
import { Sparkles, Code, Loader2 } from 'lucide-react';

// Set the correct, working endpoint URL
const API_URL = 'http://localhost:5000/ai/getReview';

// Initial placeholder code for the editor
const INITIAL_CODE = `function calculateSum(a, b) {
  // Good practice: Validate input types
  if (typeof a !== 'number' || typeof b !== 'number') {
    return 'Invalid Input';
  }

  // Simple, efficient operation
  return a + b;
}`;

/**
 * Custom component to handle the Markdown rendering for code blocks
 * Since we don't have rehype-highlight, we'll use a basic styled pre/code.
 * * NOTE: Removed 'node' from props to resolve the 'defined but never used' linting warning.
 */
const CodeRenderer = ({ inline, className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <pre className="bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto my-4 shadow-inner">
      <code className={`text-white language-${match[1]}`}>
        {String(children).replace(/\n$/, '')}
      </code>
    </pre>
  ) : (
    <code className="bg-indigo-100 text-indigo-700 px-1 py-0.5 rounded-md text-sm font-mono" {...props}>
      {children}
    </code>
  );
};


function App() {
    const [code, setCode] = useState(INITIAL_CODE);
    const [review, setReview] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Handles the request to the backend for code review.
     */
    async function reviewCode() {
        if (!code.trim()) {
            setReview("**Error:** Please enter code to review.");
            return;
        }

        setIsLoading(true);
        setReview("");

        try {
            // Implement simple exponential backoff for resilience
            let response;
            let attempts = 0;
            const maxAttempts = 3;
            let success = false;

            while (attempts < maxAttempts && !success) {
                try {
                    attempts++;
                    response = await axios.post(API_URL, { code });
                    success = true;
                } catch (error) {
                    if (attempts < maxAttempts) {
                        const delay = Math.pow(2, attempts) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    } else {
                        throw error; // Throw after max attempts
                    }
                }
            }
            
            if (response && response.data) {
                setReview(response.data);
            } else {
                 setReview("**Error:** Backend returned an empty response.");
            }
        } catch (error) {
            console.error("Error fetching code review:", error);
            
            // Provide a clear user-facing error message
            let errorMessage = `**Error:** Could not connect to the review service at \`${API_URL}\`.`;
            if (error.response) {
                // If there's an error response from the server (e.g., 500)
                errorMessage = `**API Error (${error.response.status}):** ${error.response.data || 'Failed to generate review.'}`;
            } else if (error.request) {
                // If the request was made but no response was received (e.g., connection refused)
                errorMessage += " Please ensure your backend server is running and accessible.";
            }
            setReview(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }

    // Custom components map for react-markdown to improve styling
    // NOTE: Removed 'node' from props destructuring to resolve the 'defined but never used' linting warning.
    const components = {
        code: CodeRenderer,
        h1: ({ ...props }) => <h1 className="text-3xl font-extrabold text-indigo-700 mt-6 mb-3" {...props} />,
        h2: ({ ...props }) => <h2 className="text-2xl font-bold text-gray-800 border-b pb-1 mt-6 mb-3" {...props} />,
        h3: ({ ...props }) => <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2" {...props} />,
        p: ({ ...props }) => <p className="mb-4 leading-relaxed" {...props} />,
        ul: ({ ...props }) => <ul className="list-disc list-inside ml-4 mb-4 space-y-2" {...props} />,
        li: ({ ...props }) => <li className="text-gray-600" {...props} />,
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-['Inter']">
            <header className="mb-8 text-center bg-white p-6 rounded-xl shadow-lg">
                <h1 className="text-4xl sm:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight flex justify-center items-center">
                    <Code className="w-8 h-8 mr-3 text-indigo-500" />
                    AI Code Reviewer
                </h1>
                <p className="text-gray-600 mt-3 text-lg">Paste your code and get **Gemini's** expertise to find bugs and suggest improvements.</p>
            </header>

            <main className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
                
                {/* LEFT PANE: CODE EDITOR */}
                <div className="flex flex-col w-full lg:w-1/2">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-800">Code Input</h2>
                    <div className="flex-grow flex flex-col border border-gray-300 rounded-xl shadow-2xl overflow-hidden bg-[#282c34] transition duration-300 hover:shadow-indigo-300/50">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full h-full p-4 resize-none bg-[#282c34] text-gray-200 focus:outline-none 
                                     font-mono text-sm leading-relaxed tracking-tight"
                            style={{
                                minHeight: '400px', // Ensure min height for better feel
                                height: '60vh', // Set a responsive height
                            }}
                            aria-label="Code editor input"
                        />
                    </div>
                    
                    <button
                        onClick={reviewCode}
                        disabled={isLoading}
                        className="mt-6 p-4 text-center text-white font-bold rounded-xl cursor-pointer transition duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 flex items-center justify-center 
                                   focus:outline-none focus:ring-4 focus:ring-purple-300 
                                   bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500"
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <Loader2 className="animate-spin w-5 h-5 mr-3" />
                                Reviewing Code...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <Sparkles className="w-5 h-5 mr-3" />
                                Get AI Review
                            </span>
                        )}
                    </button>
                </div>

                {/* RIGHT PANE: REVIEW OUTPUT */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <h2 className="text-2xl font-semibold mb-3 text-gray-800">AI Code Review</h2>
                    <div className="flex-grow p-6 bg-white shadow-2xl rounded-xl overflow-y-auto border border-indigo-100 transition duration-300 hover:shadow-purple-300/50"
                        style={{ minHeight: '400px', height: '60vh' }}
                    >
                        {review ? (
                            <Markdown components={components}>
                                {review}
                            </Markdown>
                        ) : isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-indigo-500">
                                <Loader2 className="animate-spin w-8 h-8 mb-4" />
                                <p className="text-lg italic">The AI is analyzing your code structure and logic...</p>
                                <p className="text-sm mt-1 text-gray-500">This may take a moment.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                <Sparkles className="w-10 h-10 text-purple-400 mb-4" />
                                <p className="text-lg text-gray-500 font-medium">Your comprehensive, detailed code review will appear here.</p>
                                <p className="text-sm text-gray-400 mt-2">Paste your code on the left and click 'Get AI Review' to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <style>{`
                /* Font for consistency */
                .font-['Inter'] { font-family: 'Inter', sans-serif; }

                /* Customizing prose for a better look */
                .prose {
                    color: #1f2937; /* Gray-800 */
                    font-size: 1rem;
                    line-height: 1.75;
                }
                .prose strong {
                    font-weight: 700;
                    color: #4338ca; /* Indigo-700 */
                }
            `}</style>
        </div>
    );
}

export default App;