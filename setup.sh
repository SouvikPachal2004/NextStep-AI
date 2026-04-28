#!/bin/bash

echo "🚀 NextStep AI - Setup Script"
echo "=============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+ first."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB Community Edition."
    echo "   Download from: https://www.mongodb.com/try/download/community"
fi

echo ""
echo "📦 Installing Backend Dependencies..."
cd backend
npm install
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file. Please configure it before running."
fi
cd ..

echo ""
echo "📦 Installing ML Service Dependencies..."
cd ml
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
deactivate
cd ..

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Configure backend/.env file"
echo "2. Start MongoDB: mongod"
echo "3. Start Backend: cd backend && npm run dev"
echo "4. Start ML Service: cd ml && source venv/bin/activate && python app.py"
echo "5. Start Frontend: cd frontend && python -m http.server 3000"
echo ""
echo "🌐 Access the application at http://localhost:3000"
