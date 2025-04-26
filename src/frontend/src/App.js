import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SubscriptionPlans from './components/SubscriptionPlans';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/subscriptions" element={<SubscriptionPlans />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
