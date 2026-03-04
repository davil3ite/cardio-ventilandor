import { Routes, Route } from 'react-router-dom'
import Hub from './pages/hub.jsx'
import Login from './pages/login.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub/>} />
      <Route path="/login" element={<Login/>}/>
    </Routes>
  )
}

export default App