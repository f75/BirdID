import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { analyzeBirdImage } from '../services/speciesnet';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setSelectedImage(URL.createObjectURL(file));
      setResult(null); // Reset previous result
    }
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    
    setIsAnalyzing(true);
    try {
      const analysisResult = await analyzeBirdImage(imageFile);
      setResult(analysisResult);
    } catch (error) {
      console.error("Error analyzing image", error);
      alert(`Failed to analyze image: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">Bird<span className="accent">ID</span></div>
        <nav>
          <Link to="/login" className="btn-secondary">Login</Link>
          <Link to="/signup" className="btn-primary">Sign Up</Link>
        </nav>
      </header>
      
      <main className="dashboard-main">
        <section className="hero-section">
          <h1>Discover the Birds Around You</h1>
          <p>Upload a photo and our AI will identify the species instantly.</p>
        </section>

        <section className="upload-section">
          <div className="upload-card">
            {!selectedImage ? (
              <div className="upload-placeholder">
                <i className="upload-icon">📸</i>
                <h3>Select an image to analyze</h3>
                <p>Drag and drop or click to browse</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageChange} 
                  id="file-upload" 
                />
                <label htmlFor="file-upload" className="btn-upload">Browse Files</label>
              </div>
            ) : (
              <div className="image-preview-container">
                <img src={selectedImage} alt="Selected bird" className="image-preview" />
                <div className="action-buttons">
                  <button className="btn-secondary" onClick={() => setSelectedImage(null)}>Choose Another</button>
                  <button className="btn-primary" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? 'Analyzing...' : 'Identify Bird'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="result-card fade-in">
              <h2>Analysis Complete</h2>
              <div className="result-details">
                <div className="result-item">
                  <span className="label">Species</span>
                  <span className="value species-name">{result.species}</span>
                </div>
                <div className="result-item">
                  <span className="label">Confidence</span>
                  <span className="value confidence-score">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{width: `${result.confidence}%`}}></div>
                    </div>
                    {result.confidence}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
