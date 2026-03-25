import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Landing from './pages/Landing.jsx';
import Studio from './pages/Studio.jsx';
import Gallery from './pages/Gallery.jsx';
import Auth from './pages/Auth.jsx';
import Editor from './pages/Editor.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-root">
        <Routes>
          <Route path="/" element={<><Navbar /><Landing /></>} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/gallery" element={<><Navbar /><Gallery /></>} />
          <Route path="/auth" element={<><Navbar /><Auth /></>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
