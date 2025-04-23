import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Item from './Menuitem.js'; // Fixed: 'Item' should be capitalized as a component

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/item" element={<Item />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
