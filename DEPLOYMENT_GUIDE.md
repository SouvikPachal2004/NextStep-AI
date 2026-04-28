# 🚀 NextStep AI - Complete Deployment Guide

This guide will walk you through deploying your NextStep AI application to production using **Render** (Backend + ML Service) and **Netlify** (Frontend).

---

## 📋 Prerequisites

Before starting, make sure you have:

- ✅ GitHub account with your repository pushed
- ✅ MongoDB Atlas account (for database)
- ✅ Render account (for backend & ML service)
- ✅ Netlify account (for frontend)

---

## 🗂️ Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Netlify)                                      │
│  └─ Static HTML/CSS/JS                                   │
│     └─ Connects to Backend API                           │
│                                                          │
│  Backend (Render)                                        │
│  └─ Node.js/Express API                                  │
│     └─ Connects to MongoDB Atlas                         │
│     └─ Connects to ML Service                            │
│                                                          │
│  ML Service (Render)                                     │
│  └─ Python/Flask API                                     │
│     └─ Resume analysis & job matching                    │
│                                                          │
│  Database (MongoDB Atlas)                                │
│  └─ Cloud-hosted MongoDB                                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Deployment

### **STEP 1: Setup MongoDB Atlas (Database)**

#### 1.1 Create MongoDB Atlas Account
1. Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** or **"Sign In"**
3. Create account or login

#### 1.2 Create a New Cluster
1. Click **"Build a Database"**
2. Choose **"M0 FREE"** tier
3. Select **Cloud Provider**: AWS
4. Select **Region**: Choose closest to your users (e.g., Mumbai, Singapore)
5. Cluster Name: `nextstep-ai-cluster`
6. Click **"Create"**

