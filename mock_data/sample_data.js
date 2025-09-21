// Mock data for testing the Digital Psychological Intervention System

export const mockUsers = [
  {
    uid: 'user1',
    email: 'john.doe@university.edu',
    displayName: 'John Doe',
    role: 'student',
    collegeEmail: 'john.doe@university.edu',
    collegeName: 'University of Technology',
    year: '3rd Year',
    phone: '555-0123',
    profile: {
      age: 20,
      gender: 'Male',
      interests: ['Computer Science', 'Music', 'Sports']
    },
    createdAt: new Date('2024-01-15'),
    isVerified: true
  },
  {
    uid: 'user2',
    email: 'sarah.smith@university.edu',
    displayName: 'Sarah Smith',
    role: 'student',
    collegeEmail: 'sarah.smith@university.edu',
    collegeName: 'University of Technology',
    year: '2nd Year',
    phone: '555-0124',
    profile: {
      age: 19,
      gender: 'Female',
      interests: ['Psychology', 'Art', 'Reading']
    },
    createdAt: new Date('2024-01-20'),
    isVerified: true
  },
  {
    uid: 'user3',
    email: 'mike.johnson@university.edu',
    displayName: 'Mike Johnson',
    role: 'student',
    collegeEmail: 'mike.johnson@university.edu',
    collegeName: 'University of Technology',
    year: '4th Year',
    phone: '555-0125',
    profile: {
      age: 22,
      gender: 'Male',
      interests: ['Engineering', 'Gaming', 'Photography']
    },
    createdAt: new Date('2024-01-10'),
    isVerified: true
  },
  {
    uid: 'counsellor1',
    email: 'dr.sarah.johnson@university.edu',
    displayName: 'Dr. Sarah Johnson',
    role: 'counsellor',
    specialization: 'Anxiety & Stress Management',
    experience: '8 years',
    rating: 4.9,
    availableSlots: ['09:00', '10:00', '14:00', '15:00'],
    createdAt: new Date('2023-06-01'),
    isVerified: true
  },
  {
    uid: 'counsellor2',
    email: 'dr.michael.chen@university.edu',
    displayName: 'Dr. Michael Chen',
    role: 'counsellor',
    specialization: 'Depression & Mood Disorders',
    experience: '12 years',
    rating: 4.8,
    availableSlots: ['11:00', '13:00', '16:00', '17:00'],
    createdAt: new Date('2023-06-01'),
    isVerified: true
  },
  {
    uid: 'admin1',
    email: 'admin@university.edu',
    displayName: 'System Administrator',
    role: 'admin',
    createdAt: new Date('2023-01-01'),
    isVerified: true
  }
];

export const mockAppointments = [
  {
    id: 'apt1',
    studentId: 'user1',
    studentName: 'John Doe',
    studentEmail: 'john.doe@university.edu',
    counsellorId: 'counsellor1',
    counsellorName: 'Dr. Sarah Johnson',
    appointmentDate: '2024-02-15',
    appointmentTime: '10:00',
    sessionType: 'video',
    duration: '50 minutes',
    status: 'confirmed',
    reason: 'anxiety',
    urgency: 'medium',
    previousCounseling: 'no',
    notes: 'Feeling anxious about upcoming exams',
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'apt2',
    studentId: 'user2',
    studentName: 'Sarah Smith',
    studentEmail: 'sarah.smith@university.edu',
    counsellorId: 'counsellor2',
    counsellorName: 'Dr. Michael Chen',
    appointmentDate: '2024-02-16',
    appointmentTime: '14:00',
    sessionType: 'in-person',
    duration: '50 minutes',
    status: 'pending',
    reason: 'depression',
    urgency: 'high',
    previousCounseling: 'yes',
    notes: 'Ongoing treatment for depression',
    createdAt: new Date('2024-02-12')
  },
  {
    id: 'apt3',
    studentId: 'user3',
    studentName: 'Mike Johnson',
    studentEmail: 'mike.johnson@university.edu',
    counsellorId: 'counsellor1',
    counsellorName: 'Dr. Sarah Johnson',
    appointmentDate: '2024-02-17',
    appointmentTime: '15:00',
    sessionType: 'phone',
    duration: '50 minutes',
    status: 'completed',
    reason: 'academic',
    urgency: 'low',
    previousCounseling: 'no',
    notes: 'Academic stress management',
    createdAt: new Date('2024-02-08')
  }
];

