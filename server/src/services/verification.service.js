import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyWithSheerID = async (schoolEmail, schoolName) => {
  try {
    const response = await axios.post('https://api.sheerid.com/verify', {
      email: schoolEmail,
      organization: schoolName
    }, {
      headers: {
        Authorization: `Bearer ${process.env.SHEERID_API_KEY}`
      }
    });
    return response.data?.verified ?? false;
  } catch (error) {
    console.error('SheerID verification failed:', error.message);
    return false;
  }
};

export const manualVerification = async (userId, documentUrl) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      schoolIdDocument: documentUrl,
      schoolIdVerified: false
    }
  });
};

export const verifyEducationalEmail = (email) => {
  const eduDomains = ['.edu', '.ac.uk', '.edu.au', '.edu.ca'];
  return eduDomains.some((domain) => email?.toLowerCase().endsWith(domain));
};
