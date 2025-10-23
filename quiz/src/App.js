import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';

// Import components from the new pages directory
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './Signup'; // Signup is already a separate component
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CreateQuiz from './pages/CreateQuiz'; // Import CreateQuiz
import AIGenerateQuiz from './pages/AIGenerateQuiz'; // Import AIGenerateQuiz
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="App">
      <BrowserRouter basename="/QUIZ">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quiz/category/:categoryName" element={<Quiz />} /> {/* Corrected route */}
          <Route path="/results/:id" element={<Results />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/generate-quiz-ai" element={<AIGenerateQuiz />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;