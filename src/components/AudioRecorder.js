import React, { useRef, useState } from 'react';
import './AudioRecorder.css';

function AudioRecorder({ onAudioRecorded }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Reset function to clear audio state
  const resetAudio = React.useCallback(() => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setRecording(false);
    setAudioUrl(null);
    audioChunksRef.current = [];
    onAudioRecorded(null);
  }, [recording, onAudioRecorded]);

  const startRecording = async () => {
    try {
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

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Error accessing microphone. Please ensure you have granted permission.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  };

  // Watch for changes in audioUrl or recording state
  React.useEffect(() => {
    if (!audioUrl && !recording) {
      resetAudio();
    }
  }, [audioUrl, recording, resetAudio]);

  return (
    <div className="audio-recorder">
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
    </div>
  );
}

export default AudioRecorder;
