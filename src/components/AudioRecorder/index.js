import React, { useRef, useState, useEffect } from 'react';
import './AudioRecorder.css';

const AudioRecorder = ({ onAudioRecorded, shouldReset }) => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const resetAudio = React.useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    mediaRecorderRef.current = null;
    setRecording(false);
    setAudioUrl(null);
    setError(null);
    audioChunksRef.current = [];
    onAudioRecorded(null);
  }, [audioUrl, onAudioRecorded]);

  useEffect(() => {
    if (shouldReset) {
      resetAudio();
    }
  }, [shouldReset, resetAudio]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onAudioRecorded(audioBlob);
      };

      mediaRecorderRef.current.onerror = (event) => {
        setError('Error recording audio: ' + event.error);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Error accessing microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [audioUrl]);

  const retryRecording = () => {
    resetAudio();
    startRecording();
  };

  return (
    <div className="audio-recorder">
      {error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button 
            className="retry-button"
            onClick={retryRecording}
          >
            Retry Recording
          </button>
        </div>
      ) : (
        <>
          <button 
            className={`record-button ${recording ? 'recording' : ''}`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? 'Stop Recording' : 'Start Recording'}
          </button>
          {audioUrl && (
            <div className="audio-player">
              <audio src={audioUrl} controls className="audio-control" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AudioRecorder;
