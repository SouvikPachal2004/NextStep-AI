from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class JobMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english')
    
    def calculate_skill_match(self, user_skills: List[str], job_skills: List[str]) -> float:
        """Calculate skill match percentage"""
        if not user_skills or not job_skills:
            return 0.0
        
        user_skills_lower = [skill.lower() for skill in user_skills]
        job_skills_lower = [skill.lower() for skill in job_skills]
        
        matching_skills = set(user_skills_lower) & set(job_skills_lower)
        match_percentage = (len(matching_skills) / len(job_skills_lower)) * 100
        
        return round(match_percentage, 2)
    
    def calculate_text_similarity(self, text1: str, text2: str) -> float:
        """Calculate text similarity using TF-IDF and cosine similarity"""
        try:
            tfidf_matrix = self.vectorizer.fit_transform([text1, text2])
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            return round(similarity * 100, 2)
        except:
            return 0.0
    
    def calculate_matches(self, user_skills: List[str], jobs: List[Dict]) -> List[Dict]:
        """Calculate match scores for multiple jobs"""
        matches = []
        
        for job in jobs:
            job_skills = job.get('skills', [])
            skill_match = self.calculate_skill_match(user_skills, job_skills)
            
            # Calculate overall match score
            match_score = skill_match
            
            matches.append({
                'jobId': job.get('_id') or job.get('id'),
                'title': job.get('title'),
                'matchScore': match_score,
                'matchingSkills': list(set([s.lower() for s in user_skills]) & set([s.lower() for s in job_skills]))
            })
        
        # Sort by match score descending
        matches.sort(key=lambda x: x['matchScore'], reverse=True)
        
        return matches
    
    def recommend_jobs(self, user_profile: Dict, available_jobs: List[Dict], top_n: int = 10) -> List[Dict]:
        """Recommend top N jobs based on user profile"""
        user_skills = user_profile.get('skills', [])
        user_courses = user_profile.get('completedCourses', [])
        
        # Extract skills from completed courses
        course_skills = []
        for course in user_courses:
            course_skills.extend(course.get('skills', []))
        
        # Combine all user skills
        all_user_skills = list(set(user_skills + course_skills))
        
        # Calculate matches
        matches = self.calculate_matches(all_user_skills, available_jobs)
        
        # Filter jobs with match score > 50%
        recommended = [m for m in matches if m['matchScore'] >= 50]
        
        # Return top N recommendations
        return recommended[:top_n]
    
    def get_skill_gaps(self, user_skills: List[str], job_skills: List[str]) -> List[str]:
        """Identify skill gaps between user and job requirements"""
        user_skills_lower = [skill.lower() for skill in user_skills]
        job_skills_lower = [skill.lower() for skill in job_skills]
        
        missing_skills = set(job_skills_lower) - set(user_skills_lower)
        
        return sorted(list(missing_skills))
    
    def suggest_courses(self, skill_gaps: List[str], available_courses: List[Dict]) -> List[Dict]:
        """Suggest courses to fill skill gaps"""
        suggestions = []
        
        for course in available_courses:
            course_skills = [s.lower() for s in course.get('skills', [])]
            
            # Check if course teaches any of the missing skills
            relevant_skills = set(skill_gaps) & set(course_skills)
            
            if relevant_skills:
                suggestions.append({
                    'courseId': course.get('_id') or course.get('id'),
                    'title': course.get('title'),
                    'relevantSkills': list(relevant_skills),
                    'relevanceScore': len(relevant_skills)
                })
        
        # Sort by relevance score
        suggestions.sort(key=lambda x: x['relevanceScore'], reverse=True)
        
        return suggestions

if __name__ == '__main__':
    # Test the matcher
    matcher = JobMatcher()
    print("Job Matcher initialized successfully")
