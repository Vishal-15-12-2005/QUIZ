import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function Results() {
  const { id } = useParams(); // Get result_id from URL
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:5000/results/${id}`);
        const data = await response.json();

        if (response.ok) {
          setResult(data);
        } else {
          setMessage(data.message || 'Failed to fetch quiz results.');
        }
      } catch (error) {
        console.error('Error fetching quiz results:', error);
        setMessage('Network error. Could not load results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]); // Re-run when result ID changes

  if (loading) {
    return <div>Loading results...</div>;
  }

  if (message) {
    return <div className="message error">{message}</div>;
  }

  if (!result) {
    return <div className="results-container">No results found for this quiz submission.</div>;
  }

  return (
    <div className="results-container"> {/* Apply results-container here */}
      <h2>Quiz Results</h2>
      <p><strong>Score:</strong> {result.score} / {result.total_questions}</p>
      <p><strong>Percentage:</strong> {result.percentage_score.toFixed(2)}%</p>
      <p><strong>Submitted On:</strong> {new Date(result.submission_time).toLocaleString()}</p>

      <h3>Detailed Results:</h3>
      <ul>
        {result.detailed_results.map((detail, index) => (
          <li key={index} className={detail.is_correct ? 'correct' : 'incorrect'}> {/* Apply correct/incorrect classes */}
            Question {detail.question_index + 1}: Your answer was "{detail.user_answer}". Correct answer was "{detail.correct_answer}".
            ({detail.is_correct ? 'Correct' : 'Incorrect'})
          </li>
        ))}
      </ul>

      <p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </p>
    </div>
  );
}

export default Results;
