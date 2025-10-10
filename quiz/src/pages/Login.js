import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(''); // Clear previous messages

    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + ' Redirecting to dashboard...');
        // Store username in localStorage for logout functionality
        localStorage.setItem('loggedInUsername', username);
        if (data.user && data.user.role) {
          localStorage.setItem('userRole', data.user.role);
        }
        console.log('User data:', data.user);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000); // Redirect after 2 seconds
      } else {
        setMessage(data.message || 'An error occurred during login.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="form-container"> {/* Added class name here */}
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      {message && <p className={message.includes('success') ? 'message success' : 'message error'}>{message}</p>}
      <p>
        Don't have an account? <Link to="/signup">Sign Up here</Link>
      </p>
      <Link to="/">Back to Home</Link>
    </div>
  );
}

export default Login;