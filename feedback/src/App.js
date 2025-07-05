import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom.scss';

import Home from './pages';
import SignupPage from './pages/signup';
import LoginPage from './pages/login';
import Dashboard from './pages/dashboard';
import CoursesPage from './pages/courses-page';
import CoursePage from './pages/course-page';
import AssignmentDetailsPage from './pages/assignment-detail';

import ForgotPasswordPage from './pages/forgor';
import CareersPage from './pages/careers';
import ContactPage from './pages/contact';
import CatPage from './pages/cat';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
          <Route path="/course/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
          <Route path="/assignment/:id" element={<ProtectedRoute><AssignmentDetailsPage /></ProtectedRoute>} />
          {/* Add other routes later */}


          {/* Not important routes */}
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cat" element={<CatPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
