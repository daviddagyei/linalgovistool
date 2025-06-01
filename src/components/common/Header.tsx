import React from 'react';
import { Github, BookOpen, Share2 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-white bg-opacity-20 rounded-lg w-10 h-10">
            <span className="font-bold text-xl">∑</span>
          </div>
          <h1 className="text-xl font-bold">Linear Algebra Visualizer</h1>
        </div>
        
        <nav>
          <ul className="flex space-x-4">
            <li>
              <button className="flex items-center px-3 py-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors">
                <BookOpen size={18} className="mr-1" />
                <span className="hidden sm:inline">Documentation</span>
              </button>
            </li>
            <li>
              <button className="flex items-center px-3 py-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors">
                <Share2 size={18} className="mr-1" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </li>
            <li>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-3 py-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <Github size={18} className="mr-1" />
                <span className="hidden sm:inline">GitHub</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;