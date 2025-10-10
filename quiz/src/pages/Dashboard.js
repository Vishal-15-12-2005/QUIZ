import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term
  const userRole = localStorage.getItem('userRole'); // Get user role from localStorage

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories');
        const data = await response.json();

        if (response.ok) {
          setCategories(data);
        } else {
          setMessage(data.message || 'Failed to fetch categories.');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setMessage('Network error. Could not load categories.');
      }
    };

    fetchCategories();
  }, []); // Empty dependency array means this effect runs once on mount

  const handleLogout = async () => {
    const username = localStorage.getItem('loggedInUsername');

    try {
      const response = await fetch('http://localhost:5000/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        console.log('Logout successful!');
        localStorage.removeItem('loggedInUsername');
        navigate('/');
      } else {
        const data = await response.json();
        console.error('Logout failed:', data.message);
        alert('Logout failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Network error during logout:', error);
      alert('Network error during logout. Please try again.');
    }
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="dashboard-page-container"> {/* New container for the whole page */}
      <nav className="top-nav"> {/* Top navigation bar */}
        <span className="app-title">Quiz</span>
        <div className="nav-links-group">
          <Link to="/leaderboard">Leaderboard</Link>
          <Link to="/profile">Profile
          </Link><Link to="/create-quiz">Create New Quiz</Link>
          <Link to="/generate-quiz-ai">Generate Quiz with AI</Link>
          {userRole === 'admin' && <Link to="/admin">Admin</Link>}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content-container form-container"> {/* Main content area, reusing form-container styles */}
        <h2>Dashboard</h2>
        <p>Welcome to your dashboard! Select a quiz category:</p>

        {message && <p className="message error">{message}</p>}

        <div className="search-bar-container"> {/* New container for search bar */}
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredCategories.length > 0 ? (
          <div>
            <h3>Quiz Categories:</h3>
            <div className="category-grid"> {/* Use a grid for categories */}
              {filteredCategories.map((category) => (
                <Link to={`/quiz/category/${category.name}`} key={category.name} className="category-card">
                  <h4>{category.name}</h4>
                  <p>{category.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p>No categories found matching your search.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
