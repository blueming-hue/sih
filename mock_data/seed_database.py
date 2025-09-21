#!/usr/bin/env python3
"""
Database seeding script for the Digital Psychological Intervention System.
This script populates the Firestore database with mock data for testing and development.
"""

import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class DatabaseSeeder:
    def __init__(self):
        """Initialize the database seeder with Firebase connection."""
        try:
            # Initialize Firebase
            if os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY'):
                cred = credentials.Certificate(json.loads(os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')))
            else:
                cred = credentials.Certificate('firebase-service-account.json')
            
            firebase_admin.initialize_app(cred)
            self.db = firestore.client()
            print("✅ Firebase initialized successfully")
        except Exception as e:
            print(f"❌ Firebase initialization failed: {e}")
            self.db = None
    
    def seed_users(self, count: int = 50) -> List[str]:
        """Seed the database with mock users."""
        if not self.db:
            return []
        
        user_ids = []
        first_names = ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'Chris', 'Amy', 'Alex', 'Jordan']
        last_names = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Garcia', 'Martinez', 'Anderson']
        colleges = ['University of Technology', 'State University', 'Community College', 'Technical Institute']
        years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']
        interests = ['Computer Science', 'Psychology', 'Engineering', 'Art', 'Music', 'Sports', 'Reading', 'Gaming']
        
        for i in range(count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            college = random.choice(colleges)
            year = random.choice(years)
            user_interests = random.sample(interests, random.randint(2, 4))
            
            user_data = {
                'email': f'{first_name.lower()}.{last_name.lower()}@university.edu',
                'displayName': f'{first_name} {last_name}',
                'role': 'student',
                'collegeEmail': f'{first_name.lower()}.{last_name.lower()}@university.edu',
                'collegeName': college,
                'year': year,
                'phone': f'555-{random.randint(1000, 9999)}',
                'profile': {
                    'age': random.randint(18, 25),
                    'gender': random.choice(['Male', 'Female', 'Other']),
                    'interests': user_interests
                },
                'createdAt': datetime.now() - timedelta(days=random.randint(1, 365)),
                'isVerified': True
            }
            
            # Add user to Firestore
            doc_ref = self.db.collection('users').add(user_data)
            user_ids.append(doc_ref[1].id)
            print(f"✅ Created user: {first_name} {last_name}")
        
        return user_ids
    
    def seed_counsellors(self, count: int = 10) -> List[str]:
        """Seed the database with mock counsellors."""
        if not self.db:
            return []
        
        counsellor_ids = []
        first_names = ['Dr. Sarah', 'Dr. Michael', 'Dr. Emily', 'Dr. James', 'Dr. Lisa']
        last_names = ['Johnson', 'Chen', 'Rodriguez', 'Wilson', 'Brown']
        specializations = [
            'Anxiety & Stress Management',
            'Depression & Mood Disorders',
            'Academic Stress & Career Counseling',
            'Relationship & Social Issues',
            'Trauma & PTSD'
        ]
        
        for i in range(count):
            first_name = random.choice(first_names)
            last_name = random.choice(last_names)
            specialization = random.choice(specializations)
            
            counsellor_data = {
                'email': f'{first_name.lower()}.{last_name.lower()}@university.edu',
                'displayName': f'{first_name} {last_name}',
                'role': 'counsellor',
                'specialization': specialization,
                'experience': f'{random.randint(3, 15)} years',
                'rating': round(random.uniform(4.0, 5.0), 1),
                'availableSlots': random.sample([
                    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
                ], random.randint(4, 8)),
                'createdAt': datetime.now() - timedelta(days=random.randint(30, 365)),
                'isVerified': True
            }
            
            doc_ref = self.db.collection('users').add(counsellor_data)
            counsellor_ids.append(doc_ref[1].id)
            print(f"✅ Created counsellor: {first_name} {last_name}")
        
        return counsellor_ids
    
    def seed_appointments(self, user_ids: List[str], counsellor_ids: List[str], count: int = 100):
        """Seed the database with mock appointments."""
        if not self.db:
            return
        
        reasons = ['anxiety', 'depression', 'academic', 'relationships', 'other']
        session_types = ['video', 'phone', 'in-person']
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        
        for i in range(count):
            student_id = random.choice(user_ids)
            counsellor_id = random.choice(counsellor_ids)
            appointment_date = datetime.now() + timedelta(days=random.randint(1, 30))
            
            appointment_data = {
                'studentId': student_id,
                'studentName': f'Student {i+1}',
                'studentEmail': f'student{i+1}@university.edu',
                'counsellorId': counsellor_id,
                'counsellorName': f'Dr. Counsellor {i+1}',
                'appointmentDate': appointment_date.strftime('%Y-%m-%d'),
                'appointmentTime': random.choice(['09:00', '10:00', '11:00', '14:00', '15:00', '16:00']),
                'sessionType': random.choice(session_types),
                'duration': '50 minutes',
                'status': random.choice(statuses),
                'reason': random.choice(reasons),
                'urgency': random.choice(['low', 'medium', 'high']),
                'previousCounseling': random.choice(['yes', 'no']),
                'notes': f'Mock appointment notes for appointment {i+1}',
                'createdAt': datetime.now() - timedelta(days=random.randint(1, 30))
            }
            
            self.db.collection('appointments').add(appointment_data)
            print(f"✅ Created appointment {i+1}")
    
    def seed_forum_posts(self, user_ids: List[str], count: int = 50):
        """Seed the database with mock forum posts."""
        if not self.db:
            return
        
        categories = ['academic_stress', 'anxiety', 'depression', 'sleep', 'relationships', 'general']
        titles = [
            'Feeling overwhelmed with finals',
            'Tips for managing anxiety',
            'Sleep issues during exam period',
            'Dealing with homesickness',
            'Building better study habits',
            'Coping with rejection',
            'Managing time effectively',
            'Dealing with peer pressure'
        ]
        
        for i in range(count):
            user_id = random.choice(user_ids)
            title = random.choice(titles)
            category = random.choice(categories)
            
            post_data = {
                'userId': user_id,
                'username': f'AnonymousStudent{random.randint(1, 1000)}',
                'title': title,
                'content': f'This is a mock forum post about {category}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                'category': category,
                'likes': random.randint(0, 50),
                'comments': random.randint(0, 20),
                'createdAt': datetime.now() - timedelta(days=random.randint(1, 90)),
                'tags': [category, 'support', 'community']
            }
            
            self.db.collection('forum_posts').add(post_data)
            print(f"✅ Created forum post {i+1}")
    
    def seed_journal_entries(self, user_ids: List[str], count: int = 200):
        """Seed the database with mock journal entries."""
        if not self.db:
            return
        
        titles = [
            'Feeling better today',
            'Struggling with anxiety',
            'Grateful for support',
            'Had a good day',
            'Feeling overwhelmed',
            'Making progress',
            'Need to talk to someone',
            'Feeling hopeful'
        ]
        
        for i in range(count):
            user_id = random.choice(user_ids)
            title = random.choice(titles)
            
            entry_data = {
                'userId': user_id,
                'title': title,
                'content': f'This is a mock journal entry. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                'mood': random.randint(1, 10),
                'tags': random.sample(['positive', 'negative', 'neutral', 'anxiety', 'stress', 'happy', 'sad'], random.randint(1, 3)),
                'createdAt': datetime.now() - timedelta(days=random.randint(1, 180))
            }
            
            self.db.collection('journal_entries').add(entry_data)
            print(f"✅ Created journal entry {i+1}")
    
    def seed_resources(self, count: int = 30):
        """Seed the database with mock resources."""
        if not self.db:
            return
        
        categories = ['academic_stress', 'anxiety', 'depression', 'sleep', 'relationships']
        types = ['article', 'video', 'audio', 'guide']
        titles = [
            'Managing Exam Stress',
            'Breathing Exercises for Anxiety',
            'Sleep Hygiene Tips',
            'Depression Support Resources',
            'Building Healthy Relationships',
            'Time Management Strategies',
            'Mindfulness and Meditation',
            'Coping with Rejection'
        ]
        
        for i in range(count):
            title = random.choice(titles)
            category = random.choice(categories)
            resource_type = random.choice(types)
            
            resource_data = {
                'title': title,
                'description': f'A comprehensive resource about {category}. This resource provides valuable information and strategies.',
                'type': resource_type,
                'category': category,
                'url': f'https://example.com/{category}-{i+1}',
                'language': 'English',
                'tags': [category, 'support', 'mental-health'],
                'createdAt': datetime.now() - timedelta(days=random.randint(1, 365)),
                'views': random.randint(10, 500)
            }
            
            self.db.collection('resources').add(resource_data)
            print(f"✅ Created resource {i+1}")
    
    def seed_assessments(self, user_ids: List[str], count: int = 100):
        """Seed the database with mock assessments."""
        if not self.db:
            return
        
        assessment_types = ['PHQ-9', 'GAD-7']
        
        for i in range(count):
            user_id = random.choice(user_ids)
            assessment_type = random.choice(assessment_types)
            
            # Generate random responses
            if assessment_type == 'PHQ-9':
                responses = [random.randint(0, 3) for _ in range(9)]
            else:  # GAD-7
                responses = [random.randint(0, 3) for _ in range(7)]
            
            score = sum(responses)
            
            # Determine severity
            if assessment_type == 'PHQ-9':
                if score < 5:
                    severity = 'minimal'
                elif score < 10:
                    severity = 'mild'
                elif score < 15:
                    severity = 'moderate'
                elif score < 20:
                    severity = 'moderately_severe'
                else:
                    severity = 'severe'
            else:  # GAD-7
                if score < 5:
                    severity = 'minimal'
                elif score < 10:
                    severity = 'mild'
                elif score < 15:
                    severity = 'moderate'
                else:
                    severity = 'severe'
            
            assessment_data = {
                'userId': user_id,
                'type': assessment_type,
                'responses': responses,
                'score': score,
                'severity': severity,
                'recommendations': [
                    'Self-help strategies and monitoring',
                    'Consider counseling',
                    'Learn coping techniques'
                ],
                'createdAt': datetime.now() - timedelta(days=random.randint(1, 90))
            }
            
            self.db.collection('assessments').add(assessment_data)
            print(f"✅ Created {assessment_type} assessment {i+1}")
    
    def seed_all(self):
        """Seed the database with all mock data."""
        print("🌱 Starting database seeding...")
        
        # Seed users and counsellors
        print("\n👥 Seeding users...")
        user_ids = self.seed_users(50)
        
        print("\n👨‍⚕️ Seeding counsellors...")
        counsellor_ids = self.seed_counsellors(10)
        
        # Seed other data
        print("\n📅 Seeding appointments...")
        self.seed_appointments(user_ids, counsellor_ids, 100)
        
        print("\n💬 Seeding forum posts...")
        self.seed_forum_posts(user_ids, 50)
        
        print("\n📝 Seeding journal entries...")
        self.seed_journal_entries(user_ids, 200)
        
        print("\n📚 Seeding resources...")
        self.seed_resources(30)
        
        print("\n📊 Seeding assessments...")
        self.seed_assessments(user_ids, 100)
        
        print("\n✅ Database seeding completed successfully!")
        print(f"📈 Created:")
        print(f"   - {len(user_ids)} users")
        print(f"   - {len(counsellor_ids)} counsellors")
        print(f"   - 100 appointments")
        print(f"   - 50 forum posts")
        print(f"   - 200 journal entries")
        print(f"   - 30 resources")
        print(f"   - 100 assessments")

def main():
    """Main function to run the database seeder."""
    seeder = DatabaseSeeder()
    
    if seeder.db:
        seeder.seed_all()
    else:
        print("❌ Cannot seed database - Firebase not initialized")

if __name__ == '__main__':
    main()
