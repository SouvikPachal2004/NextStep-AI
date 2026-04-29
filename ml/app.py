from flask import Flask, jsonify, request
import os

app = Flask(__name__)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'message': 'NextStep AI ML Service is running'
    })

@app.route('/api/ml/resume/analyze', methods=['POST'])
def analyze_resume():
    try:
        data = request.get_json() or {}
        text = data.get('text', '')
        
        # Simple skill extraction
        skills = []
        skill_list = ['python', 'java', 'javascript', 'react', 'node', 'html', 'css', 'sql']
        for skill in skill_list:
            if skill.lower() in text.lower():
                skills.append(skill.title())
        
        # Simple ATS score
        score = 50
        if 'experience' in text.lower():
            score += 20
        if 'education' in text.lower():
            score += 15
        if len(skills) > 3:
            score += 15
        
        return jsonify({
            'success': True,
            'analysis': {
                'atsScore': min(score, 100),
                'skills': skills,
                'recommendations': ['Add more skills', 'Include experience section', 'Add education details']
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ml/jobs/match', methods=['POST'])
def match_jobs():
    try:
        data = request.get_json() or {}
        return jsonify({
            'success': True,
            'matches': []
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)