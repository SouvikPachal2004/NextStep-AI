from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import re
from typing import Dict, List

load_dotenv()

app = Flask(__name__)
CORS(app)

class SimpleResumeAnalyzer:
    def __init__(self):
        # Basic skill keywords
        self.skills = [
            'python', 'java', 'javascript', 'react', 'node.js', 'html', 'css',
            'sql', 'mongodb', 'aws', 'docker', 'git', 'machine learning',
            'data analysis', 'flask', 'django', 'express', 'angular', 'vue'
        ]
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from text"""
        text_lower = text.lower()
        found_skills = []
        for skill in self.skills:
            if skill in text_lower:
                found_skills.append(skill.title())
        return list(set(found_skills))
    
    def calculate_ats_score(self, text: str) -> int:
        """Calculate basic ATS score"""
        score = 0
        text_lower = text.lower()
        
        # Check for sections
        sections = ['experience', 'education', 'skills', 'projects']
        for section in sections:
            if section in text_lower:
                score += 20
        
        # Check for contact info
        if '@' in text and '.' in text:  # Basic email check
            score += 10
        
        # Check for skills
        skills = self.extract_skills(text)
        if len(skills) >= 5:
            score += 10
        
        return min(score, 100)
    
    def analyze_text(self, text: str) -> Dict:
        """Analyze resume text"""
        skills = self.extract_skills(text)
        ats_score = self.calculate_ats_score(text)
        
        return {
            'atsScore': ats_score,
            'skills': skills,
            'skillCount': len(skills),
            'wordCount': len(text.split()),
            'recommendations': [
                'Add more technical skills to your resume',
                'Include quantified achievements',
                'Add a projects section',
                'Use action verbs in descriptions'
            ][:3]
        }

# Initialize analyzer
analyzer = SimpleResumeAnalyzer()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'NextStep AI ML Service is running'
    })

@app.route('/api/ml/resume/analyze', methods=['POST'])
def analyze_resume():
    """Analyze resume text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        analysis = analyzer.analyze_text(text)
        
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
    """Extract skills from resume text"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        skills = analyzer.extract_skills(text)
        
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
    """Match user skills with job requirements"""
    try:
        data = request.get_json()
        user_skills = data.get('userSkills', [])
        jobs = data.get('jobs', [])
        
        # Simple matching logic
        matches = []
        for job in jobs:
            job_skills = job.get('requiredSkills', [])
            match_count = len(set(user_skills) & set(job_skills))
            match_percentage = (match_count / len(job_skills)) * 100 if job_skills else 0
            
            matches.append({
                'jobId': job.get('_id'),
                'matchPercentage': round(match_percentage, 1),
                'matchedSkills': list(set(user_skills) & set(job_skills))
            })
        
        return jsonify({
            'success': True,
            'matches': matches
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)
