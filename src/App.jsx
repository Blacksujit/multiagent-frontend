import React, { useState, useEffect } from 'react';
import AudioRecorder from './components/AudioRecorder/AudioRecorder';
import ImageUpload from './components/ImageUpload/ImageUpload';
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

  useEffect(() => {
    // Generate a new session ID when component mounts
    setSessionId(Math.random().toString(36).substring(7));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      formData.append('sessionId', sessionId);

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
        description: data.message || 'Analysis completed successfully.',
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
    setSessionId(Math.random().toString(36).substring(7));
    setResponse(null);
    setError(null);
    // Reset shouldResetAudio after a brief delay
    setTimeout(() => setShouldResetAudio(false), 100);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Visual Troubleshooting Copilot</h1>
      </header>

      <main className="app-content">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="input-section">
            <div className="input-container">
              <h2>Upload Screenshot or Image</h2>
              <div className="image-upload">
                <label htmlFor="image-upload" className="upload-label">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="image-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <span>Click to upload image</span>
                      <span>(JPEG, PNG up to 5MB)</span>
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
            </div>

            <div className="input-container">
              <h2>Record Your Problem</h2>
              <AudioRecorder 
                onAudioCapture={handleAudioCapture}
                shouldReset={shouldResetAudio}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || (!image && !audio)}
            >
              Submit
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
              disabled={isLoading}
            >
              Reset
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
              <p>{error}</p>
            </div>
          )}

          {response && !isLoading && !error && (
            <div className="response-content">
              <h3>Analysis Results</h3>
              <div className="response-grid">
                <div className="response-item">
                  <h4>Problem Type</h4>
                  <p>{response.problemType || 'General Issue'}</p>
                </div>
                <div className="response-item">
                  <h4>Priority Level</h4>
                  <div className={`priority-badge ${response.priority?.toLowerCase() || 'medium'}`}>
                    {response.priority || 'Medium'}
                  </div>
                </div>
                {response.sessionId && (
                  <div className="response-item">
                    <h4>Reference ID</h4>
                    <p className="session-id">{response.sessionId}</p>
                  </div>
                )}
                <div className="response-item full-width">
                  <h4>Description</h4>
                  <p className="description">{response.description || 'Analysis in progress...'}</p>
                </div>
                {response.suggestions && (
                  <div className="response-item full-width">
                    <h4>Suggested Solutions</h4>
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
                    <h4>Next Steps</h4>
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

 