#!/usr/bin/env python3
"""
Startup script for Linalgovistool on Render
Ensures proper environment setup before starting the Flask app
"""
import sys
import os
import subprocess

def check_dependencies():
    """Check if required Python packages are installed"""
    try:
        import numpy
        import flask
        import flask_cors
        print("✅ All Python dependencies are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        return False

def start_app():
    """Start the Flask application"""
    if not check_dependencies():
        print("❌ Dependencies not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"], check=True)
    
    # Change to backend directory and start the app
    os.chdir("backend")
    from app import app
    
    # Get port from environment (Render sets this automatically)
    port = int(os.environ.get('PORT', 5000))
    
    print(f"🚀 Starting Linalgovistool on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)

if __name__ == "__main__":
    start_app()
