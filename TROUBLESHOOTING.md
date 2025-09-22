# MINDLY Troubleshooting Guide

## 🚨 Common Issues and Solutions

### 1. AI Chatbot Keeps Going Down

**Problem**: After logging in, the AI chatbot stops working or shows errors when sending messages.

**Solutions**:

#### A. Backend Not Running
```bash
# Check if Python backend is running
curl http://localhost:5000/health

# If not running, start it:
python start_backend.py
# OR
cd python_backend
python app.py
```

#### B. Port Conflicts
- Frontend runs on port 3000
- Backend runs on port 5000
- Make sure both ports are available

#### C. Environment Variables
Create a `.env` file in the root directory:
```env
REACT_APP_PYTHON_BACKEND_URL=http://localhost:5000
```

#### D. CORS Issues
The backend has CORS enabled, but if you still get CORS errors:
1. Check if backend is running on correct port
2. Verify the URL in frontend matches backend URL
3. Restart both frontend and backend

### 2. Connection Status Issues

**Problem**: Chatbot shows "Offline Mode" or connection errors.

**Solutions**:

#### A. Check Backend Health
```bash
# Test backend health endpoint
curl -X GET http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00",
  "services": {
    "firebase": true,
    "chatbot": true,
    "sentiment_analyzer": true
  }
}
```

#### B. Check Network Connection
- Ensure no firewall blocking port 5000
- Check if localhost is accessible
- Try using 127.0.0.1 instead of localhost

#### C. Python Dependencies
```bash
cd python_backend
pip install -r requirements.txt
```

### 3. Firebase Connection Issues

**Problem**: Authentication or database operations fail.

**Solutions**:

#### A. Firebase Configuration
1. Check `src/firebase/config.js` has correct config
2. Verify Firebase project is active
3. Check if Firestore rules allow read/write

#### B. Service Account Key
1. Download service account key from Firebase Console
2. Place it in `python_backend/` directory
3. Name it `firebase-service-account.json`

### 4. Frontend Compilation Errors

**Problem**: React app fails to start or compile.

**Solutions**:

#### A. Clear Cache
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### B. Node Version
- Use Node.js 16+ 
- Check with: `node --version`

#### C. Port Already in Use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm start
```

### 5. Database Issues

**Problem**: Data not saving or loading properly.

**Solutions**:

#### A. Firestore Rules
Ensure Firestore rules allow authenticated users:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

#### B. Firebase Project Status
- Check if Firebase project is active
- Verify billing is enabled (for production)
- Check quotas and limits

### 6. Performance Issues

**Problem**: App is slow or unresponsive.

**Solutions**:

#### A. Reduce Bundle Size
```bash
# Analyze bundle
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

#### B. Optimize Images
- Compress images before uploading
- Use appropriate formats (WebP, AVIF)

#### C. Database Queries
- Limit query results
- Use pagination for large datasets
- Add proper indexes in Firestore

## 🔧 Quick Fixes

### Reset Everything
```bash
# Stop all processes
# Kill frontend (Ctrl+C)
# Kill backend (Ctrl+C)

# Clean and restart
rm -rf node_modules package-lock.json
npm install
cd python_backend
pip install -r requirements.txt
cd ..

# Start backend
python start_backend.py

# In another terminal, start frontend
npm start
```

### Check Logs
```bash
# Frontend logs (in terminal where npm start is running)
# Backend logs (in terminal where python app.py is running)

# Check browser console (F12 -> Console)
# Check Network tab for failed requests
```

### Test Individual Components
```bash
# Test backend only
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_id": "test", "session_id": "test"}'

# Test frontend only (without backend)
# Set REACT_APP_PYTHON_BACKEND_URL to invalid URL
# App will fall back to offline mode
```

## 📞 Getting Help

1. **Check Console Logs**: Browser console (F12) and terminal logs
2. **Verify URLs**: Ensure frontend calls correct backend URL
3. **Test Backend**: Use curl or Postman to test API endpoints
4. **Check Dependencies**: Ensure all packages are installed
5. **Restart Services**: Sometimes a simple restart fixes issues

## 🚀 Quick Start Commands

```bash
# Terminal 1: Start Backend
python start_backend.py

# Terminal 2: Start Frontend  
npm start

# Test Backend
curl http://localhost:5000/health

# Test Frontend
# Open http://localhost:3000 in browser
```

## 🔍 Debug Mode

Enable debug logging by setting environment variables:

```bash
# Backend debug
export FLASK_DEBUG=1
python app.py

# Frontend debug
export REACT_APP_DEBUG=true
npm start
```

This will provide more detailed error messages and logging.
