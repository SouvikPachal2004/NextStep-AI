import re
import PyPDF2
import docx
from typing import Dict, List
from collections import Counter

class ResumeAnalyzer:
    def __init__(self):
        # Common technical skills database
        self.skill_keywords = {
            'programming': ['python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust', 'typescript'],
            'web': ['html', 'css', 'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'asp.net'],
            'database': ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'cassandra', 'dynamodb'],
            'cloud': ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd'],
            'data_science': ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'data analysis'],
            'tools': ['git', 'github', 'jira', 'agile', 'scrum', 'rest api', 'graphql', 'microservices']
        }
        
        # ATS keywords
        self.ats_keywords = [
            'experience', 'education', 'skills', 'projects', 'certifications',
            'achievements', 'responsibilities', 'technologies', 'tools'
        ]
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ''
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text()
        except Exception as e:
            print(f"Error extracting PDF: {e}")
        return text
    
    def extract_text_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        text = ''
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + '\n'
        except Exception as e:
            print(f"Error extracting DOCX: {e}")
        return text
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from resume file"""
        if file_path.endswith('.pdf'):
            return self.extract_text_from_pdf(file_path)
        elif file_path.endswith('.docx'):
            return self.extract_text_from_docx(file_path)
        else:
            return ''
    
    def extract_skills(self, text: str) -> List[str]:
        """Extract technical skills from text"""
        text_lower = text.lower()
        found_skills = []
        
        for category, skills in self.skill_keywords.items():
            for skill in skills:
                if skill in text_lower:
                    found_skills.append(skill.title())
        
        # Remove duplicates and sort
        return sorted(list(set(found_skills)))
    
    def extract_email(self, text: str) -> str:
        """Extract email from text"""
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        return emails[0] if emails else ''
    
    def extract_phone(self, text: str) -> str:
        """Extract phone number from text"""
        phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, text)
        return phones[0] if phones else ''
    
    def calculate_ats_score(self, text: str) -> int:
        """Calculate ATS compatibility score"""
        score = 0
        text_lower = text.lower()
        
        # Check for standard sections (40 points)
        section_keywords = ['experience', 'education', 'skills', 'projects']
        for keyword in section_keywords:
            if keyword in text_lower:
                score += 10
        
        # Check for contact information (20 points)
        if self.extract_email(text):
            score += 10
        if self.extract_phone(text):
            score += 10
        
        # Check for skills (20 points)
        skills = self.extract_skills(text)
        if len(skills) >= 8:
            score += 20
        elif len(skills) >= 5:
            score += 15
        elif len(skills) >= 3:
            score += 10
        
        # Check for formatting (15 points)
        lines = text.split('\n')
        non_empty_lines = [line for line in lines if line.strip()]
        if len(non_empty_lines) > 20:
            score += 10
        if any(char in text for char in ['•', '-', '*']):  # Bullet points
            score += 5
        
        # Bonus: action verbs, links, certifications (5 points)
        action_verbs = ['achieved', 'improved', 'increased', 'reduced', 'developed', 'led', 'managed', 'built', 'designed']
        if any(v in text_lower for v in action_verbs):
            score += 3
        if any(link in text_lower for link in ['github', 'linkedin', 'portfolio']):
            score += 2
        
        return min(score, 100)

    def calculate_ats_breakdown(self, text: str) -> dict:
        """Return per-category ATS breakdown scores"""
        text_lower = text.lower()
        skills = self.extract_skills(text)
        lines = text.split('\n')
        non_empty_lines = [l for l in lines if l.strip()]

        section_score = sum(10 for kw in ['experience', 'education', 'skills', 'projects'] if kw in text_lower)
        contact_score = (10 if self.extract_email(text) else 0) + (10 if self.extract_phone(text) else 0)
        skills_score  = 20 if len(skills) >= 8 else 15 if len(skills) >= 5 else 10 if len(skills) >= 3 else 0
        fmt_score     = (10 if len(non_empty_lines) > 20 else 0) + (5 if any(c in text for c in ['•', '-', '*']) else 0)
        action_verbs  = ['achieved', 'improved', 'increased', 'reduced', 'developed', 'led', 'managed', 'built', 'designed']
        kw_score      = (3 if any(v in text_lower for v in action_verbs) else 0) + \
                        (2 if any(l in text_lower for l in ['github', 'linkedin', 'portfolio']) else 0)

        return {
            'sections':   section_score,
            'contact':    contact_score,
            'skills':     skills_score,
            'formatting': fmt_score,
            'keywords':   kw_score
        }
    
    def analyze(self, file_path: str) -> Dict:
        """Complete resume analysis"""
        text = self.extract_text(file_path)
        
        if not text:
            return {
                'error': 'Could not extract text from resume'
            }
        
        skills = self.extract_skills(text)
        ats_score = self.calculate_ats_score(text)
        ats_breakdown = self.calculate_ats_breakdown(text)
        email = self.extract_email(text)
        phone = self.extract_phone(text)
        
        # Extract experience level
        experience_level = self.extract_experience_level(text)
        
        # Extract education
        education = self.extract_education(text)
        
        # Generate comprehensive recommendations
        recommendations = self.generate_recommendations(text, skills, ats_score, email, phone)
        
        # Skill categorization
        skill_categories = self.categorize_skills(skills)
        
        return {
            'atsScore': ats_score,
            'atsBreakdown': ats_breakdown,
            'skills': skills,
            'skillCategories': skill_categories,
            'experienceLevel': experience_level,
            'education': education,
            'contact': {
                'email': email,
                'phone': phone
            },
            'recommendations': recommendations,
            'wordCount': len(text.split()),
            'skillCount': len(skills),
            'summary': self.generate_summary(skills, experience_level, education, ats_score)
        }
    
    def extract_experience_level(self, text: str) -> str:
        """Extract experience level from resume"""
        text_lower = text.lower()
        
        # Check for explicit experience mentions
        experience_patterns = [
            (r'(\d+)\+?\s*years?\s*(?:of)?\s*experience', 'years'),
            (r'experience\s*:?\s*(\d+)\+?\s*years?', 'years'),
            (r'(\d+)\+?\s*years?\s*in', 'years')
        ]
        
        for pattern, _ in experience_patterns:
            match = re.search(pattern, text_lower)
            if match:
                years = int(match.group(1))
                if years == 0:
                    return 'Entry Level'
                elif years <= 2:
                    return '0-2 years'
                elif years <= 5:
                    return '2-5 years'
                elif years <= 10:
                    return '5-10 years'
                else:
                    return '10+ years'
        
        # Check for fresher indicators
        fresher_keywords = ['fresher', 'recent graduate', 'entry level', 'seeking first', 'no experience']
        if any(keyword in text_lower for keyword in fresher_keywords):
            return 'Entry Level / Fresher'
        
        return 'Not specified'
    
    def extract_education(self, text: str) -> str:
        """Extract highest education level"""
        text_lower = text.lower()
        
        if any(keyword in text_lower for keyword in ['phd', 'ph.d', 'doctorate', 'doctoral']):
            return 'PhD / Doctorate'
        elif any(keyword in text_lower for keyword in ['master', 'm.s', 'm.sc', 'm.tech', 'mba', 'm.b.a']):
            return "Master's Degree"
        elif any(keyword in text_lower for keyword in ['bachelor', 'b.s', 'b.sc', 'b.tech', 'b.e', 'b.a']):
            return "Bachelor's Degree"
        elif any(keyword in text_lower for keyword in ['diploma', 'associate']):
            return 'Diploma / Associate'
        
        return 'Not specified'
    
    def categorize_skills(self, skills: List[str]) -> Dict[str, List[str]]:
        """Categorize skills into groups"""
        categories = {
            'Programming Languages': [],
            'Web Technologies': [],
            'Databases': [],
            'Cloud & DevOps': [],
            'Data Science & AI': [],
            'Tools & Frameworks': []
        }
        
        skills_lower = [s.lower() for s in skills]
        
        for skill in skills:
            skill_lower = skill.lower()
            
            # Check each category
            if any(prog in skill_lower for prog in ['python', 'java', 'javascript', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust', 'typescript']):
                categories['Programming Languages'].append(skill)
            elif any(web in skill_lower for web in ['html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'spring', 'asp.net']):
                categories['Web Technologies'].append(skill)
            elif any(db in skill_lower for db in ['sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'oracle', 'cassandra', 'dynamodb']):
                categories['Databases'].append(skill)
            elif any(cloud in skill_lower for cloud in ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd']):
                categories['Cloud & DevOps'].append(skill)
            elif any(ds in skill_lower for ds in ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'data analysis']):
                categories['Data Science & AI'].append(skill)
            else:
                categories['Tools & Frameworks'].append(skill)
        
        # Remove empty categories
        return {k: v for k, v in categories.items() if v}
    
    def generate_recommendations(self, text: str, skills: List[str], ats_score: int, email: str, phone: str) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        text_lower = text.lower()
        
        # ATS Score recommendations
        if ats_score < 60:
            recommendations.append('Your ATS score is low. Add standard sections: Summary, Experience, Education, Skills, and Projects')
        elif ats_score < 80:
            recommendations.append('Improve your ATS score by adding more structured sections and using industry keywords')
        
        # Skills recommendations
        if len(skills) < 5:
            recommendations.append('Add more technical skills relevant to your target role (aim for at least 8-10 skills)')
        elif len(skills) < 8:
            recommendations.append('Consider adding more specialized skills to stand out from other candidates')
        
        # Contact information
        if not email:
            recommendations.append('Add a professional email address at the top of your resume')
        if not phone:
            recommendations.append('Include a contact phone number for recruiters to reach you')
        
        # Content recommendations
        if 'project' not in text_lower:
            recommendations.append('Add a Projects section showcasing your practical work and achievements')
        
        if not any(keyword in text_lower for keyword in ['achieved', 'improved', 'increased', 'reduced', 'developed']):
            recommendations.append('Use action verbs and quantify your achievements (e.g., "Improved performance by 40%")')
        
        if 'github' not in text_lower and 'portfolio' not in text_lower and 'linkedin' not in text_lower:
            recommendations.append('Add links to your GitHub, portfolio, or LinkedIn profile')
        
        if 'certification' not in text_lower and 'certified' not in text_lower:
            recommendations.append('Include relevant certifications to boost your credibility')
        
        # Format recommendations
        lines = text.split('\n')
        if len([l for l in lines if l.strip()]) < 15:
            recommendations.append('Expand your resume with more details about your experience and projects')
        
        return recommendations[:8]  # Limit to top 8 recommendations
    
    def generate_summary(self, skills: List[str], experience: str, education: str, ats_score: int) -> str:
        """Generate a brief summary of the resume"""
        skill_count = len(skills)
        
        if ats_score >= 80:
            score_desc = 'excellent'
        elif ats_score >= 60:
            score_desc = 'good'
        else:
            score_desc = 'needs improvement'
        
        return f"Resume shows {experience.lower()} with {education.lower()}. Detected {skill_count} technical skills. ATS compatibility is {score_desc} ({ats_score}/100)."

if __name__ == '__main__':
    # Test the analyzer
    analyzer = ResumeAnalyzer()
    print("Resume Analyzer initialized successfully")
