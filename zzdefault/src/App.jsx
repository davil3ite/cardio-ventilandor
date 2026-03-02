import { Routes, Route } from 'react-router-dom'
import Hub from './pages/hub.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Hub/>} />
    </Routes>
  )
}

export default App