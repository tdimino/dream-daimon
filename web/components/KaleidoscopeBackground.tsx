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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2() },
        dimension: { value: 0 },
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
        uniform int dimension;
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
          uv *= 1.0; // Fixed trippiness value
          
          float t = time * 0.1;
          vec3 col = vec3(0.0);
          
          if (dimension == 0) { // Cellophane Flowers
            uv = rotate(uv, t);
            float f = fractal(uv * 3.0);
            col = mix(color1, color2, f);
            col += color3 * sin(length(uv) * 20.0 - t * 5.0) * 0.5;
          } else if (dimension == 1) { // Tangerine Trees
            uv = rotate(uv, sin(t) * 0.5);
            float f = fractal(uv * 2.0 + vec2(sin(t), cos(t)));
            col = mix(color2, color3, f);
            col += color1 * sin(atan(uv.y, uv.x) * 10.0 + t * 3.0) * 0.5;
          } else if (dimension == 2) { // Marmalade Skies
            float a = atan(uv.y, uv.x);
            float r = length(uv);
            uv = vec2(a / (2.0*PI) + 0.5 + t * 0.1, r);
            float f = fractal(uv * 5.0);
            col = mix(color3, color1, f);
            col += color2 * sin(r * 30.0 - t * 4.0) * 0.5;
          } else if (dimension == 3) { // Kaleidoscope Eyes
            uv = rotate(uv, t * 0.2);
            vec2 q = vec2(atan(uv.y, uv.x) / PI, length(uv));
            q = fract(q * 8.0);
            float f = fractal(q);
            col = mix(color1, color2, f);
            col += color3 * sin(length(q) * 40.0 - t * 6.0) * 0.5;
          } else if (dimension == 4) { // Looking Glass Ties
            uv = rotate(uv, sin(t * 0.5) * PI);
            float f = fractal(uv * 4.0 + vec2(cos(t), sin(t)));
            col = mix(color2, color3, f);
            col += color1 * sin(dot(uv, vec2(cos(t), sin(t))) * 20.0) * 0.5;
          }
          
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
      if (canvas && rendererRef.current && materialRef.current) {
        const { clientWidth, clientHeight } = canvas;
        rendererRef.current.setSize(clientWidth, clientHeight);
        materialRef.current.uniforms.resolution.value.set(clientWidth, clientHeight);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const animate = (time: number) => {
      if (isActive && materialRef.current && rendererRef.current && sceneRef.current && cameraRef.current) {
        materialRef.current.uniforms.time.value = time * 0.001;
        
        // Alternate dimensions every 5 seconds
        materialRef.current.uniforms.dimension.value = Math.floor(time * 0.0002) % 5;
        
        // Slowly change colors
        const hue = (time * 0.0001) % 1;
        materialRef.current.uniforms.color1.value.setHSL(hue, 0.5, 0.5);
        materialRef.current.uniforms.color2.value.setHSL((hue + 0.33) % 1, 0.5, 0.5);
        materialRef.current.uniforms.color3.value.setHSL((hue + 0.66) % 1, 0.5, 0.5);

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isActive) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
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
  }, [isActive]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full transition-opacity duration-500 ${
        isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden="true"
    />
  );
};

export default KaleidoscopeBackground;
