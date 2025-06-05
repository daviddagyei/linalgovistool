import React from 'react';
import { Github, BookOpen, Share2, Sigma } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-3 px-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center bg-white bg-opacity-20 rounded-lg w-8 h-8">
            <Sigma className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold">Linear Algebra Visualizer</h1>
        </div>
        
        <nav>
          <ul className="flex space-x-2">
            <li>
              <button className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors">
                <BookOpen size={16} className="mr-1" />
                <span className="hidden sm:inline text-sm">Docs</span>
              </button>
            </li>
            <li>
              <button className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors">
                <Share2 size={16} className="mr-1" />
                <span className="hidden sm:inline text-sm">Share</span>
              </button>
            </li>
            <li>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center p-1.5 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                <Github size={16} className="mr-1" />
                <span className="hidden sm:inline text-sm">GitHub</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;