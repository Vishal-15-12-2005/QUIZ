import os
import google.generativeai as genai
import json

genai.configure(api_key="ENTER YOUR API")

def generate_quiz_from_content(
    content: str,
    num_questions: int = 5,
    quiz_type: str = "multiple choice",
    difficulty: str = "medium"
) -> list:
    """
    Generates quiz questions and answers using the Gemini API.

    Args:
        content (str): The text content from which to generate questions.
        num_questions (int): The desired number of questions.
        quiz_type (str): The type of quiz (e.g., "multiple choice", "true/false").
        difficulty (str): The difficulty level (e.g., "easy", "medium", "hard").

    Returns:
        list: A list of dictionaries, where each dictionary represents a question
              with its options and correct answer.
              Returns an empty list if generation fails.
    """
    if not content:
        return []

    # Craft a detailed prompt for the Gemini model
    prompt = f"""
    Generate a {difficulty} difficulty {quiz_type} quiz with {num_questions} questions based on the following content.
    For each question, provide 4 options (A, B, C, D) and indicate the correct answer.
    Ensure the questions and answers are directly derivable from the provided content.
    The output should be a JSON array of objects, where each object has 'question', 'options' (an array of strings),
    and 'correct_answer' (the letter A, B, C, or D).

    Content:
    {content}

    Example JSON format:
    [
      {{
        "question": "What is the capital of France?",
        "options": ["Berlin", "Paris", "Rome", "Madrid"],
        "correct_answer": "B"
      }}
    ]
    """

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        
        # Extract the text and attempt to parse it as JSON
        generated_text = response.text.strip()
        
        # Gemini might sometimes wrap JSON in markdown code blocks
        if generated_text.startswith('```json') and generated_text.endswith('```'):
            generated_text = generated_text[7:-3].strip()

        quiz_data = json.loads(generated_text)
        return quiz_data
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return []

if __name__ == '__main__':
    # Example usage (requires GEMINI_API_KEY environment variable set)
    sample_content = """
    The Amazon rainforest is the largest rainforest in the world, covering much of northwestern Brazil and extending into Colombia, Peru and other South American countries. It's known for its biodiversity. The Amazon River, running through the rainforest, is the second-longest river in the world.
    """
    
    print("Generating quiz...")
    generated_quiz = generate_quiz_from_content(sample_content, num_questions=2, difficulty="easy")
    if generated_quiz:
        print("Generated Quiz:")
        for q in generated_quiz:
            print(f"Question: {q['question']}")
            print(f"Options: {q['options']}")
            print(f"Correct: {q['correct_answer']}")
    else:
        print("Failed to generate quiz.")
