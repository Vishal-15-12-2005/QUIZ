# Quiz Application

This is a full-stack quiz application with a React frontend and Flask backend.

## Live Demo

The frontend is deployed on GitHub Pages at: https://vishal-15-12-2005.github.io/QUIZ

## Frontend Deployment (GitHub Pages)

The React frontend is configured for GitHub Pages deployment. To deploy or update:

1. Make changes to the `quiz` directory
2. From the `quiz` directory, run:
   ```bash
   npm run deploy
   ```
3. This will automatically build the app and push the static files to the `gh-pages` branch

### GitHub Pages Configuration

After deployment, you need to enable GitHub Pages in your repository settings:

1. Go to your GitHub repository: https://github.com/Vishal-15-12-2005/QUIZ
2. Click on the "Settings" tab
3. Scroll down to the "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Select "gh-pages" as the branch and "/ (root)" as the folder
6. Click "Save"
7. Wait a few minutes for GitHub Pages to build and deploy your site

Your site will be available at: https://vishal-15-12-2005.github.io/QUIZ

### Troubleshooting GitHub Pages Display Issues

If the page loads but content doesn't show:

1. Check that GitHub Pages is enabled in your repository settings
2. Verify your `homepage` field in `quiz/package.json` is set to `"https://vishal-15-12-2005.github.io/QUIZ"`
3. Ensure your React Router is configured for a subdirectory (the `/QUIZ/` path) - this has been fixed in the latest deployment
4. The included `404.html` file should help with routing issues
5. Wait a few minutes after deployment for GitHub Pages to fully update
6. Clear your browser cache or try opening in an incognito/private window
7. Make sure there's only one BrowserRouter in your app (fixed - removed duplicate in index.js)

If you're still experiencing issues, please check the browser's developer console for any error messages.

## Backend Deployment

The backend is a Flask application that requires:
- Python 3.x
- MongoDB database
- Dependencies listed in `backend/requirements.txt`

### Local Development Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Ensure MongoDB is running on your system (typically on localhost:27017)

4. Run the application:
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`.

### Production Deployment Options

#### Option 1: Heroku
1. Create a Heroku account and install the Heroku CLI
2. Create a new app in your Heroku dashboard
3. Connect your GitHub repository to Heroku
4. Add the MongoDB Atlas addon for database hosting
5. Set environment variables for any configurations
6. Deploy your app

#### Option 2: PythonAnywhere
1. Create a PythonAnywhere account
2. Upload your code or clone your repository
3. Set up a virtual environment and install dependencies from requirements.txt
4. Configure a web app with the Flask framework
5. Update the MongoDB connection string to your production database

#### Option 3: AWS Elastic Beanstalk
1. Prepare your application with a Procfile:
   ```
   web: gunicorn app:app
   ```
2. Install gunicorn: `pip install gunicorn`
3. Create a zip file with your application code
4. Upload to Elastic Beanstalk
5. Configure environment and connect to MongoDB

#### Option 4: DigitalOcean App Platform
1. Connect your GitHub repository
2. Configure as a web service with Python runtime
3. Add environment variables and database connection
4. Deploy automatically when pushing to main branch

### Environment Variables

For production deployments, consider using environment variables:

```python
import os
from dotenv import load_dotenv

load_dotenv()  # load environment variables from .env file

# Use in your app.py
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
PORT = int(os.getenv('PORT', 5000))
```

Create a `.env` file for local development and set environment variables in your deployment platform for production.

### Database Configuration

The application uses MongoDB. For production:
- Use MongoDB Atlas (cloud MongoDB service)
- Or set up MongoDB on your cloud server
- Update the connection string in `app.py` accordingly

## Project Structure

- `/quiz` - React frontend application
- `/backend` - Flask API server
- `quiz` repository on GitHub Pages - Frontend deployment

## API Endpoints

The backend provides the following endpoints:

- `POST /signup` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /categories` - Get all quiz categories
- `POST /quizzes` - Create a new quiz
- `GET /quizzes` - Get all quizzes (with optional category filter)
- `POST /submit_quiz` - Submit quiz answers
- `GET /results/:result_id` - Get quiz results
- `GET /leaderboard` - Get quiz leaderboard
- `GET /profile/:username` - Get user profile
- `POST /generate_quiz_ai` - Generate quiz using AI

## Frontend-Backend Connection

When deploying the frontend and backend separately:
1. Update the API base URL in your React application to point to your deployed backend
2. Ensure CORS is properly configured on your backend for the frontend domain
3. For GitHub Pages + external backend, you may need to handle CORS appropriately

## Environment Configuration

For production deployment, ensure the following:

1. Update the MongoDB connection string in `app.py` to point to your production database
2. Update the API endpoint in your React app to point to your deployed backend
3. Set up proper CORS configuration for production domains
4. Add proper authentication and security measures

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request