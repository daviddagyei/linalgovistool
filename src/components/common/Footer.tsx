import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white py-2 px-4 text-xs">
      <div className="container mx-auto flex justify-between items-center">
        <p>© 2025 Linear Algebra Visualizer</p>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-blue-300 transition-colors">About</a>
          <a href="#" className="hover:text-blue-300 transition-colors">Docs</a>
          <a href="#" className="hover:text-blue-300 transition-colors">Privacy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;