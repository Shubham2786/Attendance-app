# ClassConnect - Student Attendance Management System

A comprehensive web application for managing student attendance, timetables, marks, and academic records.

## 🚀 Features

- **Dashboard**: Real-time attendance tracking with today's classes
- **Subject Management**: Add/manage subjects with credits and types (Theory/Lab)
- **Timetable Management**: Weekly schedule with visual differentiation
- **Attendance Tracking**: Mark attendance with editing capabilities
- **Marks Management**: Semester-based marks with CGPA calculation
- **Holiday Management**: Manage academic calendar and non-working days
- **Reports & Analytics**: Visual charts and PDF export
- **Mobile Responsive**: Optimized for all devices

## 🛠️ Tech Stack

**Frontend:**
- React 19.1.1
- Vite 7.1.2
- Bootstrap 5.3.7
- Recharts 3.1.2
- Axios 1.11.0

**Backend:**
- Node.js
- Express 4.18.2
- SQLite3 5.1.6
- CORS 2.8.5

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```
DB_PATH=./classconnect.db
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-jwt-secret-key-here
SESSION_SECRET=your-session-secret-here
API_BASE_URL=http://localhost:5000/api
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_NODE_ENV=development
```

## 🚀 Quick Start

1. Clone the repository
```bash
git clone <repository-url>
cd ClassConnect
```

2. Install dependencies for both frontend and backend
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

3. Set up environment variables
```bash
# Backend
cd backend
cp .env.example .env

# Frontend
cd ../frontend
cp .env.example .env
```

4. Start the development servers
```bash
# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 📊 Database

The application uses SQLite for development. The database file (`classconnect.db`) will be created automatically when you first run the backend.

### Database Migration
If upgrading from an older version:
```bash
cd backend
npm run migrate
```

### Reset Database
To start fresh:
```bash
cd backend
npm run reset-db
```

## 🌐 Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `npm run build`
2. Deploy the `dist` folder
3. Update `VITE_API_BASE_URL` to your backend URL

### Backend (Railway/Heroku)
1. Set environment variables
2. Use PostgreSQL for production database
3. Update database connection in `database.js`

## 📱 Usage

1. **Setup**: Add subjects, configure semester dates, set non-working days
2. **Timetable**: Create your weekly class schedule
3. **Daily Use**: Mark attendance from the dashboard
4. **Analytics**: View reports and track attendance patterns
5. **Marks**: Enter exam marks and calculate CGPA

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Issues

If you encounter any issues, please create an issue on GitHub with:
- Description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

## 📞 Support

For support and questions, please open an issue on GitHub.