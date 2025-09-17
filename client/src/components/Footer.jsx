import React from 'react';

const Footer = () => {
  return (
    <footer className="mt-auto bg-dark-900 border-t border-dark-700 py-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center text-sm text-gray-400">
          <p>© 2024 RotateStay. All rights reserved.</p>
          <p className="mt-2">
            Co-founded by{' '}
            <a
              href="https://ahmedtaha.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Ahmed Taha
            </a>
            {' and '}
            <a
              href="https://www.linkedin.com/in/hosam-arammash-968983331/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Hosam Arammash
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
