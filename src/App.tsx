import { useState } from 'react'

import './App.css'
import { Navbar } from './components/Navbar'
import { MainSection } from './components/MainSection'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <MainSection />
    </>
  )
}

export default App
