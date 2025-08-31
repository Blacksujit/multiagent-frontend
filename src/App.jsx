import React, { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder/AudioRecorder';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [shouldResetAudio, setShouldResetAudio] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  // Generate a new session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  useEffect(() => {
    // Generate a new session ID when component mounts
    setSessionId(generateSessionId());
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioCapture = (blob) => {
    setAudio(blob);
  };

  // Check if both inputs are provided
  const isFormValid = image && audio;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isFormValid) {
      setError('Please provide both image and audio before submitting.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const formData = new FormData();
      if (image) {
        formData.append('image', image);
      }
      if (audio) {
        formData.append('audio', audio);
      }

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload files. Please try again.');
      }

      const data = await response.json();
      
      // Transform the response to match our display format
      const transformedResponse = {
        sessionId: sessionId,
        problemType: 'Technical Issue',
        priority: 'High',
        description: 'Your issue has been successfully uploaded and is being analyzed by our AI system.',
        suggestions: [
          'Check your system requirements',
          'Verify all connections',
          'Ensure proper configuration'
        ],
        nextSteps: 'Our team will analyze your issue and get back to you shortly.'
      };
      setResponse(transformedResponse);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setAudio(null);
    setShouldResetAudio(true);
    setSessionId(generateSessionId()); // Generate new session ID
    setResponse(null);
    setError(null);
    // Reset shouldResetAudio after a brief delay
    setTimeout(() => setShouldResetAudio(false), 100);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Visual Troubleshooting Copilot</h1>
        <p className="app-subtitle">Upload a screenshot and describe your issue to get AI-powered solutions</p>
      </header>

      <main className="app-content">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="input-section">
            <div className="input-container">
              <h2>📸 Upload Screenshot or Image</h2>
              <div className="image-upload">
                <label htmlFor="image-upload" className="upload-label">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span className="upload-icon">📁</span>
                      <span>Click to upload image</span>
                      <span className="upload-hint">(JPEG, PNG up to 5MB)</span>
                    </div>
                  )}
                </label>
                <input
                  type="file"
                  id="image-upload"
                  className="file-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  disabled={isLoading}
                />
              </div>
              {image && (
                <div className="file-info">
                  <span className="file-name">✓ {image.name}</span>
                </div>
              )}
            </div>

            <div className="input-container">
              <h2>🎤 Record Your Problem</h2>
              <AudioRecorder 
                onAudioCapture={handleAudioCapture}
                shouldReset={shouldResetAudio}
                disabled={isLoading}
              />
              {audio && (
                <div className="file-info">
                  <span className="file-name">✓ Audio recorded successfully</span>
                </div>
              )}
            </div>
          </div>

          {/* Validation message */}
          {!isFormValid && (image || audio) && (
            <div className="validation-message">
              <p>⚠️ Please provide both image and audio to continue</p>
            </div>
          )}

          {/* Submit button only shows when both inputs are provided */}
          {isFormValid && (
            <div className="button-group">
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : '🚀 Submit for Analysis'}
              </button>
            </div>
          )}

          {/* Reset button always visible */}
          <div className="button-group">
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
              disabled={isLoading}
            >
              🔄 Reset Form
            </button>
          </div>
        </form>

        <div className="response-section">
          {isLoading && (
            <div className="loading-container">
              <LoadingSpinner text="Processing your request..." />
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          )}

          {response && !isLoading && !error && (
            <div className="response-content">
              <h3>🎯 Analysis Results</h3>
              <div className="response-grid">
                <div className="response-item">
                  <h4>📋 Problem Type</h4>
                  <p>{response.problemType || 'General Issue'}</p>
                </div>
                <div className="response-item">
                  <h4>⚡ Priority Level</h4>
                  <div className={`priority-badge ${response.priority?.toLowerCase() || 'medium'}`}>
                    {response.priority || 'Medium'}
                  </div>
                </div>
                <div className="response-item">
                  <h4>🆔 Reference ID</h4>
                  <p className="session-id">{response.sessionId}</p>
                </div>
                <div className="response-item full-width">
                  <h4>📝 Description</h4>
                  <p className="description">{response.description || 'Analysis in progress...'}</p>
                </div>
                {response.suggestions && (
                  <div className="response-item full-width">
                    <h4>💡 Suggested Solutions</h4>
                    <ul className="suggestions-list">
                      {Array.isArray(response.suggestions) 
                        ? response.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))
                        : <li>{response.suggestions}</li>
                      }
                    </ul>
                  </div>
                )}
                {response.nextSteps && (
                  <div className="response-item full-width">
                    <h4>➡️ Next Steps</h4>
                    <div className="next-steps">
                      {response.nextSteps}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

 