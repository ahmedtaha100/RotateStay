import dotenv from 'dotenv';

const result = dotenv.config();
if (result.error && result.error.code !== 'ENOENT') {
  throw result.error;
}

const nodeEnv = process.env.NODE_ENV || 'development';

if (!process.env.JWT_SECRET) {
  if (nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in the environment before starting the server.');
  }

  process.env.JWT_SECRET = 'rotate-stay-development-secret';
  console.warn('\u26a0\ufe0f  No JWT_SECRET provided. Using a built-in development secret.');
}

if (!process.env.CLIENT_URL) {
  process.env.CLIENT_URL = 'http://localhost:5173';
}

const allowNonEduEnv = process.env.ALLOW_NON_EDU_EMAILS;
const allowNonEduEmails =
  typeof allowNonEduEnv === 'string'
    ? ['1', 'true', 'yes', 'on'].includes(allowNonEduEnv.toLowerCase())
    : nodeEnv !== 'production';

export const env = {
  nodeEnv,
  port: Number.parseInt(process.env.PORT ?? '5000', 10) || 5000,
  clientUrl: process.env.CLIENT_URL,
  jwtSecret: process.env.JWT_SECRET,
  allowNonEduEmails,
};

export default env;
