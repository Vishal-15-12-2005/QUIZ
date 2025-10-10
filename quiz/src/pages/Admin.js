import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './admin.css';

// --- Child Component for Category Management ---
function CategoryManagement({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDescription, setEditCategoryDescription] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    onAddCategory(newCategoryName, newCategoryDescription);
    setNewCategoryName('');
    setNewCategoryDescription('');
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    onUpdateCategory(editCategoryName, editCategoryDescription);
    setEditCategoryName('');
    setEditCategoryDescription('');
  };

  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Category Management</h3>
      
      <h4>Add New Category</h4>
      <form onSubmit={handleAddSubmit}>
        <div className="admin-form-group">
          <label htmlFor="newCategoryName">Name:</label>
          <input
            type="text"
            id="newCategoryName"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-group">
          <label htmlFor="newCategoryDescription">Description:</label>
          <textarea
            id="newCategoryDescription"
            value={newCategoryDescription}
            onChange={(e) => setNewCategoryDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="admin-button-group">
          <button type="submit" className="admin-button">Add Category</button>
        </div>
      </form>

      <h4>Update Category</h4>
      <form onSubmit={handleUpdateSubmit}>
        <div className="admin-form-group">
          <label htmlFor="editCategoryName">Category Name to Update:</label>
          <input
            type="text"
            id="editCategoryName"
            value={editCategoryName}
            onChange={(e) => setEditCategoryName(e.target.value)}
            placeholder="Click 'Edit' on a category below"
            required
          />
        </div>
        <div className="admin-form-group">
          <label htmlFor="editCategoryDescription">New Description:</label>
          <textarea
            id="editCategoryDescription"
            value={editCategoryDescription}
            onChange={(e) => setEditCategoryDescription(e.target.value)}
            required
          ></textarea>
        </div>
        <div className="admin-button-group">
          <button type="submit" className="admin-button">Update Category</button>
        </div>
      </form>

      <h4>Existing Categories</h4>
      {categories.length > 0 ? (
        <ul className="admin-list">
          {categories.map((category) => (
            <li key={category.name} className="admin-list-item">
              <div>
                <strong>{category.name}</strong>: {category.description}
              </div>
              <div className="admin-button-group">
                <button 
                  onClick={() => {
                    setEditCategoryName(category.name);
                    setEditCategoryDescription(category.description);
                  }} 
                  className="admin-button"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDeleteCategory(category.name)} 
                  className="admin-button delete"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No categories found.</p>
      )}
    </div>
  );
}

// --- Child Component for Quiz Management ---
function QuizManagement({ quizzes, onDeleteQuiz }) {
  return (
    <div className="admin-card">
      <h3 className="admin-card-title">Quiz Management</h3>
      <h4>All Quizzes</h4>
      {quizzes.length > 0 ? (
        <ul className="admin-list">
          {quizzes.map((quiz) => (
            <li key={quiz._id} className="admin-list-item">
              <div>
                <strong>{quiz.title}</strong> (Category: {quiz.category}, By: {quiz.created_by})
                <br />
                <small>Description: {quiz.description}</small>
                <br/>
                <small>Questions: {quiz.questions.length}</small>
              </div>
              <div className="admin-button-group">
                <button onClick={() => onDeleteQuiz(quiz._id, quiz.title)} className="admin-button delete">
                  Delete Quiz
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No quizzes found.</p>
      )}
    </div>
  );
}

// --- Child Component for User Management ---
function UserManagement({ users, onUpdateUserRole, onDeleteUser }) {
  return (
    <div className="admin-card">
      <h3 className="admin-card-title">User Management</h3>
      <h4>All Users</h4>
      {users.length > 0 ? (
        <ul className="admin-list">
          {users.map((user) => (
            <li key={user.username} className="admin-list-item">
              <div>
                <strong>{user.username}</strong> ({user.email})
              </div>
              <div className="admin-button-group"> {/* Use admin-button-group for spacing */}
                <select
                  value={user.role}
                  onChange={(e) => onUpdateUserRole(user.username, e.target.value)}
                  className="admin-form-group" /* Apply form group styling for select */
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <button onClick={() => onDeleteUser(user.username)} className="admin-button delete">
                  Delete User
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No users found.</p>
      )}
    </div>
  );
}


// --- Main Admin Component ---
function Admin() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const adminUsername = localStorage.getItem('loggedInUsername');

  const [categories, setCategories] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State to control which management view is active
  const [activeView, setActiveView] = useState('users'); // Default to 'users'

  useEffect(() => {
    if (userRole !== 'admin') {
      navigate('/dashboard');
    }
  }, [userRole, navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoriesRes, quizzesRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/categories'),
        fetch('http://localhost:5000/admin/quizzes', { headers: { 'X-User-Username': adminUsername } }),
        fetch('http://localhost:5000/admin/users', { headers: { 'X-User-Username': adminUsername } })
      ]);

      if (!categoriesRes.ok || !quizzesRes.ok || !usersRes.ok) {
        throw new Error('Failed to fetch some resources.');
      }

      const categoriesData = await categoriesRes.json();
      const quizzesData = await quizzesRes.json();
      const usersData = await usersRes.json();
      
      setCategories(categoriesData);
      setQuizzes(quizzesData);
      setUsers(usersData);

    } catch (err) {
      setError(err.message);
      setMessage('Network error. Could not load admin data.');
    } finally {
      setLoading(false);
    }
  }, [adminUsername]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- API Handlers (wrapped in useCallback for performance) ---
  const handleApiCall = useCallback(async (url, options, successMessage) => {
    setMessage('');
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'An error occurred.');
      setMessage(successMessage || data.message);
      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  }, []);

  const handleAddCategory = useCallback(async (name, description) => {
    if (await handleApiCall('http://localhost:5000/admin/category', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-User-Username': adminUsername }, body: JSON.stringify({ name, description }) }, 'Category added!')) fetchData();
  }, [adminUsername, fetchData, handleApiCall]);

  const handleUpdateCategory = useCallback(async (name, description) => {
    if (await handleApiCall(`http://localhost:5000/admin/category/${name}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Username': adminUsername }, body: JSON.stringify({ description }) }, 'Category updated!')) fetchData();
  }, [adminUsername, fetchData, handleApiCall]);
  
  const handleDeleteCategory = useCallback(async (categoryName) => {
    if (window.confirm(`Delete category: ${categoryName}?`) && await handleApiCall(`http://localhost:5000/admin/category/${categoryName}`, { method: 'DELETE', headers: { 'X-User-Username': adminUsername } }, 'Category deleted!')) fetchData();
  }, [adminUsername, fetchData, handleApiCall]);

  const handleDeleteQuiz = useCallback(async (quizId, quizTitle) => {
    if (window.confirm(`Delete quiz: ${quizTitle}?`) && await handleApiCall(`http://localhost:5000/admin/quiz/${quizId}`, { method: 'DELETE', headers: { 'X-User-Username': adminUsername } }, 'Quiz deleted!')) fetchData();
  }, [adminUsername, fetchData, handleApiCall]);

  const handleUpdateUserRole = useCallback(async (username, newRole) => {
    if (window.confirm(`Change ${username}'s role to ${newRole}?`) && await handleApiCall(`http://localhost:5000/admin/user/${username}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-User-Username': adminUsername }, body: JSON.stringify({ role: newRole }) }, 'User role updated!')) fetchData();
  }, [adminUsername, fetchData, handleApiCall]);

  const handleDeleteUser = useCallback(async (username) => {
    if (window.confirm(`Delete user: ${username}?`) && await handleApiCall(`http://localhost:5000/admin/user/${username}`, { method: 'DELETE', headers: { 'X-User-Username': adminUsername } }, 'User deleted!')) fetchData();
  }, [adminUsername, fetchData, handleApiCall]);


  if (loading) return <div className="loading-container">Loading Admin Panel...</div>;
  if (error) return <div className="error-container">Error: {error}</div>;

  return (
    <div className="admin-container">
      <h2 className="admin-header">Admin Dashboard</h2>
      {message && <p className="message-display">{message}</p>}

      {/* --- NEW: Navigation Bar --- */}
      <nav className="admin-nav">
        <button 
          className={`admin-nav-button ${activeView === 'users' ? 'active' : ''}`}
          onClick={() => setActiveView('users')}
        >
          User Management
        </button>
        <button 
          className={`admin-nav-button ${activeView === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveView('quizzes')}
        >
          Quiz Management
        </button>
        <button 
          className={`admin-nav-button ${activeView === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveView('categories')}
        >
          Category Management
        </button>
      </nav>

      {/* --- Conditionally Rendered Management Sections --- */}
      <div className="admin-content-grid">
        {activeView === 'users' && (
          <UserManagement
            users={users}
            onUpdateUserRole={handleUpdateUserRole}
            onDeleteUser={handleDeleteUser}
          />
        )}
        
        {activeView === 'quizzes' && (
          <QuizManagement
            quizzes={quizzes}
            onDeleteQuiz={handleDeleteQuiz}
          />
        )}

        {activeView === 'categories' && (
          <CategoryManagement
            categories={categories}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </div>
      
      <p style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/dashboard" className="admin-button">Back to Dashboard</Link>
      </p>
    </div>
  );
}

export default Admin;
