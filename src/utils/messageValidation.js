// Message validation and content filtering utilities

const INAPPROPRIATE_WORDS = [
  // Profanity and offensive terms (basic list - in production use a comprehensive service)
  'fuck', 'shit', 'damn', 'bitch', 'ass', 'bastard',
  // Self-harm indicators (to flag for immediate support)
  'kill myself', 'suicide', 'end it all', 'want to die',
  // Harassment terms
  'idiot', 'stupid', 'moron', 'loser'
];

const CRISIS_KEYWORDS = [
  'kill myself', 'suicide', 'want to die', 'end it all', 'hurt myself',
  'self harm', 'cut myself', 'overdose', 'pills', 'bridge', 'rope',
  'gun', 'knife', 'blade', 'razor', 'not worth living'
];

const PERSONAL_INFO_PATTERNS = [
  // Phone numbers
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  // Social media handles
  /@[A-Za-z0-9_]+/,
  // URLs
  /https?:\/\/[^\s]+/
];

export const validateMessage = (message) => {
  const errors = [];

  if (!message || typeof message !== 'string') {
    errors.push('Message must be a valid string');
    return { isValid: false, errors };
  }

  const trimmedMessage = message.trim();

  if (trimmedMessage.length === 0) {
    errors.push('Message cannot be empty');
  }

  if (trimmedMessage.length > 1000) {
    errors.push('Message must be less than 1000 characters');
  }

  if (trimmedMessage.length < 1) {
    errors.push('Message must be at least 1 character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const checkForInappropriateContent = (message) => {
  const lowerMessage = message.toLowerCase();
  const findings = {
    hasInappropriateContent: false,
    hasCrisisContent: false,
    hasPersonalInfo: false,
    flaggedWords: [],
    crisisKeywords: [],
    personalInfoFound: []
  };

  // Check for inappropriate words
  INAPPROPRIATE_WORDS.forEach(word => {
    if (lowerMessage.includes(word.toLowerCase())) {
      findings.hasInappropriateContent = true;
      findings.flaggedWords.push(word);
    }
  });

  // Check for crisis keywords
  CRISIS_KEYWORDS.forEach(keyword => {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      findings.hasCrisisContent = true;
      findings.crisisKeywords.push(keyword);
    }
  });

  // Check for personal information
  PERSONAL_INFO_PATTERNS.forEach(pattern => {
    const matches = message.match(pattern);
    if (matches) {
      findings.hasPersonalInfo = true;
      findings.personalInfoFound.push(...matches);
    }
  });

  return findings;
};

export const filterMessage = (message) => {
  let filteredMessage = message;

  // Replace inappropriate words with asterisks
  INAPPROPRIATE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filteredMessage = filteredMessage.replace(regex, '*'.repeat(word.length));
  });

  // Remove personal information patterns
  PERSONAL_INFO_PATTERNS.forEach(pattern => {
    filteredMessage = filteredMessage.replace(pattern, '[PERSONAL INFO REMOVED]');
  });

  return filteredMessage;
};

export const shouldBlockMessage = (contentCheck) => {
  // Block messages with excessive inappropriate content
  if (contentCheck.flaggedWords.length > 2) {
    return true;
  }

  // Don't block crisis messages - flag them for immediate attention instead
  return false;
};

export const shouldFlagForReview = (contentCheck) => {
  return (
    contentCheck.hasInappropriateContent ||
    contentCheck.hasCrisisContent ||
    contentCheck.hasPersonalInfo
  );
};

export const getCrisisResources = () => {
  return {
    message: "We noticed you might be going through a difficult time. Please reach out for help:",
    resources: [
      {
        name: "National Suicide Prevention Lifeline",
        number: "988",
        description: "24/7 crisis support"
      },
      {
        name: "Crisis Text Line",
        number: "Text HOME to 741741",
        description: "24/7 text support"
      },
      {
        name: "Campus Counseling Center",
        number: "Your campus emergency number",
        description: "Immediate campus support"
      }
    ]
  };
};