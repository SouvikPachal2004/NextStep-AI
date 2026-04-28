# 🚀 Start Project Guide - Complete Setup

## Prerequisites

Before starting, ensure you have:
- ✅ **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- ✅ **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- ✅ **MongoDB** (v5.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
- ✅ **VS Code** with Live Server extension (for frontend)

---

## 🎯 Quick Start (Automated)

### Step 1: Install Dependencies
```bash
# Double-click this file:
INSTALL_DEPENDENCIES.bat

# This will:
# - Install Node.js packages for backend
# - Create Python virtual environment
# - Install Python packages for ML service
# - Download spaCy language model
```

### Step 2: Start MongoDB
```bash
# Make sure MongoDB is running
# Default: mongodb://localhost:27017

# Windows Service (if installed as service):
net start MongoDB

# Or run manually:
mongod --dbpath C:\data\db
```

### Step 3: Configure Environment
```bash
# Edit backend/.env file:
cd backend
copy .env.example .env

# Update these values:
MONGODB_URI=mongodb://localhost:27017/nextstep-ai
JWT_SECRET=your-secret-key-here
PORT=5000
ML_SERVICE_URL=http://localhost:5001
```

### Step 4: Start All Services
```bash
# Double-click this file:
START_ALL.bat

# This will start:
# 1. Backend Server (Port 5000)
# 2. ML Service (Port 5001)
# 3. Open frontend in browser (Port 5500)
```

### Step 5: Open Frontend
```bash
# In VS Code:
# 1. Open frontend/index.html
# 2. Right-click > "Open with Live Server"
# 3. Browser opens at http://localhost:5500/frontend/index.html
```

---

## 📋 Manual Start (Step by Step)

### Terminal 1: Backend Server
```bash
cd backend
npm install          # First time only
npm start            # Starts on port 5000
```

**Expected Output:**
```
✅ MongoDB Connected
🚀 Server running on port 5000
```

### Terminal 2: ML Service
```bash
cd ml
python -m venv venv                    # First time only
venv\Scripts\activate                  # Windows
pip install -r requirements.txt        # First time only
python -m spacy download en_core_web_sm  # First time only
python app.py                          # Starts on port 5001
```

**Expected Output:**
```
Resume Analyzer initialized successfully
Job Matcher initialized successfully
 * Running on http://0.0.0.0:5001
```

### Terminal 3: Frontend (Live Server)
```bash
# In VS Code:
# 1. Install "Live Server" extension
# 2. Open frontend/index.html
# 3. Click "Go Live" button (bottom right)
# 4. Browser opens at http://localhost:5500
```

---

## 🔍 Verify Everything is Running

### Check Backend (Port 5000)
```bash
# Open browser:
http://localhost:5000/api/health

# Expected response:
{
  "success": true,
  "message": "NextStep AI API is running"
}
```

### Check ML Service (Port 5001)
```bash
# Open browser:
http://localhost:5001/health

# Expected response:
{
  "status": "ok",
  "message": "NextStep AI ML Service is running"
}
```

### Check Frontend (Port 5500)
```bash
# Open browser:
http://localhost:5500/frontend/index.html

# Should see:
# - Homepage with platform analytics
# - Login/Signup buttons
# - Real-time stats updating
```

### Check MongoDB
```bash
# In MongoDB Compass or shell:
mongodb://localhost:27017/nextstep-ai

# Should see database: nextstep-ai
# Collections: users, courses, enrollments, etc.
```

---

## 🎨 Test All Features

### 1. Test AI Interview (2 minutes)
```
URL: http://localhost:5500/frontend/pages/ai-interview.html

Steps:
1. Upload resume (PDF/DOC)
2. Enable camera and microphone
3. Click "Start Interview"
4. ✅ Verify: Camera on RIGHT side (550px)
5. ✅ Verify: Questions on LEFT side
6. Answer questions
7. View results
```

### 2. Test Resume Analysis (2 minutes)
```
URL: http://localhost:5500/frontend/pages/user-dashboard.html

Steps:
1. Create account / Login
2. Click "Resume" in sidebar
3. Upload your resume
4. ✅ Verify: Skills detected
5. ✅ Verify: Job recommendations show
6. ✅ Verify: Course suggestions appear
7. ✅ Verify: 8 AI suggestions listed
```

### 3. Test Analytics (1 minute)
```
URL: http://localhost:5500/frontend/index.html

Steps:
1. Open homepage
2. ✅ Verify: Platform stats show
3. ✅ Verify: Numbers update (wait 5 seconds)
4. Login and go to dashboard
5. ✅ Verify: User stats show
6. ✅ Verify: Charts update with real data
```

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use:
netstat -ano | findstr :5000

# Kill process if needed:
taskkill /PID <PID> /F

# Check MongoDB connection:
# - Ensure MongoDB is running
# - Check MONGODB_URI in .env
```

### ML Service won't start
```bash
# Check Python version:
python --version  # Should be 3.8+

# Reinstall dependencies:
cd ml
pip install -r requirements.txt --force-reinstall

# Check if port 5001 is in use:
netstat -ano | findstr :5001
```

### Frontend not loading
```bash
# Check Live Server is running
# - Look for "Port: 5500" in VS Code status bar

# Try different port:
# - Right-click index.html
# - "Open with Live Server"

# Check browser console for errors:
# - Press F12
# - Look for red errors
```

### MongoDB connection failed
```bash
# Start MongoDB service:
net start MongoDB

# Or run manually:
mongod --dbpath C:\data\db

# Check if running:
mongo --eval "db.version()"
```

### Resume analysis not working
```bash
# Check ML service is running:
http://localhost:5001/health

# Check backend can reach ML service:
# - Check ML_SERVICE_URL in backend/.env
# - Should be: http://localhost:5001

# Check file upload:
# - Max size: 5MB
# - Allowed: PDF, DOC, DOCX
```

### Analytics not updating
```bash
# Check backend is running:
http://localhost:5000/api/health

# Check browser console:
# - Press F12
# - Look for API errors

# Check MongoDB has data:
# - Open MongoDB Compass
# - Check collections have documents
```

---

## 📊 Service Status Dashboard

| Service | Port | Status Check | Expected Response |
|---------|------|--------------|-------------------|
| Backend | 5000 | http://localhost:5000/api/health | `{"success": true}` |
| ML Service | 5001 | http://localhost:5001/health | `{"status": "ok"}` |
| Frontend | 5500 | http://localhost:5500/frontend/index.html | Homepage loads |
| MongoDB | 27017 | `mongo --eval "db.version()"` | Version number |

---

## 🎯 Success Checklist

- [ ] MongoDB running on port 27017
- [ ] Backend running on port 5000
- [ ] ML service running on port 5001
- [ ] Frontend accessible on port 5500
- [ ] Can create account and login
- [ ] AI Interview camera on RIGHT side
- [ ] Resume analysis shows job recommendations
- [ ] Analytics update in real-time
- [ ] Charts show dynamic data
- [ ] No console errors

---

## 📁 Project Structure

```
nextstep-ai/
├── backend/              # Node.js + Express API
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth middleware
│   ├── uploads/         # File uploads
│   ├── .env            # Environment config
│   └── server.js       # Entry point
│
├── ml/                  # Python ML Service
│   ├── venv/           # Virtual environment
│   ├── app.py          # Flask API
│   ├── resume_analyzer.py
│   ├── job_matcher.py
│   └── requirements.txt
│
├── frontend/            # HTML/CSS/JS
│   ├── pages/          # HTML pages
│   ├── js/             # JavaScript
│   ├── css/            # Stylesheets
│   └── index.html      # Homepage
│
└── START_ALL.bat       # Start all services
```

---

## 🚀 Quick Commands

```bash
# Install everything
INSTALL_DEPENDENCIES.bat

# Start all services
START_ALL.bat

# Start ML service only
START_ML_SERVICE.bat

# Start backend only
cd backend && npm start

# Check service health
curl http://localhost:5000/api/health
curl http://localhost:5001/health
```

---

## 🎉 You're Ready!

All services should now be running:
- ✅ Backend: http://localhost:5000
- ✅ ML Service: http://localhost:5001
- ✅ Frontend: http://localhost:5500/frontend/index.html

**Test the three main features:**
1. AI Interview with camera on RIGHT
2. Resume analysis with job recommendations
3. Real-time analytics with dynamic charts

**Everything is working!** 🚀

---

## 📞 Need Help?

Check these files:
- `TESTING_CHECKLIST.md` - Complete testing guide
- `VISUAL_GUIDE.md` - Visual examples
- `TASK_COMPLETION_SUMMARY.md` - Feature summary
- `QUICK_START.md` - Quick reference

**Happy coding!** ✨
