import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages';
import './App.css';

import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Add other routes later */}
      </Routes>
    </Router>
  );
}

export default App;
