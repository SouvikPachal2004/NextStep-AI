# NextStep AI - Backend API

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment Variables
```bash
cp .env.example .env
```

Edit `.env` and configure:
- MongoDB connection string
- JWT secret
- ML service URL

### 3. Install MongoDB
- Download and install MongoDB Community Edition
- Start MongoDB service:
  ```bash
  # Windows
  net start MongoDB
  
  # Mac/Linux
  sudo systemctl start mongod
  ```

### 4. Start the Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `PUT /api/auth/updatepassword` - Update password

### Users
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Admin)
- `PUT /api/courses/:id` - Update course (Admin)
- `DELETE /api/courses/:id` - Delete course (Admin)

### Enrollments
- `GET /api/enrollments` - Get user enrollments
- `POST /api/enrollments` - Enroll in course
- `PUT /api/enrollments/:id/progress` - Update progress
- `GET /api/enrollments/:id` - Get enrollment details

### Jobs
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `POST /api/jobs` - Create job (Admin)
- `PUT /api/jobs/:id` - Update job (Admin)
- `POST /api/jobs/:id/apply` - Apply for job
- `GET /api/jobs/recommendations` - Get job recommendations

### Resume
- `POST /api/resume/upload` - Upload resume
- `GET /api/resume/analyze` - Get ATS score and analysis
- `GET /api/resume/skills` - Extract skills from resume

### Assessments
- `GET /api/assessments` - Get all assessments
- `GET /api/assessments/:id` - Get assessment by ID
- `POST /api/assessments` - Create assessment (Admin)
- `POST /api/assessments/:id/attempt` - Submit assessment attempt

### Certificates
- `GET /api/certificates` - Get user certificates
- `GET /api/certificates/:id` - Get certificate by ID
- `POST /api/certificates/generate` - Generate certificate

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard stats (Admin)
- `GET /api/analytics/user/:id` - Get user analytics

## Project Structure
```
backend/
├── models/          # Mongoose models
├── routes/          # API routes
├── middleware/      # Custom middleware
├── controllers/     # Route controllers
├── utils/           # Utility functions
├── uploads/         # File uploads
├── server.js        # Entry point
└── package.json     # Dependencies
```

## Next Steps
1. Install and configure MongoDB
2. Run `npm install`
3. Configure `.env` file
4. Run `npm run dev`
5. Test API endpoints using Postman or frontend
