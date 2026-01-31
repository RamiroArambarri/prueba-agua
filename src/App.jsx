// App.jsx
import * as THREE from 'three'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import { useMemo, useRef, useState } from 'react'
import { TextureLoader } from 'three'


function PingPongPass({ fragmentShader, uniforms, textureRef }) {
  const { gl, size } = useThree()
  const fboA = useFBO(size.width/4, size.height/4, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  })
  const fboB = useFBO(size.width/4, size.height/4, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  }
  )
  const ping = useRef(true)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader,
      }),
    [fragmentShader, uniforms]
  )

  const scene = useMemo(() => {
    const s = new THREE.Scene()
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      material
    )
    s.add(quad)
    return s
  }, [material])

  const camera = useMemo(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  )

  useFrame(({ clock }) => {
    const numSteps = 6.;
    for (let i = 0; i < numSteps; i++) {
      uniforms.uTime.value = clock.elapsedTime
      uniforms.uTexture.value = ping.current
        ? fboB.texture
        : fboA.texture

      const target = ping.current ? fboA : fboB
      gl.setRenderTarget(target)
      gl.render(scene, camera)
      gl.setRenderTarget(null)

      ping.current = !ping.current
      textureRef.current = ping.current ? fboB.texture : fboA.texture
    }
  })

  return null
}

export default function App() {
  const mouse = useRef({ value: [] })
  const [rotationX, setRotationX] = useState(0)
  const [rotationY, setRotationY] = useState(0)
  const handleMouseMove = (ev) => {
    mouse.current[0] = ev.clientX
    mouse.current[1] = ev.clientY

    setRotationX(-Number(ev.clientX) / 100)
    setRotationY(Number(ev.clientY) / 100)
  }
  const div1Ref = useRef(null)

  return (
    <>
{/*       <div ref={div1Ref} style={{ zIndex: '10', position: 'absolute', top: '300px', left: '300px', width: '100px', height: '100px', outline: "solid black 2px" }}>
      </div> */}
      <Canvas orthographic camera={{
        zoom: 1,
        position: [0, 0, 1000],
        near: -2000,
        far: 2000,
      }} onMouseMove={handleMouseMove}>


        <directionalLight intensity={12.5} position={[1000, -1000, 1000]} />
        {/*  <mesh rotation-y={rotationX} rotation-x={rotationY} position={[0, 0, 1000]}>
          <boxGeometry args={[600, 300, 100]} />
          <meshPhysicalMaterial
            transparent

            opacity={.3}
            roughness={0}
            ior={1.5}
            envMapIntensity={1}
            thickness={1} />
        </mesh> */}
        <Background mouse={mouse} />

      </Canvas >
    </>
  )
}

const Background = ({ mouse }) => {


  const normMouse = useRef({ value: [0, 0] })
  const normPrevMouse = useRef({ value: [0, 0] })
  const dt = useRef({ value: 0 })
  const resolution = useRef({ value: [0, 0] })
  const textureRef = useRef(null)
  const pingUniforms = useRef({
    uTexture: { value: null },
    uTime: { value: 0 },
    uDecay: { value: 0.99 },
    uStrength: { value: 0.01 },
    uMouse: normMouse.current,
    uPrevMouse: normPrevMouse.current,
    uPix: resolution.current,
    dt: dt.current
  })

  useFrame((state, deltaTime) => {
    normPrevMouse.current.value = [...normMouse.current.value]
    normMouse.current.value[0] = state.pointer.x * .5 + .5
    normMouse.current.value[1] = state.pointer.y * .5 + .5
    resolution.current.value[0] = 1 / state.size.width
    resolution.current.value[1] = 1 / state.size.height
    dt.current.value = Math.min(deltaTime, 1 / 50)

  })

  const pingPongShader = /* glsl */`
    varying vec2 vUv;
    uniform sampler2D uTexture;
    uniform float uTime;
    uniform vec2 uPix;
    uniform vec2 uMouse;
    uniform vec2 uPrevMouse;
    uniform float dt;

  float segment_distance(vec2 p, vec2 p1, vec2 p2) {
    if(length(p1-p2) < 0.001) {
      return length(p-p1);
    }
    float comp = dot(p, normalize(p2-p1));
    float compA = dot(p1, normalize(p2-p1));
    float compB = dot(p2, normalize(p2-p1));
    float a = step( + comp,compA);
    float b = step(compB, comp);
    
    float grad = (-comp+ compA)*(a) + b*(compB - comp) + comp - compA;
    vec2 difVec = p - normalize(p2-p1)*grad;

    return length(difVec-p1);
}

    void main() {
      float asp = uPix.x/uPix.y;
      vec2 uv = vec2(vUv.x, vUv.y*asp);
      vec2 mouse = vec2(uMouse.x, uMouse.y*asp);
      vec2 prevMouse = vec2(uPrevMouse.x, uPrevMouse.y*asp);

      vec2 uPix2 =  vec2(uPix.x,uPix.y);
      vec4 prev = texture2D(uTexture, vec2(vUv.x, vUv.y));
      vec4 prevTop = texture2D(uTexture, vec2(vUv.x, vUv.y - uPix2.y));
      vec4 prevBottom = texture2D(uTexture, vec2(vUv.x, vUv.y + uPix2.y));
      vec4 prevLeft = texture2D(uTexture, vec2(vUv.x - uPix2.x, vUv.y));
      vec4 prevRight = texture2D(uTexture, vec2(vUv.x + uPix2.x, vUv.y));
      float impulse = 0.;
      float damp = 1.;
      float k = 1000.;
      


      float acc = (- 4.* prev.x + prevTop.x + prevBottom.x + prevLeft.x + prevRight.x)*k - (prev.y - .5)*damp;
      float vel = ( prev.y - .5) + acc*dt;
      float pos = (prev.x - .5) + vel*dt;

      float dist = segment_distance(uv, prevMouse, mouse);

      float coef = exp(-pow((dist*100.), 2.))*1.;
      //coef = 0.;
      pos = pos*(1.-coef) + .001*coef;
      pos = pos*(pow(uv.x, .0005)*pow(1.-uv.x, .0005));
      vel = vel*(pow(uv.x, .0005)*pow(1.-uv.x, .0005));
      vel = clamp(vel, -.5, .5);
      pos = clamp(pos, -.5, .5);

      
      if(uTime < .1) {
        gl_FragColor = vec4(.5, .5, 1., 1.);
      } else {
        gl_FragColor = vec4(pos + .5,vel + .5, 1.,1.);//vec4(pos + .5,vel + .5, dist*1., 1.);
      }
    }
  `

  return (
    <>
      <PingPongPass fragmentShader={pingPongShader} textureRef={textureRef} uniforms={pingUniforms.current} />
      <mesh>
        <ScreenQuad textureRef={textureRef}
        />
      </mesh>
    </>
  )
}

function ScreenQuad({ textureRef }) {
  const materialRef = useRef()

  const screenVS = /* glsl */  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `

  const screenFS = /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uTexture;

    void main() {
      vec2 uv = vUv;
      vec4 prev = texture2D(uTexture, vUv);
      vec4 prevL = texture2D(uTexture, vec2(vUv.x-0.01, vUv.y));
      vec4 prevT = texture2D(uTexture, vec2(vUv.x, vUv.y-0.01));
      float dx = prev.x-prevL.x;
      float dy = prev.x-prevT.x;

      float lightA = abs(dot(normalize(vec3(-3., -3.,1.)),normalize(cross(vec3(-0.01, 0, dx*100.), vec3(0, -0.01, dy*100.)))));
      
      float lightB = abs(dot(normalize(vec3(0.,0.,-1.)),normalize(cross(vec3(-0.01, 0, dx*100.), vec3(0, -0.01, dy*100.)))));
      float lightC = abs(dot(normalize(vec3(3., -3.,1.)),normalize(cross(vec3(-0.01, 0, dx*100.), vec3(0, -0.01, dy*100.)))));

      float light = (lightA + lightB*.1);
      float scale = 600.;
      vec3 colLightA = vec3(0.,1.,1.);
      vec3 colLightB = vec3(1.,1.,2.);
      vec4 col = vec4(lightA*colLightA + lightB*colLightB*.1 + pow(lightA, 10.)*vec3(1.,1.,1.), 1.);
      prev.xy = (prev.xy - .5)*scale + .5;  
      gl_FragColor = vec4(col);
    }
  `


  useFrame(() => {
    if (materialRef.current && textureRef.current) {
      materialRef.current.uniforms.uTexture.value = textureRef.current
    }
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} position={[0, 0, 0]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTexture: { value: null } }}
        vertexShader={screenVS}
        fragmentShader={screenFS}
      />
    </mesh>
  )
}



function HtmlAnchor({ htmlRef, children }) {
  const groupRef = useRef()
  const { size } = useThree()

  useFrame(() => {
    if (!htmlRef.current || !groupRef.current) return

    const rect = htmlRef.current.getBoundingClientRect()

    const x = rect.left - size.width / 2
    const y = size.height / 2 - rect.top

    groupRef.current.position.set(x, y, 0)
  })

  return <group ref={groupRef}>{children}</group>
}