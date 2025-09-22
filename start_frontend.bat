@echo off
echo 🚀 Starting MINDLY Frontend...
echo ================================================

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Error installing dependencies!
        pause
        exit /b 1
    )
)

echo 🔧 Starting React development server...
echo 📍 Frontend will be available at: http://localhost:3000
echo.
echo Make sure the Python backend is running on http://localhost:5000
echo Press Ctrl+C to stop the server
echo ================================================

npm start