#### 1.3 Create Database User
1. Go to **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `nextstep_admin`
5. Password: Generate a strong password (SAVE THIS!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

#### 1.4 Whitelist IP Addresses
1. Go to **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

#### 1.5 Get Connection String
1. Go to **"Database"** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string:
   ```
   mongodb+srv://nextstep_admin:<password>@nextstep-ai-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name before `?`:
   ```
   mongodb+srv://nextstep_admin:YOUR_PASSWORD@nextstep-ai-cluster.xxxxx.mongodb.net/nextstep_ai?retryWrites=true&w=majority
   ```
8. **SAVE THIS CONNECTION STRING!**

---

### **STEP 2: Deploy Backend to Render**

#### 2.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Click **"Get Started"** or **"Sign In"**
3. Sign up with GitHub (recommended)

#### 2.2 Connect GitHub Repository
1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Click **"Connect GitHub"** (if not already connected)
4. Find and select your repository: `NextStep-AI`
5. Click **"Connect"**

#### 2.3 Configure Backend Service
Fill in the following details:

**Basic Settings:**
- **Name**: `nextstep-ai-backend`
- **Region**: Choose closest to your users
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Instance Type:**
- Select **"Free"** (for testing) or **"Starter"** (for production)

#### 2.4 Add Environment Variables
Click **"Advanced"** and add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `5000` | |
| `MONGODB_URI` | `mongodb+srv://...` | Paste your MongoDB connection string |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this-in-production-12345` | Generate a random string |
| `JWT_EXPIRE` | `7d` | |
| `FRONTEND_URL` | `https://your-app.netlify.app` | Will update after frontend deploy |
| `ML_SERVICE_URL` | `https://nextstep-ai-ml.onrender.com` | Will update after ML deploy |

**To generate JWT_SECRET:**
```bash
# Run this in your terminal:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### 2.5 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, you'll get a URL like: `https://nextstep-ai-backend.onrender.com`
4. **SAVE THIS URL!**

#### 2.6 Test Backend
1. Open: `https://nextstep-ai-backend.onrender.com/api/health`
2. You should see: `{"success": true, "message": "API is running"}`

---

### **STEP 3: Deploy ML Service to Render**

#### 3.1 Create ML Service
1. In Render Dashboard, click **"New +"**
2. Select **"Web Service"**
3. Select your repository: `NextStep-AI`

#### 3.2 Configure ML Service
**Basic Settings:**
- **Name**: `nextstep-ai-ml`
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `ml`
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
- **Start Command**: `python app.py`

**Instance Type:**
- Select **"Free"** or **"Starter"**

#### 3.3 Add Environment Variables
| Key | Value |
|-----|-------|
| `ML_PORT` | `5001` |
| `PYTHON_VERSION` | `3.11.0` |

#### 3.4 Deploy ML Service
1. Click **"Create Web Service"**
2. Wait for deployment (10-15 minutes - Python takes longer)
3. Once deployed, you'll get a URL like: `https://nextstep-ai-ml.onrender.com`
4. **SAVE THIS URL!**

#### 3.5 Update Backend Environment Variable
1. Go back to your backend service in Render
2. Go to **"Environment"** tab
3. Update `ML_SERVICE_URL` with your ML service URL
4. Click **"Save Changes"**
5. Backend will automatically redeploy

---

### **STEP 4: Deploy Frontend to Netlify**

#### 4.1 Update Frontend Configuration
First, update your `frontend/js/config.js` to use environment-based URLs:

```javascript
// frontend/js/config.js
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:5000/api'
  : 'https://nextstep-ai-backend.onrender.com/api';

const ML_API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5001'
  : 'https://nextstep-ai-ml.onrender.com';
```

**Commit and push this change:**
```bash
git add frontend/js/config.js
git commit -m "Update API URLs for production"
git push origin main
```

#### 4.2 Create Netlify Account
1. Go to [https://www.netlify.com](https://www.netlify.com)
2. Click **"Sign up"** or **"Log in"**
3. Sign up with GitHub (recommended)

#### 4.3 Deploy Frontend
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository: `NextStep-AI`
4. Configure build settings:
   - **Branch to deploy**: `main`
   - **Base directory**: `frontend`
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (current directory)
5. Click **"Deploy site"**

#### 4.4 Configure Site Settings
1. Once deployed, go to **"Site settings"**
2. Click **"Change site name"**
3. Enter a custom name: `nextstep-ai` (or your preferred name)
4. Your site will be: `https://nextstep-ai.netlify.app`

#### 4.5 Update Backend CORS
1. Go back to Render backend service
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL` with your Netlify URL: `https://nextstep-ai.netlify.app`
4. Click **"Save Changes"**

---

### **STEP 5: Final Configuration & Testing**

#### 5.1 Update All URLs
Make sure all services know about each other:

**Backend Environment Variables:**
- ✅ `MONGODB_URI` - MongoDB Atlas connection string
- ✅ `FRONTEND_URL` - Netlify URL
- ✅ `ML_SERVICE_URL` - Render ML service URL

**Frontend config.js:**
- ✅ `API_URL` - Render backend URL
- ✅ `ML_API_URL` - Render ML service URL

#### 5.2 Test Complete Flow
1. **Open Frontend**: `https://nextstep-ai.netlify.app`
2. **Test Registration**: Create a new account
3. **Test Login**: Login with your account
4. **Test Features**:
   - Create a course (admin)
   - Enroll in a course (user)
   - Take an assessment
   - Upload resume
   - View analytics

#### 5.3 Create Admin Account
Since you're starting fresh, create an admin account:

**Option 1: Via MongoDB Atlas**
1. Go to MongoDB Atlas
2. Click **"Browse Collections"**
3. Find `users` collection
4. Find your user document
5. Edit and change `role` from `"student"` to `"admin"`

**Option 2: Via Backend API**
Use Postman or curl to create admin:
```bash
curl -X POST https://nextstep-ai-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@nextstep.ai",
    "password": "Admin@123",
    "role": "admin"
  }'
```

---

## 🔧 Troubleshooting

### Backend Issues

**Problem: Backend not starting**
- Check Render logs: Dashboard → Service → Logs
- Verify all environment variables are set
- Check MongoDB connection string is correct

**Problem: CORS errors**
- Verify `FRONTEND_URL` in backend matches your Netlify URL
- Check backend logs for CORS errors

**Problem: Database connection failed**
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check MongoDB connection string format
- Verify database user has correct permissions

### ML Service Issues

**Problem: ML service build fails**
- Check Python version is 3.11
- Verify requirements.txt is correct
- Check build logs for specific errors

**Problem: Spacy model not loading**
- Ensure build command includes: `python -m spacy download en_core_web_sm`
- Check if model is in requirements.txt

### Frontend Issues

**Problem: API calls failing**
- Check browser console for errors
- Verify API_URL in config.js is correct
- Check if backend is running

**Problem: 404 errors on page refresh**
- Add `_redirects` file in frontend folder:
  ```
  /*    /index.html   200
  ```

---

## 📊 Monitoring & Maintenance

### Render Dashboard
- Monitor service health
- Check logs for errors
- View deployment history
- Manage environment variables

### MongoDB Atlas
- Monitor database usage
- Check connection metrics
- Backup database regularly
- Monitor storage usage

### Netlify Dashboard
- Monitor site analytics
- Check deployment history
- View build logs
- Configure custom domain

---

## 🔐 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets
   - Rotate secrets regularly

2. **Database**
   - Use strong passwords
   - Enable MongoDB Atlas encryption
   - Regular backups

3. **API**
   - Enable rate limiting
   - Validate all inputs
   - Use HTTPS only

4. **Frontend**
   - Sanitize user inputs
   - Use Content Security Policy
   - Enable HTTPS

---

## 💰 Cost Estimation

### Free Tier (Good for testing)
- **MongoDB Atlas**: Free (M0 - 512MB)
- **Render Backend**: Free (750 hours/month)
- **Render ML Service**: Free (750 hours/month)
- **Netlify**: Free (100GB bandwidth)
- **Total**: $0/month

### Production Tier (Recommended)
- **MongoDB Atlas**: $9/month (M10 - 2GB)
- **Render Backend**: $7/month (Starter)
- **Render ML Service**: $7/month (Starter)
- **Netlify**: Free (sufficient for most cases)
- **Total**: ~$23/month

---

## 🎯 Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] ML service deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] MongoDB Atlas connected
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Admin account created
- [ ] Test user registration
- [ ] Test user login
- [ ] Test course creation
- [ ] Test enrollment
- [ ] Test assessments
- [ ] Test resume upload
- [ ] Test analytics
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring setup

---

## 🆘 Support & Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com)

### Community
- [Render Community](https://community.render.com)
- [Netlify Community](https://answers.netlify.com)
- [MongoDB Community](https://www.mongodb.com/community/forums)

---

## 🎉 Congratulations!

Your NextStep AI application is now live in production! 🚀

**Your URLs:**
- Frontend: `https://nextstep-ai.netlify.app`
- Backend: `https://nextstep-ai-backend.onrender.com`
- ML Service: `https://nextstep-ai-ml.onrender.com`

Share your application with users and start collecting feedback!

---

**Need Help?** Check the troubleshooting section or reach out to the respective platform's support.

**Happy Deploying! 🎊**
