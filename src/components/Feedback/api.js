// src/components/Feedback/api.js

const getBaseUrl = () => {
  // Only use window.location when in browser context
  if (typeof window === 'undefined') {
    return '/api/feedback';
  }

  const hostname = window.location.hostname;

  // Local development - Docusaurus on 3000, feedback server on 3002
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002/api/feedback';
  }

  // Production - both services behind same domain
  return '/api/feedback';
}

export const FeedbackType = {
  LIKE: 'like',
  DISLIKE: 'dislike'
}

export const LikeOptions = {
  ACCURATE: 'Accurately describes the platform',
  RESOLVE_ISSUE: 'Helped me resolve an issue',
  EASY_TO_FOLLOW: 'Easy to follow and comprehend',
  CLEAR_CODE_SAMPLES: 'Code samples were clear',
  ADOPT_PLATFORM: 'Convinced me to adopt the platform',
  POSITIVE_ANOTHER_REASON: 'Provide details'
};

export const DislikeOptions = {
  INACCURATE: 'Doesn\'t accurately describe the platform',
  NOT_FOUND: 'Couldn\'t find what I was looking for',
  MISSING_INFO: 'Missing important information',
  HARD_TO_UNDERSTAND: 'Hard to understand',
  COMPLICATED: 'Too complicated or unclear',
  CODE_ERRORS: 'Code sample errors',
  NEGATIVE_ANOTHER_REASON: 'Provide details'
};

export const submitFeedback = async (payload) => {
  const url = `${getBaseUrl()}/submit`;
  console.log('Submitting feedback to:', url);
  console.log('Payload:', payload);

  try {
      const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
              'Content-Type': 'application/json'
          }
      });

      if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', errorText);
          throw new Error(`Server responded with ${response.status}`);
      }

      const result = await response.json();
      console.log('Submit success:', result);
      return result;
  } catch (error) {
      console.error('Submit error:', error);
      throw error;
  }
}

export const getFeedbackData = async () => {
  const response = await fetch(getBaseUrl());
  if (!response.ok) throw response;
  return response.json();
}
