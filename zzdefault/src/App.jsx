import { Routes, Route } from 'react-router-dom'
import Hub from './pages/hub.jsx'
import Login from './pages/login.jsx'
import SignUp from './pages/signup.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub/>} />
      <Route path="/login" element={<Login/>}/>
      <Route path="/signup" element={<SignUp/>}/>
    </Routes>
  )
}

export default App