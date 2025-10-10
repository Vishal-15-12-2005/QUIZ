import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from flask_bcrypt import Bcrypt
from datetime import datetime
from bson.objectid import ObjectId # Import ObjectId
from functools import wraps
from werkzeug.utils import secure_filename # For secure filenames
from ai_quiz_generator import generate_quiz_from_content # Import the AI quiz generator

app = Flask(__name__)
CORS(app) # Enable CORS for all routes
bcrypt = Bcrypt(app)

# MongoDB connection
try:
    client = MongoClient('mongodb://localhost:27017/') # Assuming default MongoDB port
    db = client.test_quiz_db # Changed to 'test_quiz_db' for testing
    # The ping command is cheap and does not require auth. 
    # It will be green if the server is running. 
    client.admin.command('ping') 
    print("MongoDB connected successfully!")

    # Add dummy categories if the collection is empty
    if db.categories.count_documents({}) == 0:
        print("Adding dummy categories...")
        dummy_categories = [
            {"name": "Science", "description": "Questions about various scientific fields."},
            {"name": "History", "description": "Events and figures from the past."},
            {"name": "Mathematics", "description": "Problems and concepts in mathematics."},
            {"name": "Literature", "description": "Works and authors of literature."}
        ]
        db.categories.insert_many(dummy_categories)
        print("Dummy categories added.")

except Exception as e:
    print(f"Could not connect to MongoDB: {e}")
    client = None
    db = None

# Configuration for file uploads
UPLOAD_FOLDER = 'static/avatars'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Decorator for admin required routes
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In a real application, you would get the user's role from a JWT or session
        # For now, we'll assume the username is passed in the request headers or body
        # and we'll fetch the user from the DB to check their role.
        # This is a simplified approach for demonstration.
        username = request.headers.get('X-User-Username') # Assuming username in header
        if not username:
            return jsonify({"message": "Authentication required."}), 401
        
        user = db.users.find_one({"username": username})
        if not user or user.get('role') != 'admin':
            return jsonify({"message": "Admin access required."}), 403
        return f(*args, **kwargs)
    return decorated_function

@app.route('/status', methods=['GET'])
def status():
    return jsonify({"status": "Backend is running!"})

@app.route('/db_status', methods=['GET'])
def db_status():
    if client is None: # Corrected check
        return jsonify({"db_status": "MongoDB client not initialized."}),
    try:
        client.admin.command('ping')
        return jsonify({"db_status": "MongoDB connected and accessible!"})
    except Exception as e:
        return jsonify({"db_status": f"MongoDB connection failed: {e}"}), 500

@app.route('/signup', methods=['POST'])
def signup():
    if db is None: # Corrected check
        return jsonify({"message": "Database not connected."}),

    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({"message": "Missing username, email, or password."}),

    # Check if user already exists
    if db.users.find_one({"username": username}):
        return jsonify({"message": "Username already exists."}),
    if db.users.find_one({"email": email}):
        return jsonify({"message": "Email already exists."}),

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    user = {
        "username": username,
        "email": email,
        "password": hashed_password,
        "role": "user" # Default role for new users
    }
    db.users.insert_one(user)

    return jsonify({"message": "User created successfully!"}), 201

@app.route('/login', methods=['POST'])
def login():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"message": "Missing username or password."}),

    user = db.users.find_one({"username": username})

    if user and bcrypt.check_password_hash(user['password'], password):
        # Record login time
        db.user_sessions.insert_one({
            "user_id": str(user['_id']), # Convert ObjectId to string
            "username": user['username'],
            "login_time": datetime.now(),
            "logout_time": None
        })
        return jsonify({"message": "Login successful!", "user": {"username": user['username'], "email": user['email'], "role": user.get('role', 'user')}}), 200
    else:
        return jsonify({"message": "Invalid username or password."}),

