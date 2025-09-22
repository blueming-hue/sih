#!/usr/bin/env python3
"""
Simple script to start the Python backend for MINDLY
Make sure you have installed the requirements first:
pip install -r python_backend/requirements.txt
"""

import subprocess
import sys
import os

def main():
    print("🚀 Starting MINDLY Python Backend...")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('python_backend'):
        print("❌ Error: python_backend directory not found!")
        print("Please run this script from the project root directory.")
        sys.exit(1)
    
    # Change to python_backend directory
    os.chdir('python_backend')
    
    try:
        print("📦 Installing dependencies...")
        subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'], check=True)
        
        print("🔧 Starting Flask server...")
        print("📍 Backend will be available at: http://localhost:5000")
        print("🔍 Health check: http://localhost:5000/health")
        print("💬 Chat API: http://localhost:5000/api/chat")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 50)
        
        # Start the Flask app
        subprocess.run([sys.executable, 'app.py'], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting backend: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Backend stopped by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
