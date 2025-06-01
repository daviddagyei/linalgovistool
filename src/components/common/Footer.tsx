import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-4 px-6 border-t border-gray-200 mt-auto">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600">
        <div className="mb-2 sm:mb-0">
          <p>© 2025 Linear Algebra Visualizer</p>
        </div>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-blue-600 transition-colors">About</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Documentation</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Feedback</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;