@app.route('/logout', methods=['POST'])
def logout():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    data = request.get_json()
    username = data.get('username')

    print(f"Logout request received for username: {username}") # Debugging

    if not username:
        print("Missing username in logout request.") # Debugging
        return jsonify({"message": "Missing username."}),

    # Find the most recent active session for the user and update logout_time
    query = {"username": username, "logout_time": None}
    print(f"Logout query: {query}") # Debugging

    session = db.user_sessions.find_one_and_update(
        query,
        {"$set": {"logout_time": datetime.now()}},
        sort=[('login_time', -1)] # Get the most recent login
    )

    print(f"Session found for logout: {session}") # Debugging

    if session:
        return jsonify({"message": "Logout successful!"}), 200
    else:
        return jsonify({"message": "No active session found for this user."}),

@app.route('/categories', methods=['GET'])
def get_categories():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    
    categories = list(db.categories.find({}, {'_id': 0})) # Exclude _id from response
    return jsonify(categories), 200

@app.route('/quizzes', methods=['POST'])
def create_quiz():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    data = request.get_json()
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    created_by = data.get('created_by') # This should come from authenticated user
    questions = data.get('questions')

    if not all([title, description, category, created_by, questions]):
        return jsonify({"message": "Missing required quiz fields."}),

    # Basic validation for questions structure
    for q in questions:
        if not all([q.get('question_text'), q.get('options'), q.get('correct_answer')]):
            return jsonify({"message": "Each question must have text, options, and a correct answer."}),
        # Validate correct_answer: it should be a letter (A, B, C, D) corresponding to an option
        correct_answer_letter = q.get('correct_answer')
        options_list = q.get('options')
        
        if not correct_answer_letter or not options_list:
            return jsonify({"message": "Each question must have text, options, and a correct answer."}), 400

        # Convert letter to 0-based index
        correct_answer_index = ord(correct_answer_letter.upper()) - ord('A')

        if not (0 <= correct_answer_index < len(options_list)):
            return jsonify({"message": "Correct answer letter does not correspond to a valid option."}), 400

    quiz = {
        "title": title,
        "description": description,
        "category": category,
        "created_by": created_by,
        "questions": questions,
        "created_at": datetime.now()
    }

    result = db.quizzes.insert_one(quiz)
    return jsonify({"message": "Quiz created successfully!", "quiz_id": str(result.inserted_id)}), 201

@app.route('/quizzes', methods=['GET'])
def get_quizzes():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    
    category = request.args.get('category')
    query = {}
    if category:
        query['category'] = category

    quizzes = []
    for quiz in db.quizzes.find(query):
        quiz['_id'] = str(quiz['_id'])
        quizzes.append(quiz)

    return jsonify(quizzes), 200

@app.route('/submit_quiz', methods=['POST'])
def submit_quiz():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    data = request.get_json()
    quiz_id = data.get('quiz_id')
    username = data.get('username')
    user_answers = data.get('user_answers')

    if not all([quiz_id, username, user_answers]):
        return jsonify({"message": "Missing quiz_id, username, or user_answers."}),

    try:
        quiz = db.quizzes.find_one({'_id': ObjectId(quiz_id)}) # Find quiz by ObjectId
        if not quiz:
            return jsonify({"message": "Quiz not found."}),

        correct_answers = [ord(q['correct_answer'].upper()) - ord('A') for q in quiz['questions']]
        score = 0
        detailed_results = []

        for i, user_ans in enumerate(user_answers):
            is_correct = (user_ans == correct_answers[i])
            if is_correct:
                score += 1
            detailed_results.append({
                "question_index": i,
                "user_answer": user_ans,
                "correct_answer": correct_answers[i],
                "is_correct": is_correct
            })
        
        total_questions = len(quiz['questions'])
        percentage_score = (score / total_questions) * 100 if total_questions > 0 else 0

        result_doc = {
            "quiz_id": quiz_id,
            "user_id": username, # Using username as user_id for simplicity
            "score": score,
            "total_questions": total_questions,
            "percentage_score": percentage_score,
            "detailed_results": detailed_results,
            "submission_time": datetime.now()
        }
        db.quiz_results.insert_one(result_doc)

        return jsonify({
            "message": "Quiz submitted successfully!",
            "score": score,
            "total_questions": total_questions,
            "percentage_score": percentage_score,
            "result_id": str(result_doc['_id'])
        }), 200

    except Exception as e:
        return jsonify({"message": f"Error processing quiz submission: {e}"}), 500

@app.route('/results/<result_id>', methods=['GET'])
def get_quiz_result(result_id):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    try:
        result = db.quiz_results.find_one({'_id': ObjectId(result_id)})
        if not result:
            return jsonify({"message": "Result not found."}),
        
        result['_id'] = str(result['_id']) # Convert ObjectId to string
        result['submission_time'] = result['submission_time'].isoformat() # Convert datetime to string

        return jsonify(result), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching quiz result: {e}"}), 500

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    try:
        # Aggregate to get the highest percentage_score for each user
        leaderboard_data = db.quiz_results.aggregate([
            {
                '$group': {
                    '_id': '$user_id',
                    'username': {'$first': '$user_id'},
                    'highest_score': {'$max': '$percentage_score'}
                }
            },
            {
                '$sort': {'highest_score': -1}
            },
            {
                '$limit': 10 # Top 10 users
            },
            {
                '$project': {
                    '_id': 0, # Exclude _id
                    'username': 1,
                    'highest_score': {'$round': ['$highest_score', 2]} # Round to 2 decimal places
                }
            }
        ])
        
        leaderboard = list(leaderboard_data)
        return jsonify(leaderboard), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching leaderboard: {e}"}), 500

@app.route('/profile/<username>', methods=['GET'])
def get_user_profile(username):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500

    try:
        user = db.users.find_one({"username": username}, {'password': 0}) # Exclude password
        if not user:
            return jsonify({"message": "User not found."}),
        
        user['_id'] = str(user['_id']) # Convert ObjectId to string

        # Fetch quiz results for this user
        user_quiz_results = []
        for result in db.quiz_results.find({"user_id": username}).sort("submission_time", -1):
            result['_id'] = str(result['_id'])
            result['submission_time'] = result['submission_time'].isoformat()
            
            # Optionally fetch quiz title for each result
            quiz = db.quizzes.find_one({'_id': ObjectId(result['quiz_id'])}, {'title': 1})
            if quiz:
                result['quiz_title'] = quiz['title']
            
            user_quiz_results.append(result)

        user['quiz_history'] = user_quiz_results

        return jsonify(user), 200

    except Exception as e:
        return jsonify({"message": f"Error fetching user profile: {e}"}), 500

@app.route('/admin/users', methods=['GET'])
@admin_required
def get_all_users():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    try:
        users = []
        for user in db.users.find({}, {'password': 0}): # Exclude password
            user['_id'] = str(user['_id'])
            users.append(user)
        return jsonify(users), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching users: {e}"}), 500

@app.route('/admin/user/<username>/role', methods=['PUT'])
@admin_required
def update_user_role(username):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    data = request.get_json()
    new_role = data.get('role')

    if not new_role or new_role not in ['user', 'admin']:
        return jsonify({"message": "Invalid role provided. Must be 'user' or 'admin'."}), 400

    try:
        result = db.users.update_one(
            {"username": username},
            {"$set": {"role": new_role}}
        )
        if result.matched_count == 0:
            return jsonify({"message": "User not found."}),
        return jsonify({"message": "User role updated successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error updating user role: {e}"}), 500

@app.route('/admin/user/<username>', methods=['DELETE'])
@admin_required
def delete_user(username):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    try:
        # Delete the user record
        user_delete_result = db.users.delete_one({"username": username})
        
        # Optionally, delete associated data (quiz results, sessions) for this user
        db.quiz_results.delete_many({"user_id": username})
        db.user_sessions.delete_many({"username": username})

        if user_delete_result.deleted_count == 0:
            return jsonify({"message": "User not found."}),
        
        return jsonify({"message": "User deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error deleting user: {e}"}), 500

