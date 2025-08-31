import React, { useState } from 'react';
import AudioRecorder from './components/AudioRecorder';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [audio, setAudio] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (image) formData.append('image', image);
      if (audio) formData.append('audio', audio);

      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setSessionId(data.session_id);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImagePreview(null);
    setAudio(null);
    setSessionId('');
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Visual Troubleshooting Copilot</h1>
        <p>Upload an image and record your issue description</p>
      </header>

      <main className="main-content">
        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-section">
            <div className="image-upload">
              <label className="upload-label">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <i className="fas fa-cloud-upload-alt"></i>
                    <span>Click to upload image</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file-input"
                />
              </label>
            </div>

            <div className="audio-section">
              <h3>Record Issue Description</h3>
              <AudioRecorder onAudioRecorded={setAudio} />
            </div>
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="submit-button"
              disabled={isLoading || (!image && !audio)}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </button>
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </form>

        {sessionId && (
          <div className="session-info">
            <h3>Session Created!</h3>
            <p>Session ID: {sessionId}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
