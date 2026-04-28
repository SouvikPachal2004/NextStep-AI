# Assessment PDF Upload Feature - Complete Guide

## 🎯 Overview

The NextStep AI platform now supports **automatic question import from PDF files**. Admins can upload a PDF containing questions and answers, and the system will automatically parse and import them into assessments.

## 📋 How It Works

### For Admins

1. **Create Assessment**
   - Go to Admin Dashboard → Assessments section
   - Click "Create New Assessment"
   - Fill in assessment details:
     - Title (e.g., "JavaScript Fundamentals Quiz")
     - Description
     - Category (e.g., JavaScript, Python, React, etc.)
     - Difficulty (Easy, Medium, Hard)
     - Duration (in minutes)
   - Click "Create Assessment"

2. **Upload Questions from PDF**
   - After creating the assessment, you'll see the Questions Manager
   - At the top, there's a **"Upload Questions from PDF"** section
   - Click "Choose File" and select your PDF
   - Click "Upload & Parse PDF"
   - The system will automatically:
     - Parse the PDF
     - Extract questions, options, and correct answers
     - Import up to 20 questions
     - Display them in the questions list

3. **Alternative: Add Questions Manually**
   - You can also add questions one by one using the manual form
   - Fill in question text, options, correct answer, and explanation
   - Click "Add Question"

4. **Publish Assessment**
   - Once you have 20 questions, the assessment is ready
   - It automatically appears in the user's assessment section
   - Users can filter by category to find it

### For Users

1. **View Available Assessments**
   - Go to User Dashboard → Assessments tab
   - See all published assessments organized by category
   - Each assessment shows:
     - Title and description
     - Category (subject)
     - Difficulty level
     - Duration
     - Number of questions
     - Passing score (80%)

2. **Take Assessment**
   - Click "Start Assessment" on any available assessment
   - Answer all 20 MCQ questions
   - Timer counts down from the specified duration
   - Navigate between questions using Previous/Next buttons
   - See progress indicator showing answered questions

3. **View Results**
   - After submitting, see your score immediately
   - View detailed breakdown:
     - Percentage score
     - Number of correct/wrong answers
     - Time taken
     - Pass/Fail status (80% required to pass)

4. **Get Improvement Recommendations**
   - If you don't pass, the system provides:
     - Specific topics to review
     - Study recommendations based on wrong answers
     - Suggested resources for improvement
   - Question-by-question review showing:
     - Your answer
     - Correct answer
     - Explanation (if provided)

5. **Retake Assessment**
   - You can retake any assessment multiple times
   - View your attempt history
   - Track your improvement over time

## 📄 PDF Format Requirements

### Structure
```
Q1. Question text here?
A) First option
B) Second option
C) Third option
D) Fourth option
Answer: B

Q2. Next question text?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
Answer: A
```

### Rules
- **Question numbering**: Q1., Q2., Q3., etc. (or 1., 2., 3., etc.)
- **Options**: A), B), C), D) (or a), b), c), d))
- **Answer format**: "Answer: A" (or "Correct: A" or "Ans: A")
- **Minimum 2 options**, maximum 4 options per question
- **Up to 20 questions** will be imported
- Each question must have exactly one correct answer

### Example PDF Content

See `SAMPLE_QUESTIONS.txt` for a complete example with 20 JavaScript questions.

## 🔄 Complete Workflow Example

### Admin Side:
1. Create assessment: "Python Basics" (Category: Python, Difficulty: Easy)
2. Upload PDF with 20 Python MCQ questions
3. System parses and imports all 20 questions
4. Assessment is now published and visible to users

### User Side:
1. User logs in and goes to Assessments
2. Sees "Python Basics" under Python category
3. Clicks "Start Assessment"
4. Answers 20 questions in 30 minutes
5. Submits and gets score: 75% (15/20 correct)
6. Sees "Failed" (needs 80% to pass)
7. Reviews improvement recommendations:
   - "Review Python data structures: lists, dicts, sets"
   - "Study Python OOP: classes, inheritance"
   - "Practice Python built-in functions"
8. Sees question-by-question breakdown with correct answers
9. Studies the recommended topics
10. Retakes assessment and scores 85% - Passes! 🎉

## 🎨 Features

### For Admins:
✅ Upload PDF with questions and answers
✅ Automatic parsing and import
✅ Manual question addition option
✅ Edit/delete individual questions
✅ View question count and total points
✅ Track user attempts and scores
✅ Category-based organization

### For Users:
✅ Browse assessments by category
✅ See difficulty level and duration
✅ Take timed assessments
✅ Real-time progress tracking
✅ Immediate score feedback
✅ Detailed results with explanations
✅ Personalized improvement recommendations
✅ Retake assessments unlimited times
✅ View attempt history

## 🔧 Technical Details

### Backend
- **Endpoint**: `POST /api/assessments/:id/upload-questions`
- **File type**: PDF only
- **Max file size**: 10MB
- **Parser**: Uses `pdf-parse` library
- **Storage**: Temporary upload, deleted after parsing

### Frontend
- **Upload form**: In Questions Manager modal
- **File validation**: Client-side and server-side
- **Progress indicator**: Shows upload and parsing status
- **Auto-refresh**: Updates question list after import

### Database
- **Model**: Assessment with embedded questions array
- **Fields per question**:
  - question (text)
  - type (multiple-choice, true-false)
  - options (array)
  - correctAnswer (string)
  - points (number)
  - explanation (string)

## 📊 Assessment Scoring

- Each question is worth 1 point by default
- Total score = (Correct answers / Total questions) × 100
- Passing score = 80% (fixed)
- Users must score 80% or higher to pass
- Scores are saved in attempt history

## 💡 Improvement Recommendations Algorithm

The system analyzes wrong answers and provides:

1. **Performance-based recommendations**:
   - <50%: "Foundational Review Needed"
   - 50-79%: "Almost There - Focus on missed topics"
   - 80%+: "Passed!"

2. **Category-specific tips**:
   - JavaScript: Closures, promises, async/await
   - Python: Data structures, OOP, built-ins
   - React: Hooks, lifecycle, state management
   - And more...

3. **Retake strategy**:
   - Review all incorrect answers
   - Understand why correct answers are right
   - Study recommended topics
   - Retake assessment

## 🚀 Getting Started

1. **Start the servers** (if not already running):
   ```bash
   # Backend
   cd backend
   npm start

   # Frontend
   cd frontend
   python -m http.server 3000
   ```

2. **Login as Admin**:
   - Go to http://localhost:3000/pages/login.html
   - Use admin credentials

3. **Create Your First Assessment**:
   - Go to Admin Dashboard → Assessments
   - Click "Create New Assessment"
   - Fill in details and create
   - Upload PDF or add questions manually

4. **Test as User**:
   - Logout and login as a regular user
   - Go to User Dashboard → Assessments
   - Take the assessment you created
   - View results and recommendations

## 📝 Sample Files

- **PDF Format Guide**: `PDF_QUESTION_FORMAT_GUIDE.md`
- **Sample Questions**: `SAMPLE_QUESTIONS.txt` (20 JavaScript questions)

You can convert `SAMPLE_QUESTIONS.txt` to PDF using any text-to-PDF converter and use it to test the upload feature.

## 🎓 Benefits

### For Educational Institutions:
- Quick assessment creation from existing question banks
- Standardized testing across courses
- Automated grading and feedback
- Performance tracking and analytics

### For Students:
- Self-paced learning and assessment
- Immediate feedback on performance
- Personalized study recommendations
- Unlimited practice opportunities

### For Instructors:
- Easy content management
- Bulk question import
- Detailed student analytics
- Time-saving automation

## 🔒 Security

- PDF files are validated (type and size)
- Files are deleted after parsing
- Only admins can upload questions
- User answers are securely stored
- Correct answers hidden from users during quiz

## 🐛 Troubleshooting

**Issue**: PDF upload fails
- **Solution**: Check PDF format matches requirements exactly

**Issue**: No questions imported
- **Solution**: Verify question numbering and answer format

**Issue**: Some questions missing
- **Solution**: Ensure each question has all required parts

**Issue**: Assessment not showing for users
- **Solution**: Check that assessment has 20 questions and is published

## 📞 Support

For issues or questions, check:
1. PDF format guide
2. Sample questions file
3. Console logs for error messages
4. Backend server logs

---

**Version**: 1.0.0  
**Last Updated**: April 24, 2026  
**Feature Status**: ✅ Production Ready
