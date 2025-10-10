import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]); // To fetch categories from backend
  const [questions, setQuestions] = useState([
    { question_text: '', options: ['', '', '', ''], correct_answer: '' },
  ]);
  const [message, setMessage] = useState('');

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/categories');
        const data = await response.json();
        if (response.ok) {
          setCategories(data);
          if (data.length > 0) {
            setCategory(data[0].name); // Set default category
          }
        } else {
          setMessage(data.message || 'Failed to fetch categories.');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        setMessage('Network error. Could not load categories.');
      }
    };
    fetchCategories();
  }, []);

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      { question_text: '', options: ['', '', '', ''], correct_answer: '' },
    ]);
  };

  const handleRemoveQuestion = (index) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Basic validation
    if (!title || !description || !category) {
      setMessage('Please fill in all quiz details.');
      return;
    }

    for (const q of questions) {
      if (!q.question_text || q.options.some(opt => !opt) || !q.correct_answer) {
        setMessage('Please fill in all question details and options, and select a correct answer.');
        return;
      }
      if (!q.options.includes(q.correct_answer)) {
        setMessage('Correct answer must be one of the provided options for each question.');
        return;
      }
    }

    // Assuming created_by comes from authenticated user (for now, hardcode or get from localStorage)
    const created_by = localStorage.getItem('loggedInUsername') || 'anonymous'; 

    try {
      const response = await fetch('http://localhost:5000/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          created_by,
          questions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + ' Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage(data.message || 'An error occurred while creating the quiz.');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      setMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="create-quiz-page-container"> {/* Overall page container */}
      <div className="create-quiz-header"> {/* Header for title positioning */}
        <h2>Create New Quiz</h2>
      </div>

      <div className="create-quiz-content form-container"> {/* Main content area */}
        {message && <p className={message.includes('success') ? 'message success' : 'message error'}>{message}</p>}

        <form onSubmit={handleSubmit}>
          <div className="quiz-details-section"> {/* Section for quiz details */}
            <h3>Quiz Details</h3>
            <div>
              <label htmlFor="quizTitle">Quiz Title:</label>
              <input
                type="text"
                id="quizTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="quizDescription">Description:</label>
              <textarea
                id="quizDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="quizCategory">Category:</label>
              <select
                id="quizCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="questions-section"> {/* Section for questions */}
            <h3>Questions:</h3>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="question-card"> {/* Card for each question */}
                <div className="question-header">
                  <h4>Question {qIndex + 1}</h4>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => handleRemoveQuestion(qIndex)} className="remove-question-button">
                      Remove
                    </button>
                  )}
                </div>
                
                <div className="question-content-layout"> {/* Layout for question text and options */}
                  <div className="question-text-input">
                    <label htmlFor={`questionText${qIndex}`}>Question Text:</label>
                    <textarea
                      id={`questionText${qIndex}`}
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                      required
                    ></textarea>
                  </div>
                  
                  <div className="options-input-group"> {/* Group for options and correct answer */}
                    <p>Options:</p>
                    {q.options.map((option, oIndex) => (
                      <div key={oIndex} className="option-input">
                        <label htmlFor={`option${qIndex}-${oIndex}`}>Option {oIndex + 1}:</label>
                        <input
                          type="text"
                          id={`option${qIndex}-${oIndex}`}
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                          required
                        />
                      </div>
                    ))}
                    <div>
                      <label htmlFor={`correctAnswer${qIndex}`}>Correct Answer:</label>
                      <select
                        id={`correctAnswer${qIndex}`}
                        value={q.correct_answer}
                        onChange={(e) => handleQuestionChange(qIndex, 'correct_answer', e.target.value)}
                        required
                      >
                        <option value="">Select Correct Option</option>
                        {q.options.map((option, oIndex) => (
                          option && <option key={oIndex} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={handleAddQuestion} className="add-question-button">Add New Question</button>
          </div>

          <button type="submit" className="create-quiz-submit-button">Create Quiz</button>
        </form>
      </div>
    </div>
  );
}

export default CreateQuiz;