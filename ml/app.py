from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from resume_analyzer import ResumeAnalyzer
from job_matcher import JobMatcher

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize services
resume_analyzer = ResumeAnalyzer()
job_matcher = JobMatcher()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'NextStep AI ML Service is running'
    })

@app.route('/api/ml/resume/analyze', methods=['POST'])
def analyze_resume():
    """
    Analyze resume and return ATS score, extracted skills, and recommendations
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Save file temporarily
        temp_path = os.path.join('/tmp', file.filename)
        file.save(temp_path)
        
        # Analyze resume
        analysis = resume_analyzer.analyze(temp_path)
        
        # Clean up
        os.remove(temp_path)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/resume/extract-skills', methods=['POST'])
def extract_skills():
    """
    Extract skills from resume text
    """
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        skills = resume_analyzer.extract_skills(text)
        
        return jsonify({
            'success': True,
            'skills': skills
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/jobs/match', methods=['POST'])
def match_jobs():
    """
    Match user skills with job requirements and return match scores
    """
    try:
        data = request.get_json()
        user_skills = data.get('userSkills', [])
        jobs = data.get('jobs', [])
        
        if not user_skills or not jobs:
            return jsonify({'error': 'Missing required data'}), 400
        
        matches = job_matcher.calculate_matches(user_skills, jobs)
        
        return jsonify({
            'success': True,
            'matches': matches
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/jobs/recommend', methods=['POST'])
def recommend_jobs():
    """
    Recommend jobs based on user profile and learning history
    """
    try:
        data = request.get_json()
        user_profile = data.get('userProfile', {})
        available_jobs = data.get('jobs', [])
        
        recommendations = job_matcher.recommend_jobs(user_profile, available_jobs)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ml/assessment/generate', methods=['POST'])
def generate_assessment():
    """
    Generate AI-powered assessment questions based on course content
    """
    try:
        data = request.get_json()
        topic = data.get('topic', '')
        difficulty = data.get('difficulty', 'medium')
        num_questions = data.get('numQuestions', 10)
        
        # TODO: Implement AI question generation
        questions = []
        
        return jsonify({
            'success': True,
            'questions': questions
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('ML_PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
