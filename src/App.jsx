import { useState, useRef } from 'react';
import './App.css';

function App() {
  const [transcript, setTranscript] = useState('');
  const [customPrompt, setCustomPrompt] = useState('Summarize key points and action items');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('Meeting Summary');
  const [apiStatus, setApiStatus] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|docx)$/i)) {
      setError('Please upload a .txt or .docx file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large (max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTranscript(e.target.result);
      setError('');
    };
    reader.onerror = () => setError('Error reading file');
    reader.readAsText(file);
  };

  const generateSummary = async () => {
    if (!transcript.trim()) {
      setError('Please upload or paste a transcript');
      return;
    }

    setIsLoading(true);
    setError('');
    setApiStatus('processing');

    try {
      const response = await fetch('http://localhost:3001/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          customPrompt: customPrompt || 'Provide a comprehensive summary with action items'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setSummary(data.summary);
      setApiStatus('success');
    } catch (err) {
      setError(err.message);
      setApiStatus('error');
      console.error('API Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareViaEmail = () => {
    if (!emailRecipients) {
      setError('Please enter at least one recipient email');
      return;
    }

    const emails = emailRecipients.split(',').map(email => email.trim());
    const invalidEmails = emails.filter(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (invalidEmails.length > 0) {
      setError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    const mailtoLink = `mailto:${emails.join(',')}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(summary)}`;
    window.open(mailtoLink, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary)
      .then(() => {
        const originalError = error;
        setError('Summary copied to clipboard!');
        setTimeout(() => setError(originalError), 2000);
      })
      .catch(err => console.error(`Error summarizing text from clipboard ${err}`));
  };

  const resetForm = () => {
    setTranscript('');
    setSummary('');
    setCustomPrompt('Summarize key points and action items');
    setEmailRecipients('');
    setError('');
    setApiStatus(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Meeting Transcript Summarizer</h1>
        <p className="app-subtitle">AI-powered meeting notes analysis</p>
      </header>

      <main className="app-main">
        {/* Transcript Input Section */}
        <section className="input-section">
          <div className="file-upload-container">
            <label htmlFor="transcript-upload" className="upload-label">
              Upload Transcript
              <span className="file-types">(.txt, .docx)</span>
            </label>
            <input
              id="transcript-upload"
              type="file"
              accept=".txt,.docx"
              onChange={handleFileUpload}
              className="file-input"
              ref={fileInputRef}
            />
            <p className="or-divider">- or -</p>
            <textarea
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                setError('');
              }}
              className="transcript-textarea"
              placeholder="Paste your meeting transcript here..."
              rows={8}
            />
          </div>

          {/* Custom Prompt Section */}
          <div className="prompt-container">
            <label htmlFor="custom-prompt" className="prompt-label">
              Custom Instructions
            </label>
            <textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="prompt-textarea"
              placeholder="E.g., 'Summarize in bullet points for executives'"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              onClick={generateSummary}
              disabled={isLoading || !transcript.trim()}
              className={`generate-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Generating...
                </>
              ) : (
                'Generate Summary'
              )}
            </button>
            <button
              onClick={resetForm}
              className="reset-button"
              disabled={isLoading}
            >
              Reset
            </button>
          </div>

          {/* Status Indicators */}
          {apiStatus === 'processing' && (
            <div className="status-message processing">
              Processing your transcript...
            </div>
          )}
          {apiStatus === 'success' && (
            <div className="status-message success">
              Summary generated successfully!
            </div>
          )}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </section>

        {/* Results Section */}
        {summary && (
          <section className="results-section">
            <div className="summary-container">
              <div className="summary-header">
                <h2>Meeting Summary</h2>
                <div className="summary-actions">
                  <button
                    onClick={copyToClipboard}
                    className="copy-button"
                    title="Copy to clipboard"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="summary-textarea"
                rows={12}
              />
            </div>

            {/* Email Sharing Section */}
            <div className="email-share-container">
              <h3>Share Summary</h3>
              <div className="email-input-group">
                <label htmlFor="email-recipients">Recipients (comma separated):</label>
                <input
                  id="email-recipients"
                  type="text"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  className="email-input"
                  placeholder="john@example.com, jane@example.com"
                />
              </div>
              <div className="email-input-group">
                <label htmlFor="email-subject">Subject:</label>
                <input
                  id="email-subject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="email-input"
                />
              </div>
              <button
                onClick={handleShareViaEmail}
                className="email-button"
                disabled={!summary}
              >
                ✉️ Open in Email
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by Groq AI • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;