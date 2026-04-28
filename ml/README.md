# NextStep AI - ML Service

Machine Learning service for resume analysis, job matching, and AI-powered features.

## Features

1. **Resume Analysis**
   - ATS score calculation
   - Skill extraction
   - Contact information extraction
   - Recommendations for improvement

2. **Job Matching**
   - Skill-based job matching
   - Match score calculation
   - Job recommendations
   - Skill gap analysis

3. **Course Recommendations**
   - Personalized course suggestions
   - Skill gap filling

## Setup Instructions

### 1. Install Python (3.8+)
Download from https://www.python.org/downloads/

### 2. Create Virtual Environment
```bash
cd ml
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm
```

### 4. Create .env File
```bash
ML_PORT=5001
```

### 5. Run the Service
```bash
python app.py
```

Service will run on `http://localhost:5001`

## API Endpoints

### Resume Analysis
```
POST /api/ml/resume/analyze
Content-Type: multipart/form-data
Body: file (PDF or DOCX)

Response:
{
  "success": true,
  "analysis": {
    "atsScore": 85,
    "skills": ["Python", "JavaScript", "React"],
    "contact": {
      "email": "user@example.com",
      "phone": "+1234567890"
    },
    "recommendations": [],
    "wordCount": 450,
    "skillCount": 12
  }
}
```

### Extract Skills
```
POST /api/ml/resume/extract-skills
Content-Type: application/json
Body: { "text": "resume text here" }

Response:
{
  "success": true,
  "skills": ["Python", "JavaScript", "React"]
}
```

### Job Matching
```
POST /api/ml/jobs/match
Content-Type: application/json
Body: {
  "userSkills": ["Python", "JavaScript"],
  "jobs": [
    {
      "id": "1",
      "title": "Python Developer",
      "skills": ["Python", "Django", "PostgreSQL"]
    }
  ]
}

Response:
{
  "success": true,
  "matches": [
    {
      "jobId": "1",
      "title": "Python Developer",
      "matchScore": 75.5,
      "matchingSkills": ["python"]
    }
  ]
}
```

### Job Recommendations
```
POST /api/ml/jobs/recommend
Content-Type: application/json
Body: {
  "userProfile": {
    "skills": ["Python", "JavaScript"],
    "completedCourses": [...]
  },
  "jobs": [...]
}

Response:
{
  "success": true,
  "recommendations": [...]
}
```

## Testing

Test the service:
```bash
curl http://localhost:5001/health
```

## Project Structure
```
ml/
├── app.py                 # Flask application
├── resume_analyzer.py     # Resume analysis logic
├── job_matcher.py         # Job matching logic
├── requirements.txt       # Python dependencies
└── README.md             # This file
```

## Troubleshooting

### spaCy model not found
```bash
python -m spacy download en_core_web_sm
```

### Port already in use
Change `ML_PORT` in `.env` file

### Import errors
Make sure virtual environment is activated and all dependencies are installed
