import React, { useState, useRef, useEffect } from 'react';
import './AudioRecorder.css';

const AudioRecorder = ({ onAudioCapture, shouldReset, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle reset from parent component
  useEffect(() => {
    if (shouldReset) {
      setAudioBlob(null);
      setError(null);
      setIsRecording(false);
      audioChunksRef.current = [];
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  }, [shouldReset]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        onAudioCapture(audioBlob);
        
        // Clean up the stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setError(null);
    audioChunksRef.current = [];
    onAudioCapture(null); // Notify parent that audio is cleared
  };

  const handleClearAudio = () => {
    setAudioBlob(null);
    onAudioCapture(null); // Notify parent that audio is cleared
  };

  return (
    <div className="audio-recorder">
      {error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleRetry} disabled={disabled}>
            🔄 Retry
          </button>
        </div>
      ) : (
        <>
          <button
            className={`record-button ${isRecording ? 'recording' : ''}`}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
          >
            {isRecording ? '⏹️ Stop Recording' : '🎤 Start Recording'}
          </button>
          
          {audioBlob && (
            <div className="audio-player">
              <audio
                className="audio-control"
                controls
                src={URL.createObjectURL(audioBlob)}
              />
              <button 
                className="clear-audio-button" 
                onClick={handleClearAudio}
                disabled={disabled}
              >
                🗑️ Clear Audio
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioRecorder;
