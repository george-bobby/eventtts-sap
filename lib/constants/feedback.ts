export interface DefaultQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'nps';
  required: boolean;
  description: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

export const DEFAULT_FEEDBACK_QUESTIONS: DefaultQuestion[] = [
  {
    id: 'overallSatisfaction',
    question: 'How satisfied were you with the overall event?',
    type: 'rating',
    required: true,
    description: 'Overall satisfaction rating (1-5 stars)',
    min: 1,
    max: 5
  },
  {
    id: 'contentQuality',
    question: 'How would you rate the quality of the content?',
    type: 'rating',
    required: true,
    description: 'Content quality rating (1-5 stars)',
    min: 1,
    max: 5
  },
  {
    id: 'organizationRating',
    question: 'How well was the event organized?',
    type: 'rating',
    required: true,
    description: 'Organization rating (1-5 stars)',
    min: 1,
    max: 5
  },
  {
    id: 'venueRating',
    question: 'How would you rate the venue/platform?',
    type: 'rating',
    required: false,
    description: 'Venue rating (1-5 stars) - shown for physical events',
    min: 1,
    max: 5
  },
  {
    id: 'recommendationScore',
    question: 'How likely are you to recommend this event to others?',
    type: 'nps',
    required: true,
    description: 'Net Promoter Score (1-10)',
    min: 1,
    max: 10
  },
  {
    id: 'likedMost',
    question: 'What did you like most about the event?',
    type: 'text',
    required: false,
    description: 'Open-ended feedback about positive aspects',
    placeholder: 'Tell us what you enjoyed...'
  },
  {
    id: 'improvements',
    question: 'What could be improved for future events?',
    type: 'text',
    required: false,
    description: 'Suggestions for improvement',
    placeholder: 'Share your suggestions...'
  },
  {
    id: 'additionalComments',
    question: 'Any additional comments or feedback?',
    type: 'text',
    required: false,
    description: 'General comments and feedback',
    placeholder: 'Any other thoughts...'
  }
];

export const getDefaultQuestionsForEvent = (isOnline: boolean): DefaultQuestion[] => {
  return DEFAULT_FEEDBACK_QUESTIONS.filter(q => {
    // Hide venue rating for online events
    if (q.id === 'venueRating' && isOnline) {
      return false;
    }
    return true;
  });
};
