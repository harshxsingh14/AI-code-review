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
 */
const CodeRenderer = ({ inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
        // Styled pre block for code snippets
        <pre className="code-block-pre">
            <code className={`code-block-code language-${match[1]}`} {...props}>
                {String(children).replace(/\n$/, '')}
            </code>
        </pre>
    ) : (
        // Inline code styling
        <code className="inline-code" {...props}>
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
    const components = {
        code: CodeRenderer,
        h1: ({ ...props }) => <h1 className="review-h1" {...props} />,
        h2: ({ ...props }) => <h2 className="review-h2" {...props} />,
        h3: ({ ...props }) => <h3 className="review-h3" {...props} />,
        p: ({ ...props }) => <p className="review-p" {...props} />,
        ul: ({ ...props }) => <ul className="review-ul" {...props} />,
        li: ({ ...props }) => <li className="review-li" {...props} />,
        strong: ({ ...props }) => <strong className="review-strong" {...props} />,
    };

    return (
        <div className="app-container">
            <header className="app-header">
                <h1 className="app-title">
                    <Code className="app-icon" />
                    AI Code Reviewer
                </h1>
                <p className="app-subtitle">Paste your code and expertise to find bugs and suggest improvements.</p>
            </header>

            <main className="main-content">
                
                {/* LEFT PANE: CODE EDITOR */}
                <div className="pane code-pane">
                    <h2 className="pane-title">Code Input</h2>
                    <div className="code-editor-wrapper">
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="code-editor"
                            aria-label="Code editor input"
                        />
                    </div>
                    
                    <button
                        onClick={reviewCode}
                        disabled={isLoading}
                        className={`review-button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <span className="button-content">
                                <Loader2 className="button-icon loader-spin" />
                                Reviewing Code...
                            </span>
                        ) : (
                            <span className="button-content">
                                <Sparkles className="button-icon" />
                                Get AI Review
                            </span>
                        )}
                    </button>
                </div>

                {/* RIGHT PANE: REVIEW OUTPUT */}
                <div className="pane review-pane">
                    <h2 className="pane-title">AI Code Review</h2>
                    <div className="review-panel">
                        {review ? (
                            <Markdown components={components}>
                                {review}
                            </Markdown>
                        ) : isLoading ? (
                            <div className="review-loading-state">
                                <Loader2 className="review-loader loader-spin" />
                                <p className="review-loading-text">The AI is analyzing your code structure and logic...</p>
                                <p className="review-sub-text">This may take a moment.</p>
                            </div>
                        ) : (
                            <div className="review-empty-state">
                                <Sparkles className="empty-state-icon" />
                                <p className="review-empty-text">Your comprehensive, detailed code review will appear here.</p>
                                <p className="review-sub-text">Paste your code on the left and click 'Get AI Review' to begin.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;