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
  const [showTimeout, setShowTimeout] = useState(false);

  // Generate a new session ID
  const generateSessionId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  useEffect(() => {
    // Generate a new session ID when component mounts
    setSessionId(generateSessionId());
  }, []);

  // Handle timeout notification
  useEffect(() => {
    let timeoutId;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setShowTimeout(true);
      }, 5000); // Show timeout message after 5 seconds
    } else {
      setShowTimeout(false);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Clear validation errors when both inputs are available
  useEffect(() => {
    if (image && audio && error === 'Please provide both image and audio before submitting.') {
      setError(null);
    }
  }, [image, audio, error]);

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
      setResponse(null); // Clear any previous response
      setShowTimeout(false); // Reset timeout

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
        problemType: data.content_type || 'Technical Issue',
        priority: data.urgency_level || 'Medium',
        description: data.message || 'Analysis completed successfully.',
        suggestions: data.recommendations?.map(rec => rec.content) || [
          'Check your system requirements',
          'Verify all connections',
          'Ensure proper configuration'
        ],
        nextSteps: 'Our team will analyze your issue and get back to you shortly.',
        // New AI analysis fields
        ocrText: data.ocr_text || '',
        transcription: data.transcription || '',
        sentiment: data.sentiment || '',
        recommendations: data.recommendations || [],
        processingTime: data.processing_time || 0
      };
      setResponse(transformedResponse);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setShowTimeout(false);
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
    setShowTimeout(false);
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

          {/* Validation message - only show when one input is missing */}
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

        {/* Loading and Processing Section */}
        {isLoading && (
          <div className="processing-section">
            <div className="loading-container">
              <LoadingSpinner text="Processing your request..." />
              <div className="session-info">
                <p>Session ID: <span className="session-id-display">{sessionId}</span></p>
              </div>
            </div>
            
            {/* Timeout notification */}
            {showTimeout && (
              <div className="timeout-notification">
                <p>⏰ Processing is taking longer than expected. This is normal for complex analysis.</p>
                <p>Please wait while our AI system analyzes your issue...</p>
              </div>
            )}
          </div>
        )}

        {/* Error Section */}
        {error && !isLoading && (
          <div className="error-section">
            <div className="error-message">
              <p>❌ {error}</p>
            </div>
          </div>
        )}

        {/* Response Section - Only show after processing is complete */}
        {response && !isLoading && !error && (
          <div className="response-section">
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
                <div className="response-item">
                  <h4>⏱️ Processing Time</h4>
                  <p>{response.processingTime ? `${response.processingTime.toFixed(2)}s` : 'N/A'}</p>
                </div>
                <div className="response-item full-width">
                  <h4>📝 Description</h4>
                  <p className="description">{response.description || 'Analysis in progress...'}</p>
                </div>
                
                {/* AI Analysis Results */}
                {response.ocrText && (
                  <div className="response-item full-width">
                    <h4>🔍 Extracted Text (OCR)</h4>
                    <div className="ocr-text">
                      <p>{response.ocrText}</p>
                    </div>
                  </div>
                )}
                
                {response.transcription && (
                  <div className="response-item full-width">
                    <h4>🎤 Voice Transcription</h4>
                    <div className="transcription">
                      <p>{response.transcription}</p>
                      {response.sentiment && (
                        <span className="sentiment-badge">
                          Sentiment: {response.sentiment}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Detailed Recommendations */}
                {response.recommendations && response.recommendations.length > 0 && (
                  <div className="response-item full-width">
                    <h4>💡 AI Recommendations</h4>
                    <div className="recommendations-list">
                      {response.recommendations.map((rec, index) => (
                        <div key={index} className={`recommendation-item ${rec.priority}`}>
                          <h5>{rec.title}</h5>
                          <p>{rec.content}</p>
                          <div className="recommendation-meta">
                            <span className="type-badge">{rec.type}</span>
                            <span className={`priority-badge ${rec.priority}`}>
                              {rec.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
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
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

 