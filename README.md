# Linalgovistool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-purple.svg)](https://vitejs.dev/)

> **Interactive Linear Algebra Visualization Tool**  
> Making abstract mathematical concepts tangible through dynamic 2D and 3D visualizations

## 🎯 Overview

**Linalgovistool** is a modern, interactive web application designed to help students, educators, and researchers explore linear algebra concepts through intuitive visualizations. Built with React and TypeScript, it provides real-time 2D and 3D visualizations of vectors, matrices, transformations, eigenvalues, subspaces, and basis vectors.

### ✨ Key Features

- 🎨 **Interactive Vector Manipulation** - Create, modify, and perform operations on vectors with real-time feedback
- 🔄 **Matrix Transformations** - Visualize how matrices transform space with live previews
- 📊 **Eigenvalue Analysis** - Explore eigenvalues and eigenvectors with dynamic visualizations
- 🌌 **Subspace Exploration** - Understand spans, planes, and linear independence
- 📐 **Custom Basis Systems** - Switch between different coordinate systems
- 🎮 **2D & 3D Modes** - Toggle between dimensions for comprehensive understanding
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 🔗 **Share & Export** - Share visualizations via URL or export configurations
- 📚 **Built-in Documentation** - Comprehensive guides and tutorials included

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/linalgovistool.git
   cd linalgovistool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to start exploring!

### Building for Production

```bash
npm run build
npm run preview
```

## 🎯 Core Tools & Features

### 1. Vector Tool
- **Create vectors** by specifying x, y, z components
- **Interactive manipulation** via drag-and-drop
- **Vector operations** including addition, subtraction, scalar multiplication
- **Expression builder** for complex vector calculations

### 2. Matrix Transformations
- **Live transformation preview** with before/after states
- **Common presets** (rotation, scaling, shear, reflection)
- **Interactive sliders** for real-time parameter adjustment
- **Determinant visualization** showing area/volume changes

### 3. Eigenvalue Analysis
- **Automatic eigenvalue computation** for 2D and 3D matrices
- **Eigenvector visualization** with scaling factors
- **Real and complex eigenvalue handling**
- **Eigenspace exploration**

### 4. Subspaces & Spans
- **Linear span visualization** for vector sets
- **Independence detection** with automatic highlighting
- **Dimension analysis** (line, plane, space)
- **Interactive vector addition** to spans

### 5. Basis Vectors
- **Standard and custom basis systems**
- **Coordinate transformation** between bases
- **Change of basis visualization**
- **Grid overlay** showing basis vectors

## 🎨 User Interface

### Navigation
- **Tool Selection Bar** - Switch between vector, matrix, eigenvalue, subspace, and basis tools
- **2D/3D Toggle** - Seamlessly switch visualization modes
- **Control Panel** - Context-sensitive controls for each tool
- **Canvas Controls** - Zoom, pan, and reset view options

### Display Options
- **Grid Toggle** - Show/hide coordinate grid
- **Label Toggle** - Display vector coordinates and labels
- **Axes Toggle** - Show/hide coordinate axes
- **Animation Controls** - Smooth transitions and real-time updates

## 🔧 Technical Stack

### Frontend
- **React 18.3.1** - Modern React with hooks and concurrent features
- **TypeScript 5.0** - Type-safe development with IntelliSense
- **Vite 5.0** - Lightning-fast build tool and dev server
- **Three.js** - 3D graphics and WebGL rendering
- **React Three Fiber** - React renderer for Three.js
- **D3.js** - 2D data visualization and SVG manipulation
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Modern icon library

### Mathematical Libraries
- **Math.js** - Comprehensive math library for calculations
- **Custom algorithms** for linear algebra operations
- **Numerical stability** optimizations

### Architecture
- **Context API** - Global state management for visualization data
- **Component composition** - Modular, reusable React components
- **Custom hooks** - Shared logic for mathematical operations
- **Type definitions** - Comprehensive TypeScript interfaces

## 📱 Browser Support

- **Chrome/Chromium** 88+ ✅
- **Firefox** 85+ ✅
- **Safari** 14+ ✅
- **Edge** 88+ ✅

*Requires WebGL support for 3D visualizations*

## 🎓 Educational Use

### For Students
- **Interactive learning** - Manipulate objects to understand concepts
- **Visual feedback** - See immediate results of mathematical operations
- **Progressive complexity** - Start simple, advance to complex topics
- **Self-paced exploration** - Learn at your own speed

### For Educators
- **Classroom presentations** - Project visualizations for group learning
- **Assignment creation** - Save and share specific configurations
- **Concept demonstration** - Show abstract concepts concretely
- **Student engagement** - Interactive tools increase participation

### Topics Covered
- Vector operations and properties
- Linear transformations and matrices
- Eigenvalues and eigenvectors
- Vector spaces and subspaces
- Linear independence and basis
- Change of basis and coordinate systems

## 🔗 Sharing & Collaboration

### URL Sharing
- **Instant sharing** - Generate shareable URLs with current visualization state
- **Social media integration** - Share on Twitter, Facebook, LinkedIn, Reddit
- **Persistent links** - URLs preserve exact visualization configuration

### Configuration Export
- **JSON export** - Download complete visualization settings
- **Import functionality** - Load saved configurations
- **Cross-platform compatibility** - Share files between devices
- **Educational materials** - Create reusable lesson configurations

## 🛠️ Development

### Project Structure
```
src/
├── components/          # React components
│   ├── common/         # Header, Footer, shared components
│   ├── controls/       # Tool-specific control panels
│   ├── ui/            # Modal, Tooltip, UI components
│   └── visualizations/ # Canvas components for 2D/3D
├── context/            # React Context for state management
├── types/              # TypeScript type definitions
├── utils/              # Mathematical utilities and helpers
└── services/           # API services and external integrations
```

### Key Components
- **VisualizerContext** - Central state management
- **Canvas Components** - 2D/3D rendering logic
- **Control Panels** - Tool-specific user interfaces
- **Mathematical Utils** - Core linear algebra functions

### Contributing
We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:
- Code style and conventions
- Testing requirements
- Pull request process
- Issue reporting

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Acknowledgments

- **Three.js community** for excellent 3D graphics tools
- **React ecosystem** for robust frontend framework
- **Mathematical visualization research** for inspiring educational approaches
- **Open source contributors** who make projects like this possible

## 🐛 Bug Reports & Feature Requests

Found a bug or have a feature idea? Please:
1. Check existing [issues](https://github.com/yourusername/linalgovistool/issues)
2. Create a new issue with detailed description
3. Include browser/device information for bugs
4. Provide steps to reproduce for bug reports

## 📞 Support & Contact

- **Documentation**: Built-in help system (click "Docs" in the app)
- **Issues**: [GitHub Issues](https://github.com/yourusername/linalgovistool/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/linalgovistool/discussions)

---

## 🎉 Try It Now!

Ready to explore linear algebra? **[Launch Linalgovistool](https://your-deployment-url.com)** and start visualizing mathematics today!

### Quick Tutorial
1. 🎯 **Start with vectors** - Click "Vector" tool and add your first vector
2. 🔄 **Try transformations** - Switch to "Matrix" tool and apply a rotation
3. 📊 **Explore eigenvalues** - Use "Eigenvalue" tool to find special directions
4. 🌌 **Visualize subspaces** - Create spans with the "Subspace" tool
5. 📐 **Change basis** - Experiment with different coordinate systems

**Happy learning!** 🚀📚

---

*Made with ❤️ for the mathematics education community*
