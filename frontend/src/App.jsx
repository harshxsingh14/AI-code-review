import { useState } from 'react';
import Editor from 'react-simple-code-editor';
// Import only the styles for highlight.js
import 'highlight.js/styles/github-dark.css'; 
import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import axios from 'axios';
import './App.css';

// Simple function to highlight the code for the Editor component
// react-simple-code-editor doesn't have native highlight.js support, 
// so we just return the code to maintain basic styling and let 
// the CSS handle the syntax colors as best it can without prism.js.
// If you truly need highlight.js within the editor, you'd need a more complex wrapper.
const highlightCode = (code) => code;

function App() {
  // Removed unused 'count' state
  const [code, setCode] = useState(`function sum(a, b) {
  // Always use strict equality checks (===)
  if (a !== undefined && b !== undefined) {
    return a + b;
  }
  return 0;
}`);

  const [review, setReview] = useState(``);

  // Removed useEffect(() => { prism.highlightAll() }, []) as prism is removed and it was likely redundant/problematic.

  async function reviewCode() {
    try {
      const response = await axios.post('http://localhost:3000/ai/get-review', { code });
      setReview(response.data);
    } catch (error) {
      // It's crucial to handle API errors for debugging!
      console.error("Error fetching code review:", error);
      setReview(`**Error:** Could not connect to the review service at http://localhost:3000/ai/get-review. Please check your server.`);
    }
  }

  return (
    <>
      <main>
        <div className="left">
          <div className="code">
            <Editor
              value={code}
              onValueChange={setCode}
              // Use the simple function, allowing highlight.js CSS to style the tokens
              highlight={highlightCode} 
              padding={10}
              style={{
                fontFamily: '"Fira code", "Fira Mono", monospace',
                fontSize: 16,
                border: '1px solid #ddd',
                borderRadius: '5px',
                height: '100%',
                width: '100%',
              }}
            />
          </div>
          <div
            onClick={reviewCode}
            className="review"
          >
            Review Code
          </div>
        </div>
        <div className="right">
          {/* Ensure rehypeHighlight is used for markdown code blocks */}
          <Markdown
            rehypePlugins={[rehypeHighlight]}
          >
            {review || "Your code review will appear here."}
          </Markdown>
        </div>
      </main>
    </>
  );
}

export default App;