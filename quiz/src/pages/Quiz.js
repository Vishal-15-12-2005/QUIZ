import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Ensure Link is imported here

function Quiz() {
  const { categoryName } = useParams(); // Get category name from URL
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [userAnswers, setUserAnswers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState(null); // New state for selected quiz
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes = 300 seconds
  const [quizStarted, setQuizStarted] = useState(false); // To control timer start
  const [searchTerm, setSearchTerm] = useState(''); // New state for search term

  console.log('Category Name from URL:', categoryName); // Debugging

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/quizzes?category=${categoryName}`);
        const data = await response.json();

        console.log('Backend Response OK:', response.ok); // Debugging
        console.log('Backend Data:', data); // Debugging

        if (response.ok) {
          if (data.length > 0) {
            setQuizzes(data);
            // If only one quiz, select it automatically
            if (data.length === 1) {
              setCurrentQuiz(data[0]);
              setSelectedQuizId(data[0]._id);
              setUserAnswers(new Array(data[0].questions.length).fill(null));
              setQuizStarted(true); // Start timer if quiz auto-selected
            }
            console.log('Quizzes set:', data); // Debugging
          } else {
            setMessage(`No quizzes found for category: ${categoryName}`);
            console.log('No quizzes found for category.'); // Debugging
          }
        } else {
          setMessage(data.message || 'Failed to fetch quizzes.');
          console.error('Failed to fetch quizzes from backend.', data.message); // Debugging
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setMessage('Network error. Could not load quizzes.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [categoryName]); // Re-run when categoryName changes

  // Timer useEffect
  useEffect(() => {
    let timer;
    if (quizStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizStarted) {
      handleSubmitQuiz(); // Auto-submit when time runs out
    }

    return () => clearInterval(timer); // Cleanup on unmount or when dependencies change
  }, [timeLeft, quizStarted]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const handleOptionSelect = (option, index) => {
    setSelectedOption(option);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = index; // Store the index of the option
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(userAnswers[currentQuestionIndex + 1]); // Pre-select if already answered
    } else {
      // Last question, submit quiz
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    // For now, just log the answers and navigate to results (placeholder)
    console.log('User Answers:', userAnswers);
    // In a real app, you'd send these answers to a backend endpoint for scoring
    // navigate('/results/placeholder_quiz_id'); // Navigate to results page

    const username = localStorage.getItem('loggedInUsername');
    if (!username) {
      setMessage('Please log in to submit your quiz.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/submit_quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quiz_id: currentQuiz._id,
          username: username,
          user_answers: userAnswers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + ' Redirecting to results...');
        navigate(`/results/${data.result_id}`); // Navigate to results page with result_id
      } else {
        setMessage(data.message || 'An error occurred during quiz submission.');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setMessage('Network error. Please try again later.');
    }
  };

  const handleQuizSelect = (quiz) => {
    setCurrentQuiz(quiz);
    setSelectedQuizId(quiz._id);
    setCurrentQuestionIndex(0);
    setSelectedOption('');
    setUserAnswers(new Array(quiz.questions.length).fill(null));
    setTimeLeft(300); // Reset timer for new quiz (5 minutes)
    setQuizStarted(true); // Start timer
  };

  // Filter quizzes based on search term
  const filteredQuizzes = quizzes.filter((quiz) =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading quiz...</div>;
  }

  if (message) {
    return <div className="message error">{message}</div>;
  }

  if (!currentQuiz && quizzes.length === 0) {
    return <div className="quiz-container">No quiz available for this category.</div>;
  }

  // Display list of quizzes if none selected and multiple available
  if (!selectedQuizId && quizzes.length > 0) {
    return (
      <div className="quiz-container"> {/* Apply quiz-container here */}
        <h2>Quizzes in {categoryName}</h2>
        <div className="search-bar-container"> {/* New container for search bar */}
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredQuizzes.length > 0 ? (
          <ul className="quiz-list"> {/* Added class for specific styling */}
            {filteredQuizzes.map((quiz) => (
              <li key={quiz._id}>
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <button onClick={() => handleQuizSelect(quiz)}>Start Quiz</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No quizzes found matching your search.</p>
        )}
        <p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </p>
      </div>
    );
  }

  // Display quiz questions once a quiz is selected
  const currentQuestion = currentQuiz.questions[currentQuestionIndex];

  return (
    <div className="quiz-container"> {/* Apply quiz-container here */}
      <h2>{currentQuiz.title} - Quiz</h2>
      <p className="timer">Time Left: {formatTime(timeLeft)}</p> {/* Display timer */}
      <h3>Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</h3>
      <p>{currentQuestion.question_text}</p>

      <div className="quiz-options"> {/* Added class for options */}
        {currentQuestion.options.map((option, index) => (
          <div key={index}>
            <label>
              <input
                type="radio"
                name="quizOption"
                value={option}
                checked={selectedOption === option}
                onChange={() => handleOptionSelect(option, index)}
              />
              {option}
            </label>
          </div>
        ))}
      </div>

      <div className="quiz-navigation-buttons"> {/* Added class for navigation buttons */}
        {currentQuestionIndex < currentQuiz.questions.length - 1 ? (
          <button onClick={handleNextQuestion} disabled={selectedOption === null}>Next Question</button>
        ) : (
          <button onClick={handleSubmitQuiz} disabled={selectedOption === null}>Submit Quiz</button>
        )}
      </div>

      
    </div>
  );
}

export default Quiz;