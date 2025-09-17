export const sendVerificationEmail = async (to, token) => {
  // For development, just log to console
  console.log(`📧 Verification email would be sent to: ${to}`);
  console.log(`🔗 Verification token: ${token}`);
  return true;
};
