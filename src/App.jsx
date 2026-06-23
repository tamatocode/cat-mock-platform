import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import { ToastProvider } from './components/ui/Toast';

// Page imports (to be implemented)
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import AddQuestion from './pages/AddQuestion';
import CreateTest from './pages/CreateTest';
import TestsList from './pages/TestsList';
import TestInterface from './pages/TestInterface';
import ResultPage from './pages/ResultPage';
import ReviewPage from './pages/ReviewPage';

function AppLayout() {
  const location = useLocation();
  // Exam interface takes full screen, no sidebar
  const isExamMode = location.pathname.startsWith('/test/');

  if (isExamMode) {
    return (
      <main className="w-full min-h-screen bg-bg">
        <Routes>
          <Route path="/test/:id" element={<TestInterface />} />
        </Routes>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 md:ml-64 w-full">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/question-bank" element={<QuestionBank />} />
          <Route path="/add-question" element={<AddQuestion />} />
          <Route path="/create-test" element={<CreateTest />} />
          <Route path="/tests" element={<TestsList />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/review/:id" element={<ReviewPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppLayout />
    </ToastProvider>
  );
}
