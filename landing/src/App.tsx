import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import PreRegPage from './pages/PreRegPage'
import SignInPage from './pages/SignInPage'
import RegisterEscort from './pages/RegisterEscort'
import RegisterTaxi from './pages/RegisterTaxi'
import ProfileEscort from './pages/ProfileEscort'
import ProfileTaxi from './pages/ProfileTaxi'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/prereg" element={<PreRegPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/register/escort" element={<RegisterEscort />} />
        <Route path="/register/taxi" element={<RegisterTaxi />} />
        <Route path="/profile/escort" element={<ProfileEscort />} />
        <Route path="/profile/taxi" element={<ProfileTaxi />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
