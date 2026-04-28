# ⚡ Quick Deployment Reference

## 🎯 Deployment Order
1. MongoDB Atlas (Database)
2. Render Backend (API)
3. Render ML Service (Python)
4. Netlify Frontend (Website)

---

## 📝 Quick Checklist

### MongoDB Atlas
```
✓ Create free cluster
✓ Create database user
✓ Whitelist all IPs (0.0.0.0/0)
✓ Copy connection string
```

### Render Backend
```
✓ Connect GitHub repo
✓ Root directory: backend
✓ Build: npm install
✓ Start: npm start
✓ Add environment variables:
  - MONGODB_URI
  - JWT_SECRET
  - FRONTEND_URL
  - ML_SERVICE_URL
```

### Render ML Service
```
✓ Connect GitHub repo
✓ Root directory: ml
✓ Runtime: Python 3
✓ Build: pip install -r requirements.txt && python -m spacy download en_core_web_sm
✓ Start: python app.py
```

### Netlify Frontend
```
✓ Connect GitHub repo
✓ Base directory: frontend
✓ Publish directory: .
✓ Update config.js with production URLs
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nextstep_ai
JWT_SECRET=your-64-char-random-string
JWT_EXPIRE=7d
FRONTEND_URL=https://your-app.netlify.app
ML_SERVICE_URL=https://your-ml.onrender.com
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 🌐 URLs After Deployment

```
Frontend:  https://nextstep-ai.netlify.app
Backend:   https://nextstep-ai-backend.onrender.com
ML:        https://nextstep-ai-ml.onrender.com
Database:  MongoDB Atlas (internal)
```

---

## 🧪 Testing Endpoints

```bash
# Backend Health Check
curl https://nextstep-ai-backend.onrender.com/api/health

# ML Service Health Check
curl https://nextstep-ai-ml.onrender.com/health

# Frontend
Open: https://nextstep-ai.netlify.app
```

---

## ⚠️ Common Issues

### CORS Error
- Update FRONTEND_URL in backend environment variables
- Redeploy backend

### Database Connection Failed
- Check MongoDB connection string
- Verify IP whitelist (0.0.0.0/0)
- Check database user credentials

### ML Service Build Failed
- Verify Python version: 3.11
- Check requirements.txt
- Ensure spacy download in build command

### Frontend API Calls Failing
- Update config.js with correct backend URL
- Check browser console for errors
- Verify backend is running

---

## 💡 Pro Tips

1. **Free Tier Limitations**
   - Render free services sleep after 15 min inactivity
   - First request after sleep takes ~30 seconds
   - Consider paid tier for production

2. **Database Backups**
   - MongoDB Atlas auto-backups on paid tiers
   - Export data regularly on free tier

3. **Monitoring**
   - Check Render logs regularly
   - Monitor MongoDB Atlas metrics
   - Use Netlify analytics

4. **Performance**
   - Enable caching on Netlify
   - Optimize images
   - Minify frontend assets

---

## 📞 Quick Support Links

- **Render**: https://render.com/docs
- **Netlify**: https://docs.netlify.com
- **MongoDB**: https://docs.atlas.mongodb.com

---

**Deployment Time Estimate:**
- MongoDB Atlas: 5 minutes
- Render Backend: 10 minutes
- Render ML Service: 15 minutes
- Netlify Frontend: 5 minutes
- **Total: ~35 minutes**

---

Good luck with your deployment! 🚀
