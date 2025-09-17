import env from '../config/env.js';

const EDU_DOMAINS = ['.edu', '.ac.uk', '.edu.au', '.edu.ca'];

export const validateEduEmail = (email = '') => {
  if (env.allowNonEduEmails) {
    return true;
  }

  const normalized = email.toLowerCase().trim();
  return EDU_DOMAINS.some((domain) => normalized.endsWith(domain));
};
