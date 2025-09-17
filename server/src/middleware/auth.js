import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        schoolIdVerified: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

export const requireVerification = async (req, res, next) => {
  if (!req.user.emailVerified || !req.user.schoolIdVerified) {
    return res.status(403).json({
      error: 'Account verification required',
      emailVerified: req.user.emailVerified,
      schoolIdVerified: req.user.schoolIdVerified
    });
  }
  next();
};
