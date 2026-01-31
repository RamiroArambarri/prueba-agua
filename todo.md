Tengo este código de React con three.js, y no entiendo por qué en el navegador dibuja el #root con un max-width de 1280 px y un padding de 2 rem:

//App.jsx:

import { useState } from 'react'
import { Canvas } from '@react-three/fiber'

import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Canvas>
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </Canvas>
  )
}

export default App

//index.css

body {
  margin: 0;
}
#root {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  max-width: none;
}