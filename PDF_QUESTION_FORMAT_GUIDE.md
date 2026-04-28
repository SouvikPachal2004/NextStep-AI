# PDF Question Format Guide for NextStep AI

## Overview
This guide explains how to format your PDF files so that the NextStep AI system can automatically parse and import assessment questions.

## Supported PDF Format

### Basic Structure
Each question in your PDF should follow this structure:

```
Q1. What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
Answer: B

Q2. Which programming language is known for web development?
A) Python
B) Java
C) JavaScript
D) C++
Answer: C
```

### Format Requirements

1. **Question Numbering**
   - Start each question with: `Q1.`, `Q2.`, `Q3.`, etc.
   - Alternative: `1.`, `2.`, `3.`, etc.
   - Alternative: `Question 1`, `Question 2`, etc.

2. **Options**
   - Label options with: `A)`, `B)`, `C)`, `D)`
   - Alternative: `a)`, `b)`, `c)`, `d)`
   - Alternative: `A.`, `B.`, `C.`, `D.`
   - Each option should be on a new line
   - Minimum 2 options, maximum 4 options

3. **Correct Answer**
   - Mark the correct answer with: `Answer: A` (or B, C, D)
   - Alternative: `Correct: A`
   - Alternative: `Ans: A`
   - The letter should match one of your option labels

### Complete Example

```
Q1. What does HTML stand for?
A) Hyper Text Markup Language
B) High Tech Modern Language
C) Home Tool Markup Language
D) Hyperlinks and Text Markup Language
Answer: A

Q2. Which CSS property is used to change text color?
A) text-color
B) font-color
C) color
D) text-style
Answer: C

Q3. What is the correct syntax for referring to an external JavaScript file?
A) <script href="app.js">
B) <script name="app.js">
C) <script src="app.js">
D) <script file="app.js">
Answer: C

Q4. Which HTML tag is used for creating a hyperlink?
A) <link>
B) <a>
C) <href>
D) <url>
Answer: B

Q5. What does CSS stand for?
A) Creative Style Sheets
B) Cascading Style Sheets
C) Computer Style Sheets
D) Colorful Style Sheets
Answer: B
```

## Tips for Best Results

1. **Keep it Simple**: Use plain text formatting in your PDF
2. **Consistent Spacing**: Add a blank line between questions
3. **Clear Labels**: Make sure option labels (A, B, C, D) are clearly visible
4. **One Answer Per Question**: Each question should have exactly one correct answer
5. **Limit to 20 Questions**: The system will import up to 20 questions per PDF

## What Happens After Upload?

1. Admin uploads the PDF in the assessment creation section
2. System automatically parses the PDF and extracts questions
3. Questions are added to the assessment
4. Assessment becomes available in the user's assessment section
5. Users can take the assessment and see their scores
6. System provides improvement recommendations based on performance

## Category-Based Organization

- When you create an assessment, you select a **category** (e.g., JavaScript, Python, React)
- All assessments with the same category appear together in the user's assessment section
- Users can filter and find assessments by subject/category

## Example Workflow

1. **Admin**: Create new assessment → Select category "JavaScript" → Upload PDF with 20 JavaScript questions
2. **System**: Parses PDF → Imports questions → Assessment is ready
3. **User**: Opens assessment section → Sees "JavaScript" assessment → Takes quiz
4. **User**: Completes quiz → Gets score → Receives improvement recommendations
5. **User**: Can retake assessment to improve score

## Troubleshooting

**Problem**: No questions imported
- **Solution**: Check that your PDF follows the format exactly as shown above

**Problem**: Some questions missing
- **Solution**: Ensure each question has all required parts (question text, options, answer)

**Problem**: Wrong answers detected
- **Solution**: Verify that the answer letter (A, B, C, D) matches exactly with one of your options

## Need Help?

If you're having trouble with PDF formatting, you can always add questions manually using the "Add Question Manually" form in the assessment creation interface.
