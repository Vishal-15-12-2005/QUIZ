import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Leaderboard.css'; // Import the new CSS file

function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [currentUserRank, setCurrentUserRank] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/leaderboard');
        const data = await response.json();

        if (response.ok) {
          setLeaderboardData(data);
          const loggedInUsername = localStorage.getItem('loggedInUsername');
          if (loggedInUsername) {
            const userEntry = data.find(entry => entry.username === loggedInUsername);
            if (userEntry) {
              const rank = data.indexOf(userEntry) + 1;
              setCurrentUserRank({ ...userEntry, rank });
            }
          }
        } else {
          setMessage(data.message || 'Failed to fetch leaderboard data.');
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setMessage('Network error. Could not load leaderboard.');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <div>Loading Leaderboard...</div>;
  }

  if (message) {
    return <div className="message error">{message}</div>;
  }

  return (
    <div className="leaderboard-container"> {/* Apply leaderboard-container here */}
      <h2>Leaderboard</h2>
      <p>See who's at the top of the quiz game!</p>

      {leaderboardData.length > 0 ? (
        <ol className="leaderboard-list"> {/* Added class for specific styling */}
          {leaderboardData.map((entry, index) => (
            <li key={index} className={`leaderboard-item top-${index + 1}`}> {/* Apply rank-specific classes */}
              <span className="rank">#{index + 1}</span>
              <span className="username">{entry.username}</span>
              <span className="score">{entry.highest_score.toFixed(2)}%</span>
            </li>
          ))}
        </ol>
      ) : (
        <p>No scores yet. Be the first to take a quiz!</p>
      )}

      {currentUserRank && (
        <div className="current-user-rank-section">
          <h3>Your Rank</h3>
          <div className="current-user-rank-card">
            <span className="rank">#{currentUserRank.rank}</span>
            <span className="username">{currentUserRank.username}</span>
            <span className="score">{currentUserRank.highest_score.toFixed(2)}%</span>
          </div>
        </div>
      )}

      <p>
        <button onClick={() => navigate('/dashboard')} className="button-link">Back to Dashboard</button>
      </p>
    </div>
  );
}

export default Leaderboard;
