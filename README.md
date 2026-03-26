# 🎯 ECET Crack — Ultimate ECET Preparation App

A full-stack MERN application for ECET exam preparation with a React mobile web app (PWA) and a powerful admin panel.

## 🏗 Architecture

```
ECET_app/
├── backend/    → Node.js + Express + MongoDB API (Port 5000)
├── admin/      → React + Vite Admin Panel (Port 5173)
└── mobile/     → React + Vite Mobile Web App / PWA (Port 3000)
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ installed
- **MongoDB** running locally (`mongodb://localhost:27017`) OR set `MONGODB_URI` in `.env`

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Start Admin Panel
```bash
cd admin
npm install
npm run dev
```
Open http://localhost:5173 → Login with any email + the JWT_SECRET as password

### 3. Start Mobile App
```bash
cd mobile
npm install
npm run dev
```
Open http://localhost:3000

## 📋 First-Time Setup

1. Start the backend server
2. Open the **Admin Panel** (http://localhost:5173)
3. Login with email: `admin@ecetcrack.com`, password: `ecet_crack_super_secret_key_2026_change_this_in_production`
4. Go to **Subjects** → Click **"🌱 Seed Defaults"** to add all ECET subjects (Math, Physics, Chemistry, CSE, ECE, EEE, MECH, CIVIL)
5. Go to **Questions** → Upload questions via JSON (use the sample format provided)
6. Open the **Mobile App** (http://localhost:3000) → Sign in → Start practicing!

## 📤 JSON Question Upload Format

```json
{
  "subject": "Mathematics",
  "subjectCode": "MATH",
  "unit": 1,
  "unitName": "Matrices & Determinants",
  "questions": [
    {
      "text": "If A is a 3×3 matrix with |A| = 5, then |adj(A)| = ?",
      "options": ["5", "25", "125", "1/5"],
      "correct": 1,
      "explanation": "|adj(A)| = |A|^(n-1) = 5² = 25",
      "difficulty": "medium"
    }
  ]
}
```

## ✨ Features

### Student App
- 📚 **Subject Quizzes** (10 questions)
- 📋 **Unit Tests** (20 marks per unit)
- 🏆 **Grand Tests** (100 marks, all units)
- 🎯 **Mock Tests** (full ECET simulation)
- ⏱ **Timer + Question Map + Flag for Review**
- 📖 **Review wrong/correct answers with explanations**
- 📊 **Real-time dashboard with performance charts**
- 🏆 **Leaderboard with branch filtering**
- 📚 **Study notes (PDF + Markdown)**
- 🔔 **Notifications**
- 🔥 **Streak tracking**

### Admin Panel
- 📊 **Dashboard with analytics charts**
- 📚 **Subject management with unit editor**
- ❓ **Question bank + JSON bulk upload**
- 📝 **Notes manager (PDF + Markdown)**
- 👥 **Student management with role control**
- 🔔 **Notification sender (branch-targeted)**

## 📱 APK Build (Android)

To convert to an Android APK, you can use **Capacitor**:

```bash
cd mobile
npm install @capacitor/core @capacitor/cli
npx cap init "ECET Crack" com.ecetcrack.app --web-dir dist
npm run build
npx cap add android
npx cap sync
npx cap open android
```

Then build the APK using Android Studio.

## 🔧 Environment Variables

Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecet_crack
JWT_SECRET=your_secret_key_here
```

---

Built with ❤️ to help diploma students crack ECET and get into top engineering colleges! 🎓
