import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DeviceCatalog from './components/DeviceCatalog';
import CategoryManager from './components/CategoryManager';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Routes - Navigation only in Admin */}
        <Routes>
          <Route path="/" element={<DeviceCatalog />} />
          <Route path="/admin" element={<CategoryManager />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
