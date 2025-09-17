import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const verifyEducationalEmail = (email) => {
  const eduDomains = ['.edu', '.ac.uk', '.edu.au', '.edu.ca'];
  return eduDomains.some((domain) => email?.toLowerCase().endsWith(domain));
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
