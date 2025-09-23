import { createVolunteerProfile } from '../firebase/firestore';

// Sample volunteers to initialize the database
const sampleVolunteers = [
  {
    userId: 'volunteer_1',
    name: 'Alex Chen',
    email: 'alex.chen@university.edu',
    specialties: ['Anxiety', 'Academic Stress'],
    description: 'Specializes in helping students with anxiety and academic pressure. Always here to listen.',
    experience: '2 years',
    certifications: ['Mental Health First Aid', 'Peer Support Certification']
  },
  {
    userId: 'volunteer_2',
    name: 'Sam Rodriguez',
    email: 'sam.rodriguez@university.edu',
    specialties: ['Depression', 'Relationships'],
    description: 'Experienced in supporting students through depression and relationship challenges.',
    experience: '1.5 years',
    certifications: ['Crisis Intervention', 'Active Listening']
  },
  {
    userId: 'volunteer_3',
    name: 'Jordan Kim',
    email: 'jordan.kim@university.edu',
    specialties: ['Self-Harm', 'Crisis Support'],
    description: 'Crisis intervention specialist. Trained in helping students with self-harm thoughts.',
    experience: '3 years',
    certifications: ['Crisis Intervention', 'Suicide Prevention', 'Mental Health First Aid']
  },
  {
    userId: 'volunteer_4',
    name: 'Casey Taylor',
    email: 'casey.taylor@university.edu',
    specialties: ['Sleep Issues', 'Stress Management'],
    description: 'Helps students develop healthy sleep patterns and stress management techniques.',
    experience: '1 year',
    certifications: ['Stress Management', 'Sleep Hygiene Counseling']
  },
  {
    userId: 'volunteer_5',
    name: 'Morgan Lee',
    email: 'morgan.lee@university.edu',
    specialties: ['LGBTQ+ Support', 'Identity Issues'],
    description: 'Peer support specialist for LGBTQ+ students and identity-related concerns.',
    experience: '2.5 years',
    certifications: ['LGBTQ+ Peer Support', 'Cultural Competency']
  }
];

export const initializeVolunteers = async () => {
  try {
    console.log('Initializing sample volunteers...');

    for (const volunteer of sampleVolunteers) {
      const result = await createVolunteerProfile(volunteer);
      if (result.success) {
        console.log(`Created volunteer: ${volunteer.name}`);
      } else {
        console.error(`Failed to create volunteer ${volunteer.name}:`, result.error);
      }
    }

    console.log('Volunteer initialization completed');
    return { success: true };
  } catch (error) {
    console.error('Error initializing volunteers:', error);
    return { success: false, error: error.message };
  }
};

// Function to call from browser console for testing
window.initializeVolunteers = initializeVolunteers;