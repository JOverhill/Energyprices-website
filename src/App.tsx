import './App.css'
import { Navbar } from './components/Navbar'
import { MainSection } from './components/MainSection'
import { AuthProvider } from './context/AuthContext'

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <MainSection />
    </AuthProvider>
  )
}

export default App
