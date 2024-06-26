import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface KaleidoscopeBackgroundProps {
  isActive: boolean;
}

const KaleidoscopeBackground: React.FC<KaleidoscopeBackgroundProps> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current, antialias: true });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() },
        color1: { value: new THREE.Color(0xFF6B6B) },
        color2: { value: new THREE.Color(0x4ECDC4) },
        color3: { value: new THREE.Color(0xFFD93D) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        uniform vec3 color1;
        uniform vec3 color2;
        uniform vec3 color3;
        varying vec2 vUv;

        #define PI 3.14159265359

        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        vec2 rotate(vec2 v, float a) {
          float s = sin(a);
          float c = cos(a);
          mat2 m = mat2(c, -s, s, c);
          return m * v;
        }

        float fractal(vec2 p) {
          float t = 0.0;
          for(int i = 0; i < 8; i++) {
            p = abs(p) / dot(p,p) - 1.0;
            t += exp(-5.0 * abs(length(p) - 0.6));
          }
          return t;
        }

        void main() {
          vec2 uv = (gl_FragCoord.xy - 0.5 * resolution.xy) / resolution.y;
          uv *= 1.0;
          
          float t = time * 0.1;
          vec3 col = vec3(0.0);
          
          uv = rotate(uv, t * 0.2);
          vec2 q = vec2(atan(uv.y, uv.x) / PI, length(uv));
          q = fract(q * 8.0);
          float f = fractal(q);
          col = mix(color1, color2, f);
          col += color3 * sin(length(q) * 40.0 - t * 6.0) * 0.5;
          
          col += 0.05 * vec3(random(uv + t), random(uv + t + 1.0), random(uv + t + 2.0));
          
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    camera.position.z = 1;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    materialRef.current = material;

    const handleResize = () => {
      if (canvasRef.current && rendererRef.current && materialRef.current) {
        const { clientWidth, clientHeight } = canvasRef.current;
        rendererRef.current.setSize(clientWidth, clientHeight);
        materialRef.current.uniforms.resolution.value.set(clientWidth, clientHeight);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (materialRef.current) {
        materialRef.current.dispose();
      }
      if (geometry) {
        geometry.dispose();
      }
    };
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = (time: number) => {
      if (isActive && materialRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        materialRef.current.uniforms.time.value = time * 0.001;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive]);

  const changeColors = () => {
    if (materialRef.current) {
      materialRef.current.uniforms.color1.value.setHSL(Math.random(), 0.5, 0.5);
      materialRef.current.uniforms.color2.value.setHSL(Math.random(), 0.5, 0.5);
      materialRef.current.uniforms.color3.value.setHSL(Math.random(), 0.5, 0.5);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    />
  );
};

export default KaleidoscopeBackground;
