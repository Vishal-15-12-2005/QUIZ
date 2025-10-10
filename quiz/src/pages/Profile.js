import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css'; // Import the new CSS file

function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const username = localStorage.getItem('loggedInUsername');
      if (!username) {
        setMessage('Please log in to view your profile.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/profile/${username}`);
        const data = await response.json();

        if (response.ok) {
          setProfileData(data);
        } else {
          setMessage(data.message || 'Failed to fetch profile data.');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setMessage('Network error. Could not load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <div>Loading Profile...</div>;
  }

  if (message) {
    return <div className="message error">{message}</div>;
  }

  if (!profileData) {
    return <div className="profile-container">No profile data available.</div>;
  }

  // Calculate Quizzes Taken and Average Score
  const quizzesTaken = profileData.quiz_history ? profileData.quiz_history.length : 0;
  const totalScore = profileData.quiz_history ? profileData.quiz_history.reduce((sum, result) => sum + result.percentage_score, 0) : 0;
  const averageScore = quizzesTaken > 0 ? (totalScore / quizzesTaken).toFixed(2) : 0;

  return (
    <div className="profile-container"> {/* Apply profile-container here */}
      <h2>User Profile</h2>

      {/* User Header Card */}
      <div className="profile-header-card">
        <div className="user-info">
          <h3>{profileData.username}</h3>
          <p>{profileData.email}</p>
          <p>Member since: {new Date(profileData.created_at).toLocaleDateString()}</p> {/* Assuming created_at exists */}
        </div>
        <div className="stats-overview">
          <div className="stat-item">
            <div className="value">{quizzesTaken}</div>
            <div className="label">Quizzes Taken</div>
          </div>
          <div className="stat-item">
            <div className="value">{averageScore}%</div>
            <div className="label">Avg. Score</div>
          </div>
          {/* Overall Rank would require backend calculation */}
          {/* <div className="stat-item">
            <div className="value">#5</div>
            <div className="label">Overall Rank</div>
          </div> */}
        </div>
      </div>

      <h3>Quiz History:</h3>
      {profileData.quiz_history && profileData.quiz_history.length > 0 ? (
        <ul className="quiz-history-list">
          {profileData.quiz_history.map((quizResult) => (
            <li key={quizResult._id} className="history-item">
              <span className="quiz-title">{quizResult.quiz_title || 'N/A'}</span>
              <span className={`score-badge ${quizResult.percentage_score >= 80 ? 'high-score' : ''}`}> {/* Conditional class */}
                {quizResult.percentage_score.toFixed(0)}%
              </span>
              <p className="quiz-date">Submitted: {new Date(quizResult.submission_time).toLocaleString()}</p>
              <p>Score: {quizResult.score} / {quizResult.total_questions}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No quiz history found. Take some quizzes!</p>
      )}

      <p style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/dashboard" className="admin-button">Back to Dashboard</Link>
      </p>
    </div>
  );
}

export default Profile;