@app.route('/admin/category', methods=['POST'])
@admin_required
def add_category():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')

    print(f"Attempting to add category: Name={name}, Description={description}") # Debugging

    if not name or not description:
        print("Missing category name or description.") # Debugging
        return jsonify({"message": "Missing category name or description."}),
    
    if db.categories.find_one({"name": name}):
        print(f"Category '{name}' already exists.") # Debugging
        return jsonify({"message": "Category with this name already exists."}),

    try:
        result = db.categories.insert_one({"name": name, "description": description})
        print(f"Insert result: {result.inserted_id}") # Debugging
        return jsonify({"message": "Category added successfully!"}), 201
    except Exception as e:
        print(f"Error adding category: {e}") # Debugging
        return jsonify({"message": f"Error adding category: {e}"}), 500

@app.route('/admin/category/<category_name>', methods=['PUT'])
@admin_required
def update_category(category_name):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    data = request.get_json()
    new_description = data.get('description')

    if not new_description:
        return jsonify({"message": "Missing new description."}),

    try:
        result = db.categories.update_one(
            {"name": category_name},
            {"$set": {"description": new_description}}
        )
        if result.matched_count == 0:
            return jsonify({"message": "Category not found."}),
        return jsonify({"message": "Category updated successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error updating category: {e}"}), 500

@app.route('/admin/category/<category_name>', methods=['DELETE'])
@admin_required
def delete_category(category_name):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    try:
        result = db.categories.delete_one({"name": category_name})
        if result.deleted_count == 0:
            return jsonify({"message": "Category not found."}),
        return jsonify({"message": "Category deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error deleting category: {e}"}), 500

@app.route('/admin/quizzes', methods=['GET'])
@admin_required
def get_all_quizzes_admin():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    try:
        quizzes = []
        for quiz in db.quizzes.find({}):
            quiz['_id'] = str(quiz['_id'])
            quiz['created_at'] = quiz['created_at'].isoformat()
            quizzes.append(quiz)
        return jsonify(quizzes), 200
    except Exception as e:
        return jsonify({"message": f"Error fetching quizzes: {e}"}), 500

@app.route('/admin/quiz/<quiz_id>', methods=['DELETE'])
@admin_required
def delete_quiz_admin(quiz_id):
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    try:
        # Delete the quiz itself
        quiz_delete_result = db.quizzes.delete_one({'_id': ObjectId(quiz_id)})
        
        # Optionally, delete associated quiz results
        db.quiz_results.delete_many({'quiz_id': quiz_id})

        if quiz_delete_result.deleted_count == 0:
            return jsonify({"message": "Quiz not found."}),
        
        return jsonify({"message": "Quiz deleted successfully!"}), 200
    except Exception as e:
        return jsonify({"message": f"Error deleting quiz: {e}"}), 500

@app.route('/generate_quiz_ai', methods=['POST'])
def generate_quiz_ai():
    if db is None:
        return jsonify({"message": "Database not connected."}), 500
    
    data = request.get_json()
    content = data.get('content')
    num_questions = data.get('num_questions', 5) # Default to 5 questions
    quiz_type = data.get('quiz_type', 'multiple choice')
    difficulty = data.get('difficulty', 'medium')

    if not content:
        return jsonify({"message": "Content for quiz generation is required."}), 400

    try:
        generated_quiz = generate_quiz_from_content(
            content=content,
            num_questions=num_questions,
            quiz_type=quiz_type,
            difficulty=difficulty
        )
        
        if not generated_quiz:
            return jsonify({"message": "Failed to generate quiz. Please try again or refine your content."}), 500
        
        return jsonify({"message": "Quiz generated successfully!", "quiz_data": generated_quiz}), 200

    except Exception as e:
        return jsonify({"message": f"Error generating AI quiz: {e}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)