export const mockForumPosts = [
  {
    id: 'post1',
    userId: 'user1',
    username: 'AnonymousStudent1',
    title: 'Feeling overwhelmed with finals',
    content: 'Anyone else feeling really stressed about upcoming finals? I feel like I can\'t keep up with everything.',
    category: 'academic_stress',
    likes: 12,
    comments: 8,
    createdAt: new Date('2024-02-14'),
    tags: ['finals', 'stress', 'academic']
  },
  {
    id: 'post2',
    userId: 'user2',
    username: 'AnonymousStudent2',
    title: 'Tips for managing anxiety',
    content: 'I\'ve been using some breathing exercises that really help. Would love to share and hear what works for others.',
    category: 'anxiety',
    likes: 25,
    comments: 15,
    createdAt: new Date('2024-02-13'),
    tags: ['anxiety', 'breathing', 'coping']
  },
  {
    id: 'post3',
    userId: 'user3',
    username: 'AnonymousStudent3',
    title: 'Sleep issues during exam period',
    content: 'I\'m having trouble sleeping because of exam stress. Any suggestions for better sleep hygiene?',
    category: 'sleep',
    likes: 18,
    comments: 12,
    createdAt: new Date('2024-02-12'),
    tags: ['sleep', 'exams', 'stress']
  }
];

export const mockJournalEntries = [
  {
    id: 'entry1',
    userId: 'user1',
    title: 'Feeling better today',
    content: 'Had a good day today. Managed to complete my assignments and even had time to go for a walk. Feeling more positive about the upcoming exams.',
    mood: 7,
    tags: ['positive', 'academic', 'exercise'],
    createdAt: new Date('2024-02-14')
  },
  {
    id: 'entry2',
    userId: 'user1',
    title: 'Struggling with anxiety',
    content: 'Feeling really anxious about the presentation tomorrow. Can\'t seem to focus on anything else. Tried some breathing exercises but still feeling overwhelmed.',
    mood: 3,
    tags: ['anxiety', 'presentation', 'overwhelmed'],
    createdAt: new Date('2024-02-13')
  },
  {
    id: 'entry3',
    userId: 'user2',
    title: 'Grateful for support',
    content: 'Really appreciate the support from friends and family during this difficult time. Sometimes it\'s hard to remember that people care, but they really do.',
    mood: 6,
    tags: ['gratitude', 'support', 'friends'],
    createdAt: new Date('2024-02-14')
  }
];

export const mockResources = [
  {
    id: 'res1',
    title: 'Managing Exam Stress',
    description: 'A comprehensive guide to managing stress during exam periods',
    type: 'article',
    category: 'academic_stress',
    url: 'https://example.com/exam-stress-guide',
    language: 'English',
    tags: ['exams', 'stress', 'academic'],
    createdAt: new Date('2024-01-15'),
    views: 245
  },
  {
    id: 'res2',
    title: 'Breathing Exercises for Anxiety',
    description: 'Video tutorial on effective breathing techniques for anxiety management',
    type: 'video',
    category: 'anxiety',
    url: 'https://example.com/breathing-exercises',
    language: 'English',
    tags: ['anxiety', 'breathing', 'video'],
    createdAt: new Date('2024-01-20'),
    views: 189
  },
  {
    id: 'res3',
    title: 'Sleep Hygiene Tips',
    description: 'Audio guide with relaxation techniques for better sleep',
    type: 'audio',
    category: 'sleep',
    url: 'https://example.com/sleep-hygiene',
    language: 'English',
    tags: ['sleep', 'relaxation', 'audio'],
    createdAt: new Date('2024-01-25'),
    views: 156
  },
  {
    id: 'res4',
    title: 'Depression Support Resources',
    description: 'Comprehensive list of resources for depression support and treatment',
    type: 'article',
    category: 'depression',
    url: 'https://example.com/depression-resources',
    language: 'English',
    tags: ['depression', 'support', 'treatment'],
    createdAt: new Date('2024-02-01'),
    views: 98
  }
];

