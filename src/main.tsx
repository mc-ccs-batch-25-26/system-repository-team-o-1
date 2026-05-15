import React from 'react'
import ReactDOM from 'react-dom/client'
import emailjs from '@emailjs/browser';
import App from './HomePage.tsx'
import Login from './Login.tsx'
import Signup from './Signup.tsx'
import './index.css'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthRoute from './AuthRoute.tsx'
import Settings from './components/Settings.tsx'
import LessonsPage from './LessonsPage.tsx'
import QuizzesPage from './QuizzesPage.tsx'
import TermsOfService from './components/footer/TermsOfService.tsx'
import PrivacyPolicy from './components/footer/PrivacyPolicy.tsx'
import Layout from './components/Layout.tsx'
import ProgressPage from './pages/ProgressPage'
import PretestPage from './pages/PretestPage'
import { TopicsListScreen } from './components/lessons/TopicsListScreen.tsx';
import { LessonContentScreen } from './components/lessons/LessonContentScreen.tsx';
import './supabase/supabaseClient'

emailjs.init("akyGk9Q2Gdfwid34v");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route element={<AuthRoute><Layout /></AuthRoute>}>
          <Route path="/" element={<App />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/lessons/:category" element={<TopicsListScreen />} />
          <Route path="/lessons/:category/:topic" element={<LessonContentScreen />} />
        </Route>

        {/* Pretest — no sidebar, full screen */}
        <Route path="/pretest" element={<AuthRoute><PretestPage /></AuthRoute>} />

        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  </React.StrictMode>
);