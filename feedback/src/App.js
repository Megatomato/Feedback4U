import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom.scss';

import Home from './pages';
import SignupPage from './pages/signup';
import LoginPage from './pages/login';
import ForgotPasswordPage from './pages/forgor';
import CareersPage from './pages/careers';
import ContactPage from './pages/contact';
import CatPage from './pages/cat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/cat" element={<CatPage />} />
        {/* Add other routes later */}
      </Routes>
    </Router>
  );
}

export default App;