export const mockAssessments = [
  {
    id: 'assess1',
    userId: 'user1',
    type: 'PHQ-9',
    responses: [1, 2, 0, 1, 0, 1, 1, 0, 0],
    score: 6,
    severity: 'mild',
    recommendations: [
      'Self-help strategies and monitoring',
      'Consider brief counseling',
      'Learn stress management techniques'
    ],
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'assess2',
    userId: 'user1',
    type: 'GAD-7',
    responses: [2, 1, 2, 1, 0, 1, 1],
    score: 8,
    severity: 'mild',
    recommendations: [
      'Self-help strategies and monitoring',
      'Consider brief counseling',
      'Learn stress management techniques'
    ],
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'assess3',
    userId: 'user2',
    type: 'PHQ-9',
    responses: [2, 2, 1, 2, 1, 2, 2, 1, 0],
    score: 13,
    severity: 'moderate',
    recommendations: [
      'Professional counseling recommended',
      'Consider therapy sessions (bi-weekly)',
      'Learn coping strategies'
    ],
    createdAt: new Date('2024-02-08')
  }
];

export const mockChatSessions = [
  {
    id: 'session1',
    userId: 'user1',
    type: 'ai_chatbot',
    status: 'active',
    createdAt: new Date('2024-02-14'),
    lastMessageAt: new Date('2024-02-14')
  },
  {
    id: 'session2',
    userId: 'user2',
    type: 'ai_chatbot',
    status: 'completed',
    createdAt: new Date('2024-02-13'),
    lastMessageAt: new Date('2024-02-13')
  }
];

export const mockChatMessages = [
  {
    id: 'msg1',
    sessionId: 'session1',
    text: 'I\'m feeling really anxious about my exams',
    sender: 'user',
    userId: 'user1',
    createdAt: new Date('2024-02-14T10:00:00')
  },
  {
    id: 'msg2',
    sessionId: 'session1',
    text: 'I understand you\'re feeling anxious about your exams. That\'s completely normal, especially during college. Here are some immediate coping strategies:\n\n1. Take 5 deep breaths - inhale for 4 counts, hold for 4, exhale for 6\n2. Try the 5-4-3-2-1 grounding technique\n3. Take a short walk or do some light stretching\n\nWould you like me to guide you through any of these techniques?',
    sender: 'bot',
    userId: 'user1',
    messageType: 'coping_strategy',
    createdAt: new Date('2024-02-14T10:01:00')
  },
  {
    id: 'msg3',
    sessionId: 'session1',
    text: 'Yes, I\'d like to try the breathing exercise',
    sender: 'user',
    userId: 'user1',
    createdAt: new Date('2024-02-14T10:02:00')
  }
];

export const mockNotifications = [
  {
    id: 'notif1',
    userId: 'user1',
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Sarah Johnson is confirmed for Feb 15 at 10:00 AM',
    type: 'appointment',
    read: false,
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'notif2',
    userId: 'user2',
    title: 'New Resource Available',
    message: 'Check out the new article on managing exam stress',
    type: 'resource',
    read: true,
    createdAt: new Date('2024-02-12')
  },
  {
    id: 'notif3',
    userId: 'user1',
    title: 'Forum Reply',
    message: 'Someone replied to your post about exam stress',
    type: 'forum',
    read: false,
    createdAt: new Date('2024-02-14')
  }
];

