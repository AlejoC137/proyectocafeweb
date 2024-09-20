// App.jsx

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SupaBaseTest from './body/SupaBaseTest';
import './App.css';

function App() {

  


  return (
    <Routes>
      <Route path="/supaBaseTest" element={<SupaBaseTest />} />
    </Routes>
  );
}

export default App;
