import React, { useState } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ onImageCapture }) => {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Please upload a valid image file (JPEG, PNG, or GIF)');
    }

    if (file.size > maxSize) {
      throw new Error('Image size should be less than 5MB');
    }
  };

  const handleImageChange = (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      validateImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onImageCapture(file);
      };
      reader.readAsDataURL(file);
      setError(null);
    } catch (err) {
      setError(err.message);
      setPreview(null);
      event.target.value = ''; // Reset file input
    }
  };

  const handleRetry = () => {
    setPreview(null);
    setError(null);
  };

  return (
    <div className="image-upload">
      {error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="retry-button" onClick={handleRetry}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-label">
              {preview ? 'Change Image' : 'Choose Image'}
            </label>
          </div>

          {preview && (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="image-preview" />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ImageUpload;
