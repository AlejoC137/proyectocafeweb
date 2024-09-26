// App.jsx

import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import SupaBaseTest from './body/supaBaseTest';



function App() {

  


  return (
    <Routes>
      <Route path="/supaBaseTest" element={<SupaBaseTest />} />
    </Routes>
  );
}

export default App;
