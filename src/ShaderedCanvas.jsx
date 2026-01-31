import { useRef, useEffect, useLayoutEffect } from 'react'

export const ShaderedCanvas = ({ onMouseMove, vertexSource, fragmentSource, onRender, onShaderLoad, cleanUp }) => {
    const canvasRef = useRef(null)
    const glRef = useRef(null)
    const glHandler = useRef(null)


    useEffect(() => {
        if (!canvasRef.current) { return }

        setUpGl()

        return () => {
            if (glHandler.current) {
                glHandler.current.clean()
            }
        }
    }, [])




    const setUpGl = () => {
        const $canvas = canvasRef.current
        glRef.current = $canvas.getContext('webgl')

        if (!glRef.current) {
            console.error('No se pudo inicializar webgl')
        }
        resize($canvas, glRef.current, glHandler)

        glHandler.current = new GlHandler(canvasRef.current, glRef.current, onRender, onShaderLoad, cleanUp)
        glHandler.current.startShader(vertexSource, fragmentSource)
    }

    useCanvasSize(canvasRef, glRef, glHandler)

    return (<canvas onMouseMove={onMouseMove} ref={canvasRef} width={1920} height={1080}></canvas>)
}

const resize = ($canvas, gl) => {
    if (!gl || !$canvas) { return }
    const { width, height } = $canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    $canvas.width = Math.round(width * dpr);
    $canvas.height = Math.round(height * dpr);

    gl.viewport(0, 0, $canvas.width, $canvas.height);

};

const useCanvasSize = (canvasRef, glRef, glHandler) => {
    useLayoutEffect(() => {
        const $canvas = canvasRef.current;
        if (!$canvas) return;
        const gl = glRef.current
        if (!gl) return;

        const observer = new ResizeObserver(() => { resize($canvas, gl, glHandler) });
        observer.observe($canvas);

        return () => observer.disconnect();
    }, [canvasRef, glRef]);
}

class GlHandler {
    constructor($canvas, gl, onRender, onShaderLoad, cleanUp) {
        this.$canvas = $canvas
        this.gl = gl
        this.program
        this.onRender = onRender
        this.loopId
        this.buffer
        this.onShaderLoad = onShaderLoad
        this.cleanUp = cleanUp
        this.height = $canvas.height
    }

    compileShader = (source, type) => {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            const compileError = this.gl.getShaderInfoLog(shader)
            console.error("Error al compilar shader:", this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return { ok: false, shader: undefined, meta: compileError };
        }
        return { ok: true, shader: shader, meta: undefined };
    }

    setUpProgram = (vertexSource, fragmentSource) => {
        let vertexShader
        let fragmentShader
        const vertexResponse = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
        if (vertexResponse.ok) {
            vertexShader = vertexResponse.shader
        } else {
            return vertexResponse.meta
        }

        const fragmentResponse = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);
        if (fragmentResponse.ok) {
            fragmentShader = fragmentResponse.shader
        } else {
            return fragmentResponse.meta
        }

        this.program = this.gl.createProgram();
        const program = this.program
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);
        this.gl.linkProgram(program);

        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {

            console.error("Error al linkear el programa:", this.gl.getProgramInfoLog(program));
            return this.gl.getProgramInfoLog(program)
        }
        this.gl.useProgram(program);

        return 0
    }

    startShader = (vertexSource, fragmentSource) => {
        this.setUpProgram(vertexSource, fragmentSource)

        const quadVertices = new Float32Array([
            -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,
            1.0, -1.0, 1.0, 1.0, -1.0, 1.0
        ]);

        const quadBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

        this.onShaderLoad(this.gl, this.program, this.$canvas, this.width, this.height)

        this.gl.clearColor(0, 0, 0, 1);
        this.render()
    }

    render = () => {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.onRender(this.gl, this.$canvas)
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        this.loopId = requestAnimationFrame(this.render);
    }

    clean = () => {
        cancelAnimationFrame(this.loopId)
        this.gl.deleteProgram(this.program)
        if (!cleanUp) { return }
        this.cleanUp(this.gl)
    }
}