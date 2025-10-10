import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AIGenerate.css';



function AIGenerateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState(''); // New state for content for AI
  const [numQuestions, setNumQuestions] = useState(5); // Default number of questions
  const [categories, setCategories] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loggedInUsername = localStorage.getItem('loggedInUsername');

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

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    setGeneratedQuestions([]); // Clear previous questions

    if (!content || !title || !description || !category) {
      setMessage('Please fill in all quiz details and provide content for AI generation.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/generate_quiz_ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Username': loggedInUsername, // Send username for admin check
        },
        body: JSON.stringify({
          content,
          num_questions: parseInt(numQuestions),
          // quiz_type and difficulty can be added here if needed in the future
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Map AI generated questions to the format expected by the backend
        const formattedQuestions = data.quiz_data.map(q => ({
          question_text: q.question,
          options: q.options,
          correct_answer: q.correct_answer // Assuming AI provides A, B, C, D
        }));
        setGeneratedQuestions(formattedQuestions);
        setMessage(data.message);
      } else {
        setMessage(data.message || 'Failed to generate quiz.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setMessage('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuiz = async () => {
    setMessage('');
    if (!title || !description || !category || generatedQuestions.length === 0) {
      setMessage('Please generate questions first and fill in all quiz details.');
      return;
    }

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
          created_by: loggedInUsername,
          questions: generatedQuestions,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message + ' Redirecting to dashboard...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setMessage(data.message || 'Failed to save quiz.');
      }
    } catch (error) {
      console.error('Error saving quiz:', error);
      setMessage('Network error. Please try again.');
    }
  };

  // Function to update a question (e.g., correct answer, options)
  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...generatedQuestions];
    if (field === 'options') {
      // Assuming value is an array of options
      updatedQuestions[index][field] = value;
    } else {
      updatedQuestions[index][field] = value;
    }
    setGeneratedQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[qIndex].options[optIndex] = value;
    setGeneratedQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, value) => {
    const updatedQuestions = [...generatedQuestions];
    updatedQuestions[qIndex].correct_answer = value;
    setGeneratedQuestions(updatedQuestions);
  };

  return (
    <div className="create-quiz-page-container">
      <div className="create-quiz-header">
        <h2>Generate Quiz with AI</h2>
      </div>
      <div className="create-quiz-content">
        {message && <p className={message.includes('success') ? 'message success' : 'message error'}>{message}</p>}

        <div className="quiz-details-section">
          <h3>Quiz Details</h3>
          <div>
            <label htmlFor="title">Quiz Title:</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="category">Category:</label>
            <select
              id="category"
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
          <div>
            <label htmlFor="numQuestions">Number of Questions:</label>
            <input
              type="number"
              id="numQuestions"
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              min="1"
              max="10"
              required
            />
          </div>
        </div>

        <div className="quiz-details-section">
          <h3>Content for AI Generation</h3>
          <div>
            <label htmlFor="content">Provide text content for AI to generate questions from:</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows="10"
              required
            ></textarea>
          </div>
          <button onClick={handleGenerateQuiz} disabled={loading} className="add-question-button">
            {loading ? 'Generating...' : 'Generate Quiz Questions with AI'}
          </button>
        </div>

        {generatedQuestions.length > 0 && (
          <div className="question-section">
            <h3>Generated Questions (Review & Edit)</h3>
            {generatedQuestions.map((q, qIndex) => (
              <div key={qIndex} className="question-card">
                <div className="question-header">
                  <h4>Question {qIndex + 1}</h4>
                  {/* <button className="remove-question-button">Remove</button> */}
                </div>
                <div className="question-content-layout">
                  <div className="question-text-input">
                    <label htmlFor={`question-text-${qIndex}`}>Question Text:</label>
                    <textarea
                      id={`question-text-${qIndex}`}
                      value={q.question_text}
                      onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="options-input-group">
                    <p>Options:</p>
                    {q.options.map((option, optIndex) => (
                      <div key={optIndex} className="option-input">
                        <label htmlFor={`option-${qIndex}-${optIndex}`}>
                          Option {String.fromCharCode(65 + optIndex)}:
                        </label>
                        <input
                          type="text"
                          id={`option-${qIndex}-${optIndex}`}
                          value={option}
                          onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                        />
                      </div>
                    ))}
                    <label htmlFor={`correct-answer-${qIndex}`}>Correct Answer (A, B, C, D):</label>
                    <input
                      type="text"
                      id={`correct-answer-${qIndex}`}
                      value={q.correct_answer}
                      onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value.toUpperCase())}
                      maxLength="1"
                      size="1"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={handleSaveQuiz} className="create-quiz-submit-button">
              Save AI Generated Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIGenerateQuiz;
