import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-container"> {/* Added class name here */}
      <h1>Unleash Your Knowledge!</h1>
      <p>Create captivating quizzes, challenge your friends, and climb the global leaderboard. Dive into a world of endless learning and fun!</p>
      <p>Whether you're a trivia master or just looking to learn something new, our platform offers a dynamic and engaging experience.</p>
      <nav>
        <Link to="/login">Login to Your Account</Link>
        <Link to="/signup">Join the Quiz Community</Link>
      </nav>
    </div>
  );
}

export default Home;