export const mockAnalytics = {
  totalUsers: 1250,
  activeUsers: 890,
  totalSessions: 3450,
  averageSessionDuration: 25,
  crisisInterventions: 12,
  completedAssessments: 456,
  bookedAppointments: 234,
  forumPosts: 189,
  resourceViews: 1234,
  sentimentTrends: [
    { date: '2024-02-01', positive: 65, negative: 20, neutral: 15 },
    { date: '2024-02-02', positive: 62, negative: 23, neutral: 15 },
    { date: '2024-02-03', positive: 68, negative: 18, neutral: 14 },
    { date: '2024-02-04', positive: 70, negative: 16, neutral: 14 },
    { date: '2024-02-05', positive: 67, negative: 19, neutral: 14 },
    { date: '2024-02-06', positive: 64, negative: 22, neutral: 14 },
    { date: '2024-02-07', positive: 69, negative: 17, neutral: 14 }
  ],
  topConcerns: [
    { concern: 'Academic Stress', count: 45, percentage: 35 },
    { concern: 'Anxiety', count: 38, percentage: 30 },
    { concern: 'Depression', count: 25, percentage: 20 },
    { concern: 'Sleep Issues', count: 15, percentage: 12 },
    { concern: 'Relationship Issues', count: 5, percentage: 3 }
  ],
  userEngagement: {
    dailyActiveUsers: 156,
    weeklyActiveUsers: 890,
    monthlyActiveUsers: 1250,
    averageSessionTime: 25,
    bounceRate: 15
  }
};

// Helper function to generate random mock data
export const generateRandomUser = () => {
  const firstNames = ['John', 'Sarah', 'Mike', 'Emily', 'David', 'Lisa', 'Chris', 'Amy'];
  const lastNames = ['Doe', 'Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Garcia'];
  const colleges = ['University of Technology', 'State University', 'Community College', 'Technical Institute'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate'];
  const interests = ['Computer Science', 'Psychology', 'Engineering', 'Art', 'Music', 'Sports', 'Reading', 'Gaming'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const college = colleges[Math.floor(Math.random() * colleges.length)];
  const year = years[Math.floor(Math.random() * years.length)];
  const userInterests = interests.sort(() => 0.5 - Math.random()).slice(0, 3);
  
  return {
    uid: `user${Date.now()}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${college.toLowerCase().replace(/\s+/g, '')}.edu`,
    displayName: `${firstName} ${lastName}`,
    role: 'student',
    collegeEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${college.toLowerCase().replace(/\s+/g, '')}.edu`,
    collegeName: college,
    year: year,
    phone: `555-${Math.floor(Math.random() * 9000) + 1000}`,
    profile: {
      age: Math.floor(Math.random() * 8) + 18, // 18-25
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      interests: userInterests
    },
    createdAt: new Date(),
    isVerified: true
  };
};

export const generateRandomAssessment = (userId, type = 'PHQ-9') => {
  const responses = type === 'PHQ-9' ? 
    Array(9).fill(0).map(() => Math.floor(Math.random() * 4)) :
    Array(7).fill(0).map(() => Math.floor(Math.random() * 4));
  
  const score = responses.reduce((sum, response) => sum + response, 0);
  
  return {
    id: `assess${Date.now()}`,
    userId: userId,
    type: type,
    responses: responses,
    score: score,
    severity: score < 5 ? 'minimal' : score < 10 ? 'mild' : score < 15 ? 'moderate' : 'severe',
    recommendations: ['Self-help strategies', 'Consider counseling', 'Monitor symptoms'],
    createdAt: new Date()
  };
};

export default {
  mockUsers,
  mockAppointments,
  mockForumPosts,
  mockJournalEntries,
  mockResources,
  mockAssessments,
  mockChatSessions,
  mockChatMessages,
  mockNotifications,
  mockAnalytics,
  generateRandomUser,
  generateRandomAssessment
};
