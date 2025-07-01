import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './custom.scss';

import Home from './pages';
import SignupPage from './pages/signup';
import LoginPage from './pages/login';
import ForgotPasswordPage from './pages/forgor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Add other routes later */}
      </Routes>
    </Router>
  );
}

export default App;
