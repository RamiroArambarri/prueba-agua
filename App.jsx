import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import vertexSource from './shaders/shader.vert?raw'
import fragmentSource from './shaders/shader.frag?raw'
import { ShaderedCanvas } from './ShaderedCanvas'


function App() {
  const ctxRef = useRef(null)
  const programRef = useRef(null)
  const mouse = useRef(null)
  const mouseMovedHandler = (ev) => { mouse.current = [ev.clientX, ev.clientY] }


  return (
    <ShaderedCanvas onMouseMove={mouseMovedHandler} glRef={ctxRef} vertexSource={vertexSource} fragmentSource={fragmentSource} programRef={programRef}
      renderFunction={() => {
        const location = ctxRef.current.getUniformLocation(programRef.current, 'mouse')
        if (!mouse.current) return;
        ctxRef.current.uniform2f(location, ...mouse.current);
      }}
    />
  )
}

export default App


