<div align="center">
  <br />
  <h1>🚀 PROSHU</h1>
  <p><strong>A Modern, Full-Stack Project Management System</strong></p>
  <p>Seamlessly manage your tasks and projects across the web and mobile, powered by a high-performance unified backend.</p>
  <br />
  
  [![React](https://img.shields.io/badge/React-18-blue.svg?style=flat&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=flat&logo=nodedotjs)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?style=flat&logo=postgresql)](https://postgresql.org/)
  [![Expo](https://img.shields.io/badge/Expo-Mobile-black.svg?style=flat&logo=expo)](https://expo.dev/)
  <br />
</div>

<hr />

## 🌟 Overview

PROSHU is a comprehensive project and task management ecosystem engineered for speed, security, and exceptional user experience. Built as a monorepo, it features a **Vite/React web application**, an **Expo React Native mobile app**, and a centralized **Express/Node.js backend API** backed by a **Neon PostgreSQL** database.

### 🔗 Live Demo
Access the live web application here: **[proshu.vercel.app](https://project-management-system.vercel.app)** *(Deployed via Vercel)*

---

## ✨ Key Features

- **⚡ Optimistic UI:** Tasks and projects update instantly on the screen without waiting for network roundtrips.
- **🔐 Bank-Grade Security:** JWT authentication, bcrypt password hashing, strict rate-limiting, and comprehensive SQL-injection protections.
- **📱 True Cross-Platform:** Use the same account to seamlessly sync your projects across the Web and Android.
- **🎨 Premium Design:** Sleek, modern aesthetics with transparent components, glassmorphism elements, and built-in Light/Dark mode.
- **📊 Real-time Analytics:** Visual donut charts and automatic progress bars for active task tracking.

---

## 🏗️ Architecture & Tech Stack

This project is built using a modern, scalable stack designed for production environments.

### 🌐 Web (Frontend)
- **Framework:** React 18 & Vite
- **Styling:** Custom Vanilla CSS Design System (Premium UI Tokens)
- **Icons:** Lucide React
- **Hosting:** Vercel (Multi-Service Architecture)

### ⚙️ Backend (API)
- **Server:** Node.js (v20+) & Express 4
- **Database:** PostgreSQL (Hosted on Neon)
- **Security:** Helmet, CORS, Express Rate Limit
- **Auth:** JSON Web Tokens (HS256)

### 📱 Mobile (Android)
- **Framework:** React Native (Expo SDK 57)
- **Navigation:** React Navigation 7
- **Storage:** Expo Secure Store

---

## 🚀 Getting Started

Want to run PROSHU locally on your own machine? Follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v20 or higher)
- [Git](https://git-scm.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/Shudhanshu9122/Project-Management-System.git
cd Project-Management-System
```

### 2. Setup the Backend API
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder and add your database credentials:
```env
DATABASE_URL="your_neon_postgres_url_here"
JWT_SECRET="your_secure_random_string"
PORT=4000
```
Then, initialize the database and start the server:
```bash
npm run migrate
npm run seed      # (Optional) Populates the database with sample data
npm run dev
```

### 3. Setup the Web Client
In a new terminal window:
```bash
cd web
npm install
```
Create a `.env` file in the `web` folder:
```env
VITE_API_URL="http://localhost:4000/api"
```
Start the frontend development server:
```bash
npm run dev
```
Your app will now be running locally at `http://localhost:5173`!

---

## ☁️ Deployment

PROSHU is fully configured for **Vercel Multi-Service Deployment**. 

By simply importing this repository into Vercel, the included `vercel.json` file will automatically instruct Vercel to securely build and deploy **both** the Express API (as serverless functions under `/api`) and the React frontend simultaneously on a single domain. No separate backend hosting is required!

---

## 📂 Repository Structure

```text
PROSHU/
├── backend/               # Node.js / Express API
│   ├── db/                # SQL Schema & Migrations
│   ├── src/               # Controllers, Middleware, Routes
│   └── package.json       
├── web/                   # React / Vite Web Application
│   ├── src/               # Components, Contexts, Pages
│   └── package.json       
├── mobile/                # Expo React Native App
│   └── src/               # Screens & Navigation
├── vercel.json            # Vercel Serverless Configuration
└── README.md              # You are here!
```

---
<div align="center">
  <i>Engineered with clean code and modern architecture.</i>
</div